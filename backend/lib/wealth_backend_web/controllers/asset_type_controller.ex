defmodule WealthBackendWeb.AssetTypeController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Portfolio

  action_fallback WealthBackendWeb.FallbackController

  def index(conn, _params) do
    asset_types = Portfolio.list_asset_types()
    render(conn, :index, asset_types: asset_types)
  end

  def show(conn, %{"id" => id}) do
    asset_type = Portfolio.get_asset_type!(id)
    render(conn, :show, asset_type: asset_type)
  end
end
