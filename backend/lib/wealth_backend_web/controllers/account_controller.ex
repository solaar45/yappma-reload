defmodule WealthBackendWeb.AccountController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Accounts
  alias WealthBackend.Accounts.Account

  action_fallback WealthBackendWeb.FallbackController

  # TODO: Get user_id from authenticated session/JWT token
  # For now, use a default test user_id
  @default_user_id 1

  def index(conn, params) do
    user_id = Map.get(params, "user_id", @default_user_id)
    accounts = Accounts.list_accounts(user_id)
    render(conn, :index, accounts: accounts)
  end

  def create(conn, %{"account" => account_params} = params) do
    # Add default user_id if not provided
    account_params = Map.put_new(account_params, "user_id", Map.get(params, "user_id", @default_user_id))
    
    with {:ok, %Account{} = account} <- Accounts.create_account(account_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/accounts/#{account}")
      |> render(:show, account: account)
    end
  end

  def show(conn, %{"id" => id}) do
    account = Accounts.get_account!(id)
    render(conn, :show, account: account)
  end

  def update(conn, %{"id" => id, "account" => account_params}) do
    account = Accounts.get_account!(id)

    with {:ok, %Account{} = account} <- Accounts.update_account(account, account_params) do
      render(conn, :show, account: account)
    end
  end

  def delete(conn, %{"id" => id}) do
    account = Accounts.get_account!(id)

    with {:ok, %Account{}} <- Accounts.delete_account(account) do
      send_resp(conn, :no_content, "")
    end
  end
end
