defmodule WealthBackendWeb.AssetSnapshotController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Analytics
  alias WealthBackend.Analytics.AssetSnapshot

  action_fallback WealthBackendWeb.FallbackController

  def index(conn, %{"asset_id" => asset_id}) do
    user = conn.assigns.current_user
    snapshots = Analytics.list_asset_snapshots(asset_id, user.id)
    render(conn, :index, snapshots: snapshots)
  end

  def create(conn, %{"snapshot" => snapshot_params}) do
    user = conn.assigns.current_user
    with {:ok, %AssetSnapshot{} = snapshot} <- Analytics.create_asset_snapshot(user.id, snapshot_params) do
      conn
      |> put_status(:created)
      |> render(:show, snapshot: snapshot)
    end
  end

  # Accept direct params (from frontend)
  def create(conn, params) when is_map(params) do
    user = conn.assigns.current_user
    with {:ok, %AssetSnapshot{} = snapshot} <- Analytics.create_asset_snapshot(user.id, params) do
      conn
      |> put_status(:created)
      |> render(:show, snapshot: snapshot)
    end
  end

  def show(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    snapshot = Analytics.get_asset_snapshot!(id, user.id)
    render(conn, :show, snapshot: snapshot)
  end

  def update(conn, %{"id" => id, "snapshot" => snapshot_params}) do
    user = conn.assigns.current_user
    snapshot = Analytics.get_asset_snapshot!(id, user.id)

    with {:ok, %AssetSnapshot{} = snapshot} <- Analytics.update_asset_snapshot(snapshot, snapshot_params) do
      render(conn, :show, snapshot: snapshot)
    end
  end

  # Accept direct params (from frontend)
  def update(conn, %{"id" => id} = params) do
    user = conn.assigns.current_user
    snapshot = Analytics.get_asset_snapshot!(id, user.id)
    snapshot_params = Map.drop(params, ["id"])

    with {:ok, %AssetSnapshot{} = snapshot} <- Analytics.update_asset_snapshot(snapshot, snapshot_params) do
      render(conn, :show, snapshot: snapshot)
    end
  end

  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    snapshot = Analytics.get_asset_snapshot!(id, user.id)

    with {:ok, %AssetSnapshot{}} <- Analytics.delete_asset_snapshot(snapshot) do
      send_resp(conn, :no_content, "")
    end
  end
end
