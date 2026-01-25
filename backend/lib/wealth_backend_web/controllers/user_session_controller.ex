defmodule WealthBackendWeb.UserSessionController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Accounts
  alias WealthBackend.Repo
  alias WealthBackendWeb.UserAuth

  def create(conn, %{"user" => %{"email" => email, "password" => password}}) do
    if user = Accounts.get_user_by_email_and_password(email, password) do
      # Check if user is active
      if user.is_active do
        # Update login tracking
        {:ok, updated_user} = 
          user
          |> WealthBackend.Accounts.User.login_changeset()
          |> Repo.update()

        conn
        |> UserAuth.log_in_user(updated_user)
        |> json(%{
          message: "Logged in successfully",
          user: %{
            id: updated_user.id,
            email: updated_user.email,
            name: updated_user.name,
            role: updated_user.role
          },
          force_password_change: updated_user.force_password_change
        })
      else
        conn
        |> put_status(:forbidden)
        |> json(%{error: "Account has been deactivated"})
      end
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
