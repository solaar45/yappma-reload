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
    user_id = Map.get(account_params, "user_id") || Map.get(params, "user_id", @default_user_id)
    account_params = Map.put(account_params, "user_id", user_id)
    
    result = WealthBackend.Repo.transaction(fn ->
      institution_id = case Map.get(account_params, "custom_institution_name") do
        name when is_binary(name) and name != "" ->
          # Create custom institution
          case WealthBackend.Institutions.create_institution(%{
            "name" => name,
            "user_id" => user_id,
            "is_system_provided" => false,
            "type" => "other",
            "category" => "other"
          }) do
            {:ok, institution} -> institution.id
            {:error, changeset} -> WealthBackend.Repo.rollback(changeset)
          end
        _ ->
          Map.get(account_params, "institution_id")
      end

      account_params = Map.put(account_params, "institution_id", institution_id)
      
      case Accounts.create_account(account_params) do
        {:ok, account} -> account
        {:error, changeset} -> WealthBackend.Repo.rollback(changeset)
      end
    end)

    case result do
      {:ok, %Account{} = account} ->
        account = WealthBackend.Repo.preload(account, :institution)
        conn
        |> put_status(:created)
        |> put_resp_header("location", ~p"/api/accounts/#{account}")
        |> render(:show, account: account)
      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> put_view(json: WealthBackendWeb.ErrorJSON)
        |> render(:error, changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    account = Accounts.get_account!(id) |> WealthBackend.Repo.preload(:institution)
    render(conn, :show, account: account)
  end

  def update(conn, %{"id" => id, "account" => account_params}) do
    account = Accounts.get_account!(id)

    with {:ok, %Account{} = account} <- Accounts.update_account(account, account_params) do
      account = WealthBackend.Repo.preload(account, :institution)
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
