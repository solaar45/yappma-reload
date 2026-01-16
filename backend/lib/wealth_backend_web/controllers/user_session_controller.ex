defmodule WealthBackendWeb.UserSessionController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Accounts
  alias WealthBackendWeb.UserAuth

  def create(conn, %{"user" => %{"email" => email, "password" => password}}) do
    if user = Accounts.get_user_by_email_and_password(email, password) do
      conn
      |> UserAuth.log_in_user(user)
      |> json(%{
        message: "Logged in successfully",
        user: %{
          id: user.id,
          email: user.email,
          name: user.name
        }
      })
    else
      conn
      |> put_status(:unauthorized)
      |> json(%{error: "Invalid email or password"})
    end
  end

  def delete(conn, _params) do
    conn
    |> UserAuth.log_out_user()
    |> json(%{message: "Logged out successfully"})
  end
end
