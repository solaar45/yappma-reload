defmodule YappmaWeb.Plugs.CORS do
  @moduledoc """
  Simple CORS plug that adds headers to all responses
  """
  import Plug.Conn

  @allowed_origins [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ]

  def init(opts), do: opts

  def call(conn, _opts) do
    origin = get_req_header(conn, "origin") |> List.first()
    
    # Use the request origin if it's in our allowed list, otherwise use localhost:5173
    allowed_origin = if origin in @allowed_origins, do: origin, else: "http://localhost:5173"
    
    conn
    |> put_resp_header("access-control-allow-origin", allowed_origin)
    |> put_resp_header("access-control-allow-methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
    |> put_resp_header("access-control-allow-headers", "content-type, authorization, x-csrf-token")
    |> put_resp_header("access-control-allow-credentials", "true")
    |> handle_preflight()
  end

  defp handle_preflight(%{method: "OPTIONS"} = conn) do
    conn
    |> send_resp(204, "")
    |> halt()
  end

  defp handle_preflight(conn), do: conn
end
