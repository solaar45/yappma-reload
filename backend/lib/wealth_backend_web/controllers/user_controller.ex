defmodule WealthBackendWeb.UserController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Accounts
  alias WealthBackend.Accounts.User

  action_fallback WealthBackendWeb.FallbackController

  def index(conn, _params) do
    user = conn.assigns.current_user
    render(conn, :index, users: [user])
  end

  def create(conn, %{"user" => user_params}) do
    with {:ok, %User{} = user} <- Accounts.create_user(user_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/users/#{user}")
      |> render(:show, user: user)
    end
  end

  def show(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    if to_string(user.id) == to_string(id) do
      render(conn, :show, user: user)
    else
      conn
      |> put_status(:forbidden)
      |> put_view(json: WealthBackendWeb.ErrorJSON)
      |> render(:"403.json")
    end
  end

  def update(conn, %{"id" => id, "user" => user_params}) do
    user = conn.assigns.current_user
    
    if to_string(user.id) == to_string(id) do
      # Automatically set tax_allowance_limit based on tax_status
      user_params = case user_params["tax_status"] do
        "single" -> Map.put(user_params, "tax_allowance_limit", 1000)
        "married" -> Map.put(user_params, "tax_allowance_limit", 2000)
        _ -> user_params
      end

      with {:ok, %User{} = user} <- Accounts.update_user(user, user_params) do
        render(conn, :show, user: user)
      end
    else
      conn
      |> put_status(:forbidden)
      |> put_view(json: WealthBackendWeb.ErrorJSON)
      |> render(:"403.json")
    end
  end

  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    
    if to_string(user.id) == to_string(id) do
      with {:ok, %User{}} <- Accounts.delete_user(user) do
        send_resp(conn, :no_content, "")
      end
    else
      conn
      |> put_status(:forbidden)
      |> put_view(json: WealthBackendWeb.ErrorJSON)
      |> render(:"403.json")
    end
  end
end
