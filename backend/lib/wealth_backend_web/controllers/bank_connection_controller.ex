defmodule WealthBackendWeb.BankConnectionController do
  use WealthBackendWeb, :controller

  alias WealthBackend.BankConnections
  alias WealthBackend.BankConnections.BankConnection

  action_fallback WealthBackendWeb.FallbackController

  def index(conn, _params) do
    user_id = conn.assigns.current_user.id
    bank_connections = BankConnections.list_bank_connections(user_id)
    render(conn, :index, bank_connections: bank_connections)
  end

  def show(conn, %{"id" => id}) do
    bank_connection = BankConnections.get_bank_connection!(id)
    render(conn, :show, bank_connection: bank_connection)
  end

  def create(conn, %{"bank_connection" => bank_connection_params}) do
    bank_connection_params =
      Map.put(bank_connection_params, "user_id", conn.assigns.current_user.id)

    with {:ok, %BankConnection{} = bank_connection} <-
           BankConnections.create_bank_connection(bank_connection_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/bank_connections/#{bank_connection}")
      |> render(:show, bank_connection: bank_connection)
    end
  end

  def update(conn, %{"id" => id, "bank_connection" => bank_connection_params}) do
    bank_connection = BankConnections.get_bank_connection!(id)

    with {:ok, %BankConnection{} = bank_connection} <-
           BankConnections.update_bank_connection(bank_connection, bank_connection_params) do
      render(conn, :show, bank_connection: bank_connection)
    end
  end

  def delete(conn, %{"id" => id}) do
    bank_connection = BankConnections.get_bank_connection!(id)

    with {:ok, %BankConnection{}} <- BankConnections.delete_bank_connection(bank_connection) do
      send_resp(conn, :no_content, "")
    end
  end

  def test_connection(conn, %{"bank_connection" => params}) do
    case BankConnections.test_connection(params) do
      {:ok, result} ->
        json(conn, %{success: true, data: result})

      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{success: false, error: reason})
    end
  end

  def fetch_accounts(conn, %{"id" => id}) do
    case BankConnections.fetch_bank_accounts(id) do
      {:ok, accounts} ->
        json(conn, %{success: true, accounts: accounts})

      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{success: false, error: reason})
    end
  end

  def sync_balances(conn, %{"id" => id}) do
    case BankConnections.sync_balances(id) do
      {:ok, results} ->
        json(conn, %{success: true, synced: length(results)})

      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{success: false, error: reason})
    end
  end
end
