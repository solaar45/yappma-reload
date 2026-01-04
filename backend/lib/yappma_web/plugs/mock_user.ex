defmodule YappmaWeb.Plugs.MockUser do
  @moduledoc """
  Mock user plug for development/testing without real authentication.
  TODO: Remove this in production and replace with real auth!
  """
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    # Mock user for testing - ID must be integer to match database schema
    mock_user = %{
      id: 1,
      email: "test@example.com",
      name: "Test User"
    }

    assign(conn, :current_user, mock_user)
  end
end
