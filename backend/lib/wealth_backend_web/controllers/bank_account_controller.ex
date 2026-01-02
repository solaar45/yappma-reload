defmodule WealthBackendWeb.BankAccountController do
  use WealthBackendWeb, :controller

  alias WealthBackend.FinTS

  action_fallback WealthBackendWeb.FallbackController

  @doc """
  List bank accounts for a connection.
  GET /api/bank_accounts?bank_connection_id=:id
  """
  def index(conn, %{"bank_connection_id" => bank_connection_id}) do
    bank_accounts = FinTS.list_bank_accounts(bank_connection_id)
    render(conn, :index, bank_accounts: bank_accounts)
  end

  def index(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "bank_connection_id parameter is required"})
  end

  @doc """
  Get a single bank account.
  GET /api/bank_accounts/:id
  """
  def show(conn, %{"id" => id}) do
    bank_account = FinTS.get_bank_account!(id)
    render(conn, :show, bank_account: bank_account)
  end

  @doc """
  Map a bank account to an internal account.
  POST /api/bank_accounts/:id/map
  
  Body:
  {
    "account_id": 123  // or null to unmap
  }
  """
  def map_account(conn, %{"id" => id, "account_id" => account_id}) do
    case FinTS.link_bank_account(id, account_id) do
      {:ok, bank_account} ->
        render(conn, :show, bank_account: bank_account)

      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> put_view(json: WealthBackendWeb.ChangesetJSON)
        |> render(:error, changeset: changeset)
    end
  end

  def map_account(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "account_id is required"})
  end
end
