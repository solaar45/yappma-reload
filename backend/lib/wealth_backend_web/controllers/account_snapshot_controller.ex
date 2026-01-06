defmodule WealthBackendWeb.AccountSnapshotController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Analytics
  alias WealthBackend.Analytics.AccountSnapshot

  action_fallback WealthBackendWeb.FallbackController

  def index(conn, %{"account_id" => account_id}) do
    user = conn.assigns.current_user
    snapshots = Analytics.list_account_snapshots(account_id, user.id)
    render(conn, :index, snapshots: snapshots)
  end

  def create(conn, %{"snapshot" => snapshot_params}) do
    user = conn.assigns.current_user
    with {:ok, %AccountSnapshot{} = snapshot} <- Analytics.create_account_snapshot(user.id, snapshot_params) do
      conn
      |> put_status(:created)
      |> render(:show, snapshot: snapshot)
    end
  end

  # Accept direct params (from frontend)
  def create(conn, params) when is_map(params) do
    user = conn.assigns.current_user
    # Analytics.create_account_snapshot already adds user_id as atom key
    with {:ok, %AccountSnapshot{} = snapshot} <- Analytics.create_account_snapshot(user.id, params) do
      conn
      |> put_status(:created)
      |> render(:show, snapshot: snapshot)
    end
  end

  def show(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    snapshot = Analytics.get_account_snapshot!(id, user.id)
    render(conn, :show, snapshot: snapshot)
  end

  def update(conn, %{"id" => id, "snapshot" => snapshot_params}) do
    user = conn.assigns.current_user
    snapshot = Analytics.get_account_snapshot!(id, user.id)

    with {:ok, %AccountSnapshot{} = snapshot} <- Analytics.update_account_snapshot(snapshot, snapshot_params) do
      render(conn, :show, snapshot: snapshot)
    end
  end

  # Accept direct params (from frontend)
  def update(conn, %{"id" => id} = params) do
    user = conn.assigns.current_user
    snapshot = Analytics.get_account_snapshot!(id, user.id)
    snapshot_params = Map.drop(params, ["id"])

    with {:ok, %AccountSnapshot{} = snapshot} <- Analytics.update_account_snapshot(snapshot, snapshot_params) do
      render(conn, :show, snapshot: snapshot)
    end
  end

  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    snapshot = Analytics.get_account_snapshot!(id, user.id)

    with {:ok, %AccountSnapshot{}} <- Analytics.delete_account_snapshot(snapshot) do
      send_resp(conn, :no_content, "")
    end
  end
end
