defmodule WealthBackend.Portfolio do
  @moduledoc """
  The Portfolio context.
  """

  import Ecto.Query, warn: false
  alias WealthBackend.Repo
  alias WealthBackend.Portfolio.{Asset, AssetType, SecurityAsset, InsuranceAsset, LoanAsset, RealEstateAsset}
  alias WealthBackend.Analytics.AssetSnapshot

  ## Asset Types

  def list_asset_types do
    Repo.all(AssetType)
  end

  def get_asset_type!(id), do: Repo.get!(AssetType, id)

  def get_asset_type_by_code(code) do
    Repo.get_by(AssetType, code: code)
  end

  def create_asset_type(attrs \\ %{}) do
    %AssetType{}
    |> AssetType.changeset(attrs)
    |> Repo.insert()
  end

  ## Assets

  def list_assets(user_id) do
    snapshots_query = from s in AssetSnapshot, order_by: [desc: s.snapshot_date]

    Asset
    |> where([a], a.user_id == ^user_id)
    |> preload([:account, :asset_type, :security_asset, :insurance_asset, :loan_asset, :real_estate_asset, snapshots: ^snapshots_query])
    |> Repo.all()
  end

  def get_asset!(id) do
    snapshots_query = from s in AssetSnapshot, order_by: [desc: s.snapshot_date]

    Asset
    |> preload([:account, :asset_type, :security_asset, :insurance_asset, :loan_asset, :real_estate_asset, snapshots: ^snapshots_query])
    |> Repo.get!(id)
  end

  @doc """
  Creates an asset with type-specific details.
  Expects attrs with asset base fields and a nested map for the specific type.
  Example: %{name: "My Stock", asset_type_id: 1, security_asset: %{isin: "..."}}
  """
  def create_full_asset(attrs \\ %{}) do
    Ecto.Multi.new()
    |> Ecto.Multi.insert(:asset, Asset.changeset(%Asset{}, attrs))
    |> Ecto.Multi.run(:type_specific, fn repo, %{asset: asset} ->
      create_type_specific_asset(repo, asset, attrs)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{asset: asset}} -> {:ok, get_asset!(asset.id)}
      {:error, :asset, changeset, _} -> {:error, changeset}
      {:error, :type_specific, changeset, _} -> {:error, changeset}
    end
  end

  defp create_type_specific_asset(repo, asset, attrs) do
    asset_type = repo.get!(AssetType, asset.asset_type_id)

    case asset_type.code do
      "security" ->
        security_attrs = get_nested_attrs(attrs, "security_asset")
        if map_size(security_attrs) > 0 do
          security_attrs
          |> stringify_keys()
          |> Map.put("asset_id", asset.id)
          |> then(&SecurityAsset.changeset(%SecurityAsset{}, &1))
          |> repo.insert()
        else
          {:ok, nil}
        end

      "insurance" ->
        insurance_attrs = get_nested_attrs(attrs, "insurance_asset")
        if map_size(insurance_attrs) > 0 do
          insurance_attrs
          |> stringify_keys()
          |> Map.put("asset_id", asset.id)
          |> then(&InsuranceAsset.changeset(%InsuranceAsset{}, &1))
          |> repo.insert()
        else
          {:ok, nil}
        end

      "loan" ->
        loan_attrs = get_nested_attrs(attrs, "loan_asset")
        if map_size(loan_attrs) > 0 do
          loan_attrs
          |> stringify_keys()
          |> Map.put("asset_id", asset.id)
          |> then(&LoanAsset.changeset(%LoanAsset{}, &1))
          |> repo.insert()
        else
          {:ok, nil}
        end

      "real_estate" ->
        re_attrs = get_nested_attrs(attrs, "real_estate_asset")
        if map_size(re_attrs) > 0 do
          re_attrs
          |> stringify_keys()
          |> Map.put("asset_id", asset.id)
          |> then(&RealEstateAsset.changeset(%RealEstateAsset{}, &1))
          |> repo.insert()
        else
          {:ok, nil}
        end

      _ ->
        # For cash and other types without specific fields
        {:ok, nil}
    end
  end

  @doc """
  Updates an asset with type-specific details.
  Handles updating both the base asset and related type-specific data (e.g., security_asset).
  Uses a transaction to ensure data consistency.
  Allows clearing optional fields by sending empty strings or nil.
  If optional fields are not sent, they will be set to nil (cleared).
  If no type-specific object is sent at all, all fields will be cleared.
  For security assets, ensures assets.symbol stays synced with security_assets.isin.
  """
  def update_full_asset(%Asset{} = asset, attrs) do
    Ecto.Multi.new()
    |> Ecto.Multi.update(:asset, Asset.changeset(asset, attrs))
    |> Ecto.Multi.run(:type_specific, fn repo, %{asset: updated_asset} ->
      update_type_specific_asset(repo, updated_asset, attrs)
    end)
    |> Ecto.Multi.run(:sync_symbol, fn repo, %{asset: updated_asset, type_specific: type_specific_result} ->
      sync_asset_symbol_with_isin(repo, updated_asset, type_specific_result)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{sync_symbol: asset}} -> {:ok, get_asset!(asset.id)}
      {:error, :asset, changeset, _} -> {:error, changeset}
      {:error, :type_specific, changeset, _} -> {:error, changeset}
      {:error, :sync_symbol, changeset, _} -> {:error, changeset}
    end
  end

  defp update_type_specific_asset(repo, asset, attrs) do
    asset_type = repo.get!(AssetType, asset.asset_type_id)

    case asset_type.code do
      "security" ->
        # Always process security_asset updates for security type
        security_attrs = 
          if has_nested_attrs?(attrs, "security_asset") do
            attrs
            |> get_nested_attrs("security_asset")
            |> normalize_security_attrs()
          else
            # If no security_asset object sent, clear all optional fields
            clear_all_security_fields()
          end
        
        case repo.get(SecurityAsset, asset.id) do
          nil ->
            # Create new security_asset if it doesn't exist and has data
            if has_any_value?(security_attrs) do
              security_attrs
              |> stringify_keys()
              |> Map.put("asset_id", asset.id)
              |> then(&SecurityAsset.changeset(%SecurityAsset{}, &1))
              |> repo.insert()
            else
              {:ok, nil}
            end

          security_asset ->
            # Update existing security_asset (including clearing fields)
            security_attrs
            |> stringify_keys()
            |> then(&SecurityAsset.changeset(security_asset, &1))
            |> repo.update()
        end

      "insurance" ->
        insurance_attrs = 
          if has_nested_attrs?(attrs, "insurance_asset") do
            attrs
            |> get_nested_attrs("insurance_asset")
            |> normalize_insurance_attrs()
          else
            clear_all_insurance_fields()
          end
        
        case repo.get(InsuranceAsset, asset.id) do
          nil ->
            if has_any_value?(insurance_attrs) do
              insurance_attrs
              |> stringify_keys()
              |> Map.put("asset_id", asset.id)
              |> then(&InsuranceAsset.changeset(%InsuranceAsset{}, &1))
              |> repo.insert()
            else
              {:ok, nil}
            end

          insurance_asset ->
            insurance_attrs
            |> stringify_keys()
            |> then(&InsuranceAsset.changeset(insurance_asset, &1))
            |> repo.update()
        end

      "loan" ->
        loan_attrs = 
          if has_nested_attrs?(attrs, "loan_asset") do
            attrs
            |> get_nested_attrs("loan_asset")
            |> normalize_loan_attrs()
          else
            clear_all_loan_fields()
          end
        
        case repo.get(LoanAsset, asset.id) do
          nil ->
            if has_any_value?(loan_attrs) do
              loan_attrs
              |> stringify_keys()
              |> Map.put("asset_id", asset.id)
              |> then(&LoanAsset.changeset(%LoanAsset{}, &1))
              |> repo.insert()
            else
              {:ok, nil}
            end

          loan_asset ->
            loan_attrs
            |> stringify_keys()
            |> then(&LoanAsset.changeset(loan_asset, &1))
            |> repo.update()
        end

      "real_estate" ->
        re_attrs = 
          if has_nested_attrs?(attrs, "real_estate_asset") do
            attrs
            |> get_nested_attrs("real_estate_asset")
            |> normalize_real_estate_attrs()
          else
            clear_all_real_estate_fields()
          end
        
        case repo.get(RealEstateAsset, asset.id) do
          nil ->
            if has_any_value?(re_attrs) do
              re_attrs
              |> stringify_keys()
              |> Map.put("asset_id", asset.id)
              |> then(&RealEstateAsset.changeset(%RealEstateAsset{}, &1))
              |> repo.insert()
            else
              {:ok, nil}
            end

          real_estate_asset ->
            re_attrs
            |> stringify_keys()
            |> then(&RealEstateAsset.changeset(real_estate_asset, &1))
            |> repo.update()
        end

      _ ->
        # For cash and other types without specific fields
        {:ok, nil}
    end
  end

  # Sync assets.symbol with security_assets.isin after update
  defp sync_asset_symbol_with_isin(repo, asset, type_specific_result) do
    asset_type = repo.get!(AssetType, asset.asset_type_id)
    
    if asset_type.code == "security" do
      # Get the updated security_asset to read the current isin value
      case type_specific_result do
        {:ok, %SecurityAsset{isin: isin}} ->
          # Update asset.symbol to match isin
          asset
          |> Asset.changeset(%{"symbol" => isin})
          |> repo.update()
        
        _ ->
          # If security_asset was deleted or is nil, clear symbol
          case repo.get(SecurityAsset, asset.id) do
            %SecurityAsset{isin: isin} ->
              asset
              |> Asset.changeset(%{"symbol" => isin})
              |> repo.update()
            
            nil ->
              asset
              |> Asset.changeset(%{"symbol" => nil})
              |> repo.update()
          end
      end
    else
      # For non-security assets, just return the asset unchanged
      {:ok, asset}
    end
  end

  # Return map with all security fields set to nil
  defp clear_all_security_fields do
    %{isin: nil, wkn: nil, ticker: nil, exchange: nil, sector: nil}
  end

  # Return map with all insurance fields set to nil
  defp clear_all_insurance_fields do
    %{insurer_name: nil, policy_number: nil, insurance_type: nil, payment_frequency: nil}
  end

  # Return map with all loan fields set to nil
  defp clear_all_loan_fields do
    %{interest_rate: nil, payment_frequency: nil, maturity_date: nil}
  end

  # Return map with all real estate fields set to nil
  defp clear_all_real_estate_fields do
    %{address: nil, size_m2: nil, purchase_price: nil, purchase_date: nil}
  end

  # Check if any field has a non-nil value
  defp has_any_value?(attrs) when is_map(attrs) do
    Enum.any?(attrs, fn {_key, value} -> value != nil end)
  end

  # Normalize security_asset attrs: set missing optional fields to nil
  defp normalize_security_attrs(attrs) do
    optional_fields = [:isin, :wkn, :ticker, :exchange, :sector, "isin", "wkn", "ticker", "exchange", "sector"]
    
    Enum.reduce(optional_fields, attrs, fn field, acc ->
      if Map.has_key?(attrs, field) do
        acc
      else
        Map.put(acc, field, nil)
      end
    end)
  end

  # Normalize insurance_asset attrs: set missing optional fields to nil
  defp normalize_insurance_attrs(attrs) do
    optional_fields = [:insurer_name, :policy_number, :insurance_type, :payment_frequency, "insurer_name", "policy_number", "insurance_type", "payment_frequency"]
    
    Enum.reduce(optional_fields, attrs, fn field, acc ->
      if Map.has_key?(attrs, field) do
        acc
      else
        Map.put(acc, field, nil)
      end
    end)
  end

  # Normalize loan_asset attrs: set missing optional fields to nil
  defp normalize_loan_attrs(attrs) do
    optional_fields = [:interest_rate, :payment_frequency, :maturity_date, "interest_rate", "payment_frequency", "maturity_date"]
    
    Enum.reduce(optional_fields, attrs, fn field, acc ->
      if Map.has_key?(attrs, field) do
        acc
      else
        Map.put(acc, field, nil)
      end
    end)
  end

  # Normalize real_estate_asset attrs: set missing optional fields to nil
  defp normalize_real_estate_attrs(attrs) do
    optional_fields = [:address, :size_m2, :purchase_price, :purchase_date, "address", "size_m2", "purchase_price", "purchase_date"]
    
    Enum.reduce(optional_fields, attrs, fn field, acc ->
      if Map.has_key?(attrs, field) do
        acc
      else
        Map.put(acc, field, nil)
      end
    end)
  end

  # Check if nested attrs key exists (even if the map is empty)
  defp has_nested_attrs?(attrs, key) when is_binary(key) do
    Map.has_key?(attrs, key) or Map.has_key?(attrs, String.to_atom(key))
  end

  # Helper to get nested attrs, supporting both string and atom keys
  defp get_nested_attrs(attrs, key) when is_binary(key) do
    Map.get(attrs, key, Map.get(attrs, String.to_atom(key), %{}))
  end

  # Convert all map keys to strings
  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end

  @doc """
  Updates an asset (simple version, without type-specific updates).
  For updating assets with type-specific data, use update_full_asset/2 instead.
  """
  def update_asset(%Asset{} = asset, attrs) do
    asset
    |> Asset.changeset(attrs)
    |> Repo.update()
  end

  def delete_asset(%Asset{} = asset) do
    Repo.delete(asset)
  end
end
