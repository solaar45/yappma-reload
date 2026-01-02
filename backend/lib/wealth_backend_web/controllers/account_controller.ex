defmodule WealthBackendWeb.AccountController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Accounts
  alias WealthBackend.Accounts.Account

  action_fallback WealthBackendWeb.FallbackController

  def index(conn, _params) do
    user_id = conn.assigns.current_user_id
    accounts = Accounts.list_accounts(user_id)
    render(conn, :index, accounts: accounts)
  end

  def create(conn, %{"account" => account_params}) do
    user_id = conn.assigns.current_user_id
    account_params = Map.put(account_params, "user_id", user_id)
    
    with {:ok, %Account{} = account} <- Accounts.create_account(account_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/accounts/#{account}")
      |> render(:show, account: account)
    end
  end

  def show(conn, %{"id" => id}) do
    user_id = conn.assigns.current_user_id
    account = Accounts.get_account!(id)
    
    # Ensure account belongs to authenticated user
    if account.user_id == user_id do
      render(conn, :show, account: account)
    else
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Access denied"})
    end
  end

  def update(conn, %{"id" => id, "account" => account_params}) do
    user_id = conn.assigns.current_user_id
    account = Accounts.get_account!(id)

    # Ensure account belongs to authenticated user
    if account.user_id == user_id do
      with {:ok, %Account{} = account} <- Accounts.update_account(account, account_params) do
        render(conn, :show, account: account)
      end
    else
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Access denied"})
    end
  end

  def delete(conn, %{"id" => id}) do
    user_id = conn.assigns.current_user_id
    account = Accounts.get_account!(id)

    # Ensure account belongs to authenticated user
    if account.user_id == user_id do
      with {:ok, %Account{}} <- Accounts.delete_account(account) do
        send_resp(conn, :no_content, "")
      end
    else
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Access denied"})
    end
  end
end
