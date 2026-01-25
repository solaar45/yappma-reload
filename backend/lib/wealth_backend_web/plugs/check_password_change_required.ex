defmodule WealthBackendWeb.Plugs.CheckPasswordChangeRequired do
  @moduledoc """
  Plug to check if user must change password (after admin reset).
  """
  import Plug.Conn
  import Phoenix.Controller

  alias WealthBackend.Accounts.User

  def init(opts), do: opts

  def call(conn, _opts) do
    case conn.assigns[:current_user] do
      %User{force_password_change: true} ->
        # Allow access to password change endpoint only
        if password_change_path?(conn) do
          conn
        else
          conn
          |> put_status(:forbidden)
          |> json(%{
            error: "Password change required",
            force_password_change: true,
            message: "You must change your password before accessing the application"
          })
          |> halt()
        end

      _ ->
        conn
    end
  end

  defp password_change_path?(conn) do
    conn.request_path =~ ~r{/api/users/settings/update_password}
  end
end
