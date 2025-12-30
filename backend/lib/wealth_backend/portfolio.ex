defmodule WealthBackend.Portfolio do
  @moduledoc """
  The Portfolio context.
  """

  import Ecto.Query, warn: false
  alias WealthBackend.Repo
  alias WealthBackend.Portfolio.{Asset, AssetType, SecurityAsset, InsuranceAsset, LoanAsset, RealEstateAsset}

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
    Asset
    |> where([a], a.user_id == ^user_id)
    |> preload([:account, :asset_type, :security_asset, :insurance_asset, :loan_asset, :real_estate_asset])
    |> Repo.all()
  end

  def get_asset!(id) do
    Asset
    |> preload([:account, :asset_type, :security_asset, :insurance_asset, :loan_asset, :real_estate_asset])
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
        attrs
        |> Map.get(:security_asset, %{})
        |> Map.put(:asset_id, asset.id)
        |> then(&SecurityAsset.changeset(%SecurityAsset{}, &1))
        |> repo.insert()

      "insurance" ->
        attrs
        |> Map.get(:insurance_asset, %{})
        |> Map.put(:asset_id, asset.id)
        |> then(&InsuranceAsset.changeset(%InsuranceAsset{}, &1))
        |> repo.insert()

      "loan" ->
        attrs
        |> Map.get(:loan_asset, %{})
        |> Map.put(:asset_id, asset.id)
        |> then(&LoanAsset.changeset(%LoanAsset{}, &1))
        |> repo.insert()

      "real_estate" ->
        attrs
        |> Map.get(:real_estate_asset, %{})
        |> Map.put(:asset_id, asset.id)
        |> then(&RealEstateAsset.changeset(%RealEstateAsset{}, &1))
        |> repo.insert()

      _ ->
        # For cash and other types without specific fields
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
end
