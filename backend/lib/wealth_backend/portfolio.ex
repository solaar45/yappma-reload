defmodule WealthBackend.Portfolio do
  @moduledoc """
  The Portfolio context.
  """

  import Ecto.Query, warn: false
  alias WealthBackend.Repo

  alias WealthBackend.Portfolio.Asset
  alias WealthBackend.Portfolio.AssetType
  alias WealthBackend.Portfolio.SecurityAsset
  alias WealthBackend.Portfolio.InsuranceAsset
  alias WealthBackend.Portfolio.LoanAsset
  alias WealthBackend.Portfolio.RealEstateAsset
  alias WealthBackend.Portfolio.RiskClassifier
  alias WealthBackend.Analytics.AssetSnapshot
  alias Yappma.Services.SecurityValidator

  require Logger

  # Asset Types

  def list_asset_types do
    Repo.all(AssetType)
  end

  def get_asset_type!(id), do: Repo.get!(AssetType, id)

  def get_asset_type_by_code(code) do
    Repo.get_by(AssetType, code: code)
  end

  # Assets

  def list_assets(user_id) do
    Asset
    |> where([a], a.user_id == ^user_id)
    |> Repo.all()
    |> Repo.preload([
      :asset_type,
      [account: :institution],
      :security_asset,
      :insurance_asset,
      :loan_asset,
      :real_estate_asset,
      snapshots: from(s in AssetSnapshot, order_by: [desc: s.snapshot_date])
    ])
  end

  def list_user_assets(user_id) do
    from(a in Asset,
      where: a.user_id == ^user_id,
      order_by: [desc: a.inserted_at]
    )
    |> Repo.all()
    |> Repo.preload([
      :asset_type,
      [account: :institution],
      :security_asset,
      :insurance_asset,
      :loan_asset,
      :real_estate_asset,
      snapshots: from(s in AssetSnapshot, order_by: [desc: s.snapshot_date])
    ])
  end

  def get_asset!(id, user_id) do
    Asset
    |> where([a], a.id == ^id and a.user_id == ^user_id)
    |> Repo.one!()
    |> Repo.preload([
      :asset_type,
      [account: :institution],
      :security_asset,
      :insurance_asset,
      :loan_asset,
      :real_estate_asset,
      snapshots: from(s in AssetSnapshot, order_by: [desc: s.snapshot_date])
    ])
  end

  def create_asset(user_id, attrs \\ %{}) do
    # Normalize keys to strings and determine risk class before creating asset
    attrs =
      attrs
      |> stringify_keys()
      |> Map.put("user_id", user_id)
      |> enrich_with_risk_class()

    %Asset{}
    |> Asset.changeset(attrs)
    |> Repo.insert()
  end

  def create_full_asset(user_id, attrs \\ %{}) do
    # Normalize keys to strings and determine risk class before creating asset
    attrs =
      attrs
      |> stringify_keys()
      |> Map.put("user_id", user_id)
      |> enrich_with_risk_class()

    # Validate security if needed
    with {:ok, _validation_result} <- validate_security_if_needed(attrs) do
      Ecto.Multi.new()
      |> Ecto.Multi.insert(:asset, Asset.changeset(%Asset{}, attrs))
      |> Ecto.Multi.run(:subtype, fn _repo, %{asset: asset} ->
        create_asset_subtype(asset, attrs)
      end)
      |> Repo.transaction()
      |> case do
        {:ok, %{asset: asset}} ->
          {:ok, Repo.preload(asset, [
            :asset_type,
            [account: :institution],
            :security_asset,
            :insurance_asset,
            :loan_asset,
            :real_estate_asset,
            snapshots: from(s in AssetSnapshot, order_by: [desc: s.snapshot_date])
          ])}

        {:error, _failed_operation, changeset, _changes_so_far} ->
          {:error, changeset}
      end
    else
      {:error, :security_not_found} ->
        Logger.warning("Security validation failed: security not found")
        {:error, :security_not_found}

      {:error, reason} ->
        Logger.error("Security validation failed: #{inspect(reason)}")
        {:error, :validation_failed}
    end
  end

  # Validate security identifier (ticker or ISIN) if this is a security asset
  defp validate_security_if_needed(attrs) do
    asset_type_id = attrs["asset_type_id"]

    if asset_type_id do
      asset_type = get_asset_type!(asset_type_id)

      if asset_type.code == "security" do
        identifier = get_security_identifier(attrs)
        validate_security_identifier(identifier)
      else
        {:ok, :not_security}
      end
    else
      {:ok, :no_asset_type}
    end
  end

  # Get the security identifier (ticker or ISIN) from attrs
  defp get_security_identifier(attrs) do
    security_data = attrs["security_asset"] || %{}

    cond do
      # Prefer ticker
      is_binary(security_data["ticker"]) and String.trim(security_data["ticker"]) != "" ->
        String.trim(security_data["ticker"])

      # Fall back to ISIN
      is_binary(security_data["isin"]) and String.trim(security_data["isin"]) != "" ->
        String.trim(security_data["isin"])

      # No identifier provided
      true ->
        nil
    end
  end

  # Validate the security identifier using SecurityValidator
  defp validate_security_identifier(nil) do
    # No identifier provided - skip validation
    Logger.debug("No security identifier provided, skipping validation")
    {:ok, :skip_validation}
  end

  defp validate_security_identifier(identifier) do
    Logger.info("Validating security identifier: #{identifier}")

    case SecurityValidator.validate(identifier) do
      {:ok, :skip_validation} ->
        {:ok, :skip_validation}

      {:ok, _security_data} ->
        Logger.info("Security #{identifier} validated successfully")
        {:ok, :validated}

      {:error, :not_found} ->
        Logger.warning("Security #{identifier} not found in FMP API")
        {:error, :security_not_found}

      {:error, reason} ->
        Logger.error("Security validation error for #{identifier}: #{inspect(reason)}")
        {:error, :validation_failed}
    end
  end

  defp enrich_with_risk_class(attrs) when is_map(attrs) do
    # Normalize to string keys first
    attrs = if is_struct(attrs), do: Map.from_struct(attrs), else: attrs

    # Determine if we have string or atom keys
    has_string_keys = Map.has_key?(attrs, "asset_type_id")
    has_atom_keys = Map.has_key?(attrs, :asset_type_id)

    # Check if risk_class already manually provided
    has_manual_risk = cond do
      has_string_keys -> Map.has_key?(attrs, "risk_class")
      has_atom_keys -> Map.has_key?(attrs, :risk_class)
      true -> false
    end

    if has_manual_risk do
      # User provided manual risk_class, set source to "manual"
      if has_string_keys do
        Map.put(attrs, "risk_class_source", "manual")
      else
        Map.put(attrs, :risk_class_source, "manual")
      end
    else
      # Auto-determine risk class
      # Get asset type code
      asset_type_id = cond do
        has_string_keys -> attrs["asset_type_id"]
        has_atom_keys -> attrs[:asset_type_id]
        true -> nil
      end

      asset_type_code = if asset_type_id do
        case get_asset_type!(asset_type_id) do
          %{code: code} -> code
          _ -> nil
        end
      else
        nil
      end

      # Get ISIN/symbol if available
      identifier = cond do
        has_string_keys ->
          attrs["symbol"] || get_in(attrs, ["security_asset", "isin"])
        has_atom_keys ->
          attrs[:symbol] || get_in(attrs, [:security_asset, :isin])
        true -> nil
      end

      {risk_class, source} = RiskClassifier.determine_risk_class(asset_type_code, identifier)

      # Add keys in the same format as input
      if has_string_keys do
        attrs
        |> Map.put("risk_class", risk_class)
        |> Map.put("risk_class_source", source)
      else
        attrs
        |> Map.put(:risk_class, risk_class)
        |> Map.put(:risk_class_source, source)
      end
    end
  end

  defp create_asset_subtype(asset, attrs) do
    asset_type = Repo.get!(AssetType, asset.asset_type_id)

    # Determine if attrs uses string or atom keys
    has_string_keys = Map.has_key?(attrs, "asset_type_id")

    case asset_type.code do
      "security" ->
        if security_attrs = attrs[:security_asset] || attrs["security_asset"] do
          # Add asset_id in the same key format as the rest of attrs
          security_attrs = if has_string_keys do
            Map.put(security_attrs, "asset_id", asset.id)
          else
            Map.put(security_attrs, :asset_id, asset.id)
          end

          %SecurityAsset{}
          |> SecurityAsset.changeset(security_attrs)
          |> Repo.insert()
        else
          {:ok, nil}
        end

      "insurance" ->
        if insurance_attrs = attrs[:insurance_asset] || attrs["insurance_asset"] do
          insurance_attrs = if has_string_keys do
            Map.put(insurance_attrs, "asset_id", asset.id)
          else
            Map.put(insurance_attrs, :asset_id, asset.id)
          end

          %InsuranceAsset{}
          |> InsuranceAsset.changeset(insurance_attrs)
          |> Repo.insert()
        else
          {:ok, nil}
        end

      "loan" ->
        if loan_attrs = attrs[:loan_asset] || attrs["loan_asset"] do
          loan_attrs = if has_string_keys do
            Map.put(loan_attrs, "asset_id", asset.id)
          else
            Map.put(loan_attrs, :asset_id, asset.id)
          end

          %LoanAsset{}
          |> LoanAsset.changeset(loan_attrs)
          |> Repo.insert()
        else
          {:ok, nil}
        end

      "real_estate" ->
        if re_attrs = attrs[:real_estate_asset] || attrs["real_estate_asset"] do
          re_attrs = if has_string_keys do
            Map.put(re_attrs, "asset_id", asset.id)
          else
            Map.put(re_attrs, :asset_id, asset.id)
          end

          %RealEstateAsset{}
          |> RealEstateAsset.changeset(re_attrs)
          |> Repo.insert()
        else
          {:ok, nil}
        end

      _ ->
        {:ok, nil}
    end
  end

  def update_asset(%Asset{} = asset, attrs) do
    asset
    |> Asset.update_changeset(attrs)
    |> Repo.update()
  end

  def delete_asset(%Asset{} = asset) do
    Repo.delete(asset)
  end

  def change_asset(%Asset{} = asset, attrs \\ %{}) do
    Asset.changeset(asset, attrs)
  end

  # Recursively convert atom keys to strings to ensure consistent param keys for Ecto
  # Skip structs like Date, DateTime, Decimal, etc.
  defp stringify_keys(%{__struct__: _} = struct) do
    # Don't convert structs - they should remain as-is
    struct
  end

  defp stringify_keys(%{} = map) do
    map
    |> Enum.map(fn {k, v} ->
      key = if is_atom(k), do: Atom.to_string(k), else: k
      value = stringify_keys(v)
      {key, value}
    end)
    |> Enum.into(%{})
  end

  defp stringify_keys(list) when is_list(list) do
    Enum.map(list, &stringify_keys/1)
  end

  defp stringify_keys(other), do: other
end
