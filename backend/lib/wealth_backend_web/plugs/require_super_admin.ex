defmodule WealthBackendWeb.Plugs.RequireSuperAdmin do
  @moduledoc """
  Plug to ensure the current user is a super admin.
  """
  import Plug.Conn
  import Phoenix.Controller

  alias WealthBackend.Accounts.User

  def init(opts), do: opts

  def call(conn, _opts) do
    case conn.assigns[:current_user] do
      %User{role: "super_admin"} ->
        conn

      _ ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: "Super admin access required"})
        |> halt()
    end
  end
end
