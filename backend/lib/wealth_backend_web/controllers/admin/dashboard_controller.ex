defmodule WealthBackendWeb.Admin.DashboardController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Admin

  action_fallback WealthBackendWeb.FallbackController

  @doc """
  GET /api/admin/dashboard/stats
  Get system-wide statistics.
  """
  def stats(conn, _params) do
    stats = Admin.get_system_stats()
    json(conn, %{data: stats})
  end

  @doc """
  GET /api/admin/audit-log
  Get audit log with pagination and filters.
  """
  def audit_log(conn, params) do
    filters = build_filters(params)
    logs = Admin.list_audit_logs(filters)

    render(conn, :audit_log, logs: logs)
  end

  defp build_filters(params) do
    limit = String.to_integer(params["limit"] || "50")

    []
    |> maybe_add_filter(:admin_user_id, params["admin_user_id"])
    |> maybe_add_filter(:action, params["action"])
    |> Keyword.put(:limit, limit)
  end

  defp maybe_add_filter(filters, _key, nil), do: filters
  defp maybe_add_filter(filters, key, value), do: [{key, value} | filters]
end
