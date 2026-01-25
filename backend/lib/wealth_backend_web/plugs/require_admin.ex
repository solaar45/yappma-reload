defmodule WealthBackendWeb.Plugs.RequireAdmin do
  @moduledoc """
  Plug to ensure the current user has admin privileges.
  """
  import Plug.Conn
  import Phoenix.Controller

  alias WealthBackend.Accounts.User

  def init(opts), do: opts

  def call(conn, _opts) do
    case conn.assigns[:current_user] do
      %User{} = user when user.role in ["admin", "super_admin"] ->
        conn

      _ ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: "Admin access required"})
        |> halt()
    end
  end
end
