defmodule WealthBackendWeb.AssetController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Portfolio
  alias WealthBackend.Portfolio.Asset

  action_fallback WealthBackendWeb.FallbackController

  def index(conn, _params) do
    user_id = conn.assigns.current_user_id
    assets = Portfolio.list_assets(user_id)
    render(conn, :index, assets: assets)
  end

  def create(conn, %{"asset" => asset_params}) do
    user_id = conn.assigns.current_user_id
    asset_params = Map.put(asset_params, "user_id", user_id)
    
    with {:ok, %Asset{} = asset} <- Portfolio.create_full_asset(asset_params) do
      conn
      |> put_status(:created)
      |> render(:show, asset: asset)
    end
  end

  def show(conn, %{"id" => id}) do
    user_id = conn.assigns.current_user_id
    asset = Portfolio.get_asset!(id)
    
    # Ensure asset belongs to authenticated user
    if asset.user_id == user_id do
      render(conn, :show, asset: asset)
    else
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Access denied"})
    end
  end

  def update(conn, %{"id" => id, "asset" => asset_params}) do
    user_id = conn.assigns.current_user_id
    asset = Portfolio.get_asset!(id)

    # Ensure asset belongs to authenticated user
    if asset.user_id == user_id do
      with {:ok, %Asset{} = asset} <- Portfolio.update_full_asset(asset, asset_params) do
        render(conn, :show, asset: asset)
      end
    else
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Access denied"})
    end
  end

  def delete(conn, %{"id" => id}) do
    user_id = conn.assigns.current_user_id
    asset = Portfolio.get_asset!(id)

    # Ensure asset belongs to authenticated user
    if asset.user_id == user_id do
      with {:ok, %Asset{}} <- Portfolio.delete_asset(asset) do
        send_resp(conn, :no_content, "")
      end
    else
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Access denied"})
    end
  end
end
