defmodule WealthBackendWeb.AssetController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Portfolio
  alias WealthBackend.Portfolio.Asset

  action_fallback WealthBackendWeb.FallbackController

  def index(conn, _params) do
    user = conn.assigns.current_user
    assets = Portfolio.list_assets(user.id)
    render(conn, :index, assets: assets)
  end

  def create(conn, %{"asset" => asset_params}) do
    user = conn.assigns.current_user
    
    with {:ok, %Asset{} = asset} <- Portfolio.create_full_asset(user.id, asset_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/assets/#{asset}")
      |> render(:show, asset: asset)
    end
  end

  def show(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    asset = Portfolio.get_asset!(id, user.id)
    render(conn, :show, asset: asset)
  end

  def update(conn, %{"id" => id, "asset" => asset_params}) do
    user = conn.assigns.current_user
    asset = Portfolio.get_asset!(id, user.id)

    with {:ok, %Asset{} = asset} <- Portfolio.update_asset(asset, asset_params) do
      render(conn, :show, asset: asset)
    end
  end

  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    asset = Portfolio.get_asset!(id, user.id)

    with {:ok, %Asset{}} <- Portfolio.delete_asset(asset) do
      send_resp(conn, :no_content, "")
    end
  end
end
