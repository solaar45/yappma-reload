defmodule WealthBackendWeb.AssetSnapshotController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Analytics
  alias WealthBackend.Analytics.AssetSnapshot

  action_fallback WealthBackendWeb.FallbackController

  # List all asset snapshots for current user (latest per asset)
  def index(conn, %{}) do
    user_id = conn.assigns.current_user_id
    snapshots = Analytics.get_latest_asset_snapshots(user_id)
    render(conn, :index, snapshots: snapshots)
  end

  # List snapshots for a specific asset
  def index(conn, %{"asset_id" => asset_id}) do
    snapshots = Analytics.list_asset_snapshots(asset_id)
    render(conn, :index, snapshots: snapshots)
  end

  # Accept asset_snapshot key (from frontend)
  def create(conn, %{"asset_snapshot" => snapshot_params}) do
    with {:ok, %AssetSnapshot{} = snapshot} <- Analytics.create_asset_snapshot(snapshot_params) do
      conn
      |> put_status(:created)
      |> render(:show, snapshot: snapshot)
    end
  end

  # Accept snapshot key (backward compatibility)
  def create(conn, %{"snapshot" => snapshot_params}) do
    with {:ok, %AssetSnapshot{} = snapshot} <- Analytics.create_asset_snapshot(snapshot_params) do
      conn
      |> put_status(:created)
      |> render(:show, snapshot: snapshot)
    end
  end

  # Accept direct params
  def create(conn, params) when is_map(params) do
    with {:ok, %AssetSnapshot{} = snapshot} <- Analytics.create_asset_snapshot(params) do
      conn
      |> put_status(:created)
      |> render(:show, snapshot: snapshot)
    end
  end

  def show(conn, %{"id" => id}) do
    snapshot = Analytics.get_asset_snapshot!(id)
    render(conn, :show, snapshot: snapshot)
  end

  # Accept asset_snapshot key
  def update(conn, %{"id" => id, "asset_snapshot" => snapshot_params}) do
    snapshot = Analytics.get_asset_snapshot!(id)

    with {:ok, %AssetSnapshot{} = snapshot} <- Analytics.update_asset_snapshot(snapshot, snapshot_params) do
      render(conn, :show, snapshot: snapshot)
    end
  end

  # Accept snapshot key (backward compatibility)
  def update(conn, %{"id" => id, "snapshot" => snapshot_params}) do
    snapshot = Analytics.get_asset_snapshot!(id)

    with {:ok, %AssetSnapshot{} = snapshot} <- Analytics.update_asset_snapshot(snapshot, snapshot_params) do
      render(conn, :show, snapshot: snapshot)
    end
  end

  # Accept direct params
  def update(conn, %{"id" => id} = params) do
    snapshot = Analytics.get_asset_snapshot!(id)
    snapshot_params = Map.drop(params, ["id"])

    with {:ok, %AssetSnapshot{} = snapshot} <- Analytics.update_asset_snapshot(snapshot, snapshot_params) do
      render(conn, :show, snapshot: snapshot)
    end
  end

  def delete(conn, %{"id" => id}) do
    snapshot = Analytics.get_asset_snapshot!(id)

    with {:ok, %AssetSnapshot{}} <- Analytics.delete_asset_snapshot(snapshot) do
      send_resp(conn, :no_content, "")
    end
  end
end
