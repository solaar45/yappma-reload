defmodule WealthBackendWeb.AssetController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Portfolio
  alias WealthBackend.Portfolio.Asset
  alias WealthBackend.Repo

  action_fallback WealthBackendWeb.FallbackController

  def index(conn, %{"user_id" => user_id}) do
    assets = Portfolio.list_assets(user_id)
    render(conn, :index, assets: assets)
  end

  def create(conn, %{"asset" => asset_params}) do
    with {:ok, %Asset{} = asset} <- Portfolio.create_full_asset(asset_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/assets/#{asset}")
      |> render(:show, asset: asset)
    end
  end

  def show(conn, %{"id" => id}) do
    asset = Portfolio.get_asset!(id)
    render(conn, :show, asset: asset)
  end

  def update(conn, %{"id" => id, "asset" => asset_params}) do
    asset = Portfolio.get_asset!(id)

    with {:ok, %Asset{} = asset} <- Portfolio.update_full_asset(asset, asset_params) do
      render(conn, :show, asset: asset)
    end
  end

  def delete(conn, %{"id" => id}) do
    # Use Repo.get instead of get_asset! to avoid exception on missing asset
    case Repo.get(Asset, id) do
      nil ->
        # Asset already deleted or doesn't exist
        conn
        |> put_status(:not_found)
        |> put_view(json: WealthBackendWeb.ErrorJSON)
        |> render(:"404")

      asset ->
        with {:ok, %Asset{}} <- Portfolio.delete_asset(asset) do
          send_resp(conn, :no_content, "")
        end
    end
  end
end
