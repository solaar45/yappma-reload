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

  # Asset Types

  def list_asset_types do
    Repo.all(AssetType)
  end

  def get_asset_type!(id), do: Repo.get!(AssetType, id)

  def get_asset_type_by_code(code) do
    Repo.get_by(AssetType, code: code)
  end

  # Assets

  def list_assets do
    Repo.all(Asset)
    |> Repo.preload([:asset_type, :account, :security_asset, :insurance_asset, :loan_asset, :real_estate_asset])
  end

  def list_user_assets(user_id) do
    from(a in Asset,
      where: a.user_id == ^user_id,
      order_by: [desc: a.inserted_at]
    )
    |> Repo.all()
    |> Repo.preload([:asset_type, :account, :security_asset, :insurance_asset, :loan_asset, :real_estate_asset])
  end

  def get_asset!(id) do
    Repo.get!(Asset, id)
    |> Repo.preload([:asset_type, :account, :security_asset, :insurance_asset, :loan_asset, :real_estate_asset])
  end

  def create_asset(attrs \\ %{}) do
    # Determine risk class before creating asset
    attrs = enrich_with_risk_class(attrs)

    %Asset{}
    |> Asset.changeset(attrs)
    |> Repo.insert()
  end

  def create_full_asset(attrs \\ %{}) do
    # Determine risk class before creating asset
    attrs = enrich_with_risk_class(attrs)

    Ecto.Multi.new()
    |> Ecto.Multi.insert(:asset, Asset.changeset(%Asset{}, attrs))
    |> Ecto.Multi.run(:subtype, fn _repo, %{asset: asset} ->
      create_asset_subtype(asset, attrs)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{asset: asset}} ->
        {:ok, Repo.preload(asset, [:asset_type, :account, :security_asset, :insurance_asset, :loan_asset, :real_estate_asset])}

      {:error, _failed_operation, changeset, _changes_so_far} ->
        {:error, changeset}
    end
  end

  defp enrich_with_risk_class(attrs) do
    # Get asset type code
    asset_type_code = case attrs do
      %{"asset_type_id" => type_id} when not is_nil(type_id) ->
        case get_asset_type!(type_id) do
          %{code: code} -> code
          _ -> nil
        end
      %{asset_type_id: type_id} when not is_nil(type_id) ->
        case get_asset_type!(type_id) do
          %{code: code} -> code
          _ -> nil
        end
      _ -> nil
    end

    # Get ISIN/symbol if available
    identifier = attrs["symbol"] || attrs[:symbol] ||
                 get_in(attrs, ["security_asset", "isin"]) ||
                 get_in(attrs, [:security_asset, :isin])

    # Only auto-classify if risk_class not manually provided
    if is_nil(attrs["risk_class"]) and is_nil(attrs[:risk_class]) do
      {risk_class, source} = RiskClassifier.determine_risk_class(asset_type_code, identifier)

      attrs
      |> Map.put(:risk_class, risk_class)
      |> Map.put(:risk_class_source, source)
      |> Map.put("risk_class", risk_class)
      |> Map.put("risk_class_source", source)
    else
      attrs
    end
  end

  defp create_asset_subtype(asset, attrs) do
    asset_type = Repo.get!(AssetType, asset.asset_type_id)

    case asset_type.code do
      "security" ->
        if security_attrs = attrs[:security_asset] || attrs["security_asset"] do
          security_attrs = Map.put(security_attrs, :asset_id, asset.id)
          %SecurityAsset{}
          |> SecurityAsset.changeset(security_attrs)
          |> Repo.insert()
        else
          {:ok, nil}
        end

      "insurance" ->
        if insurance_attrs = attrs[:insurance_asset] || attrs["insurance_asset"] do
          insurance_attrs = Map.put(insurance_attrs, :asset_id, asset.id)
          %InsuranceAsset{}
          |> InsuranceAsset.changeset(insurance_attrs)
          |> Repo.insert()
        else
          {:ok, nil}
        end

      "loan" ->
        if loan_attrs = attrs[:loan_asset] || attrs["loan_asset"] do
          loan_attrs = Map.put(loan_attrs, :asset_id, asset.id)
          %LoanAsset{}
          |> LoanAsset.changeset(loan_attrs)
          |> Repo.insert()
        else
          {:ok, nil}
        end

      "real_estate" ->
        if re_attrs = attrs[:real_estate_asset] || attrs["real_estate_asset"] do
          re_attrs = Map.put(re_attrs, :asset_id, asset.id)
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
    |> Asset.changeset(attrs)
    |> Repo.update()
  end

  def delete_asset(%Asset{} = asset) do
    Repo.delete(asset)
  end

  def change_asset(%Asset{} = asset, attrs \\ %{}) do
    Asset.changeset(asset, attrs)
  end
end
