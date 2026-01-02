defmodule WealthBackendWeb.BankAccountController do
  use WealthBackendWeb, :controller

  alias WealthBackend.FinTS

  action_fallback WealthBackendWeb.FallbackController

  def index(conn, %{"bank_connection_id" => bank_connection_id}) do
    bank_accounts = FinTS.list_bank_accounts(bank_connection_id)
    render(conn, :index, bank_accounts: bank_accounts)
  end

  def index(conn, _params) do
    # Return empty list if no filter provided
    render(conn, :index, bank_accounts: [])
  end

  def show(conn, %{"id" => id}) do
    bank_account = FinTS.get_bank_account!(id)
    render(conn, :show, bank_account: bank_account)
  end

  @doc """
  Link a bank account to an internal account.
  POST /api/bank_accounts/:id/link
  """
  def link(conn, %{"id" => id, "account_id" => account_id}) do
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
end
