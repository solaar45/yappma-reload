defmodule WealthBackendWeb.Plugs.Authenticate do
  @moduledoc """
  Plug to authenticate requests using JWT Bearer tokens.
  Extracts user_id from token and assigns it to conn.
  """
  import Plug.Conn
  import Phoenix.Controller, only: [json: 2]

  alias WealthBackend.Token

  def init(opts), do: opts

  def call(conn, _opts) do
    with {:ok, token} <- extract_token(conn),
         {:ok, claims} <- Token.verify_token(token),
         user_id when not is_nil(user_id) <- Token.get_user_id(claims) do
      assign(conn, :current_user_id, user_id)
    else
      {:error, reason} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Authentication failed", details: to_string(reason)})
        |> halt()

      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid token: missing user_id"})
        |> halt()
    end
  end

  defp extract_token(conn) do
    case get_req_header(conn, "authorization") do
      ["Bearer " <> token] -> {:ok, token}
      _ -> {:error, :missing_token}
    end
  end
end
