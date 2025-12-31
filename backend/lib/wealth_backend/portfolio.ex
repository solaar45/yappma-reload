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
  """
  def update_full_asset(%Asset{} = asset, attrs) do
    Ecto.Multi.new()
    |> Ecto.Multi.update(:asset, Asset.changeset(asset, attrs))
    |> Ecto.Multi.run(:type_specific, fn repo, %{asset: updated_asset} ->
      update_type_specific_asset(repo, updated_asset, attrs)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{asset: asset}} -> {:ok, get_asset!(asset.id)}
      {:error, :asset, changeset, _} -> {:error, changeset}
      {:error, :type_specific, changeset, _} -> {:error, changeset}
    end
  end

  defp update_type_specific_asset(repo, asset, attrs) do
    asset_type = repo.get!(AssetType, asset.asset_type_id)

    case asset_type.code do
      "security" ->
        # Check if security_asset key exists in attrs (even if empty)
        if has_nested_attrs?(attrs, "security_asset") do
          security_attrs = get_nested_attrs(attrs, "security_asset")
          
          case repo.get(SecurityAsset, asset.id) do
            nil ->
              # Create new security_asset if it doesn't exist and has data
              if map_size(security_attrs) > 0 do
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
        else
          {:ok, nil}
        end

      "insurance" ->
        if has_nested_attrs?(attrs, "insurance_asset") do
          insurance_attrs = get_nested_attrs(attrs, "insurance_asset")
          
          case repo.get(InsuranceAsset, asset.id) do
            nil ->
              if map_size(insurance_attrs) > 0 do
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
        else
          {:ok, nil}
        end

      "loan" ->
        if has_nested_attrs?(attrs, "loan_asset") do
          loan_attrs = get_nested_attrs(attrs, "loan_asset")
          
          case repo.get(LoanAsset, asset.id) do
            nil ->
              if map_size(loan_attrs) > 0 do
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
        else
          {:ok, nil}
        end

      "real_estate" ->
        if has_nested_attrs?(attrs, "real_estate_asset") do
          re_attrs = get_nested_attrs(attrs, "real_estate_asset")
          
          case repo.get(RealEstateAsset, asset.id) do
            nil ->
              if map_size(re_attrs) > 0 do
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
        else
          {:ok, nil}
        end

      _ ->
        # For cash and other types without specific fields
        {:ok, nil}
    end
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
