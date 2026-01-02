defmodule WealthBackendWeb.AssetTypeController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Repo
  alias WealthBackend.Portfolio.AssetType

  action_fallback WealthBackendWeb.FallbackController

  @doc """
  List all asset types.
  Asset types are global and not user-specific.
  """
  def index(conn, _params) do
    asset_types = Repo.all(AssetType)
    render(conn, :index, asset_types: asset_types)
  end
end
