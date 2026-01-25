defmodule WealthBackendWeb.Plugs.RequireActiveUser do
  @moduledoc """
  Plug to ensure the current user account is active.
  """
  import Plug.Conn
  import Phoenix.Controller

  alias WealthBackend.Accounts.User
  alias WealthBackendWeb.UserAuth

  def init(opts), do: opts

  def call(conn, _opts) do
    case conn.assigns[:current_user] do
      %User{is_active: true} ->
        conn

      %User{is_active: false} ->
        conn
        |> UserAuth.log_out_user()
        |> put_status(:forbidden)
        |> json(%{error: "Account has been deactivated"})
        |> halt()

      _ ->
        conn
    end
  end
end
