defmodule YappmaWeb.HealthController do
  use YappmaWeb, :controller

  @doc """
  GET /api/health
  Returns health status of the application.
  """
  def index(conn, _params) do
    json(conn, %{
      status: "ok",
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601(),
      service: "YAPPMA Backend",
      version: Application.spec(:yappma, :vsn) |> to_string()
    })
  end
end
