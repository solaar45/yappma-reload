defmodule YappmaWeb.CORSController do
  use YappmaWeb, :controller

  @doc """
  Handle CORS preflight OPTIONS requests
  """
  def preflight(conn, _params) do
    conn
    |> put_resp_header("access-control-allow-origin", "*")
    |> put_resp_header("access-control-allow-methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
    |> put_resp_header("access-control-allow-headers", "content-type, authorization, x-csrf-token")
    |> put_resp_header("access-control-max-age", "86400")
    |> send_resp(204, "")
  end
end
