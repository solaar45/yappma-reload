defmodule WealthBackendWeb.AccountController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Accounts
  alias WealthBackend.Accounts.Account

  action_fallback WealthBackendWeb.FallbackController

  def index(conn, _params) do
    user = conn.assigns.current_user
    accounts = Accounts.list_accounts(user.id)
    render(conn, :index, accounts: accounts)
  end

  def create(conn, %{"account" => account_params}) do
    user = conn.assigns.current_user
    
    result = WealthBackend.Repo.transaction(fn ->
      institution_id = case Map.get(account_params, "custom_institution_name") do
        name when is_binary(name) and name != "" ->
          # Create custom institution
          case WealthBackend.Institutions.create_institution(%{
            "name" => name,
            "user_id" => user.id,
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

      account_params = 
        account_params 
        |> Map.put("institution_id", institution_id)
        |> Map.put("user_id", user.id)
      
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
    user = conn.assigns.current_user
    account = Accounts.get_account!(id, user)
    render(conn, :show, account: account)
  end

  def update(conn, %{"id" => id, "account" => account_params}) do
    user = conn.assigns.current_user
    account = Accounts.get_account!(id, user)

    with {:ok, %Account{} = account} <- Accounts.update_account(account, account_params) do
      account = WealthBackend.Repo.preload(account, :institution)
      render(conn, :show, account: account)
    end
  end

  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    account = Accounts.get_account!(id, user)

    with {:ok, %Account{}} <- Accounts.delete_account(account) do
      send_resp(conn, :no_content, "")
    end
  end
end
