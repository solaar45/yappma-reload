defmodule WealthBackendWeb.AccountSnapshotController do
  use WealthBackendWeb, :controller
  require Logger

  alias WealthBackend.Analytics
  alias WealthBackend.Analytics.AccountSnapshot
  alias WealthBackend.Accounts

  action_fallback WealthBackendWeb.FallbackController

  # List all account snapshots for current user
  def index(conn, %{}) do
    user_id = conn.assigns.current_user_id
    
    # Get all accounts for this user
    accounts = Accounts.list_accounts(user_id)
    account_ids = Enum.map(accounts, & &1.id)
    
    Logger.debug("Fetching snapshots for user #{user_id}, account_ids: #{inspect(account_ids)}")
    
    # Get all snapshots for these accounts, ordered by date desc
    snapshots = Analytics.list_account_snapshots_by_user(account_ids)
    
    Logger.debug("Found #{length(snapshots)} snapshots")
    
    render(conn, :index, snapshots: snapshots)
  end

  # List snapshots for a specific account
  def index(conn, %{"account_id" => account_id}) do
    snapshots = Analytics.list_account_snapshots(account_id)
    render(conn, :index, snapshots: snapshots)
  end

  # Accept account_snapshot key (from frontend)
  def create(conn, %{"account_snapshot" => snapshot_params}) do
    with {:ok, %AccountSnapshot{} = snapshot} <- Analytics.create_account_snapshot(snapshot_params) do
      conn
      |> put_status(:created)
      |> render(:show, snapshot: snapshot)
    end
  end

  # Accept snapshot key (backward compatibility)
  def create(conn, %{"snapshot" => snapshot_params}) do
    with {:ok, %AccountSnapshot{} = snapshot} <- Analytics.create_account_snapshot(snapshot_params) do
      conn
      |> put_status(:created)
      |> render(:show, snapshot: snapshot)
    end
  end

  # Accept direct params
  def create(conn, params) when is_map(params) do
    with {:ok, %AccountSnapshot{} = snapshot} <- Analytics.create_account_snapshot(params) do
      conn
      |> put_status(:created)
      |> render(:show, snapshot: snapshot)
    end
  end

  def show(conn, %{"id" => id}) do
    snapshot = Analytics.get_account_snapshot!(id)
    render(conn, :show, snapshot: snapshot)
  end

  # Accept account_snapshot key
  def update(conn, %{"id" => id, "account_snapshot" => snapshot_params}) do
    snapshot = Analytics.get_account_snapshot!(id)

    with {:ok, %AccountSnapshot{} = snapshot} <- Analytics.update_account_snapshot(snapshot, snapshot_params) do
      render(conn, :show, snapshot: snapshot)
    end
  end

  # Accept snapshot key (backward compatibility)
  def update(conn, %{"id" => id, "snapshot" => snapshot_params}) do
    snapshot = Analytics.get_account_snapshot!(id)

    with {:ok, %AccountSnapshot{} = snapshot} <- Analytics.update_account_snapshot(snapshot, snapshot_params) do
      render(conn, :show, snapshot: snapshot)
    end
  end

  # Accept direct params
  def update(conn, %{"id" => id} = params) do
    snapshot = Analytics.get_account_snapshot!(id)
    snapshot_params = Map.drop(params, ["id"])

    with {:ok, %AccountSnapshot{} = snapshot} <- Analytics.update_account_snapshot(snapshot, snapshot_params) do
      render(conn, :show, snapshot: snapshot)
    end
  end

  def delete(conn, %{"id" => id}) do
    snapshot = Analytics.get_account_snapshot!(id)

    with {:ok, %AccountSnapshot{}} <- Analytics.delete_account_snapshot(snapshot) do
      send_resp(conn, :no_content, "")
    end
  end
end
