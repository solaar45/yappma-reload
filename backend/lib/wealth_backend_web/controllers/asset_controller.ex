defmodule WealthBackendWeb.AssetController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Portfolio
  alias WealthBackend.Portfolio.Asset

  action_fallback WealthBackendWeb.FallbackController

  # TODO: Get user_id from authenticated session/JWT token
  @default_user_id 1

  def index(conn, params) do
    user_id = Map.get(params, "user_id", @default_user_id)
    assets = Portfolio.list_assets(user_id)
    render(conn, :index, assets: assets)
  end

  def create(conn, %{"asset" => asset_params} = params) do
    # Add default user_id if not provided
    asset_params = Map.put_new(asset_params, "user_id", Map.get(params, "user_id", @default_user_id))
    
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
    asset = Portfolio.get_asset!(id)

    with {:ok, %Asset{}} <- Portfolio.delete_asset(asset) do
      send_resp(conn, :no_content, "")
    end
  end
end
