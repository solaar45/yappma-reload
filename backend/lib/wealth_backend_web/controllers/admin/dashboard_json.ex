defmodule WealthBackendWeb.Admin.DashboardJSON do
  alias WealthBackend.Admin.AuditLog

  @doc """
  Renders audit log entries.
  """
  def audit_log(%{logs: logs}) do
    %{data: for(log <- logs, do: audit_log_data(log))}
  end

  defp audit_log_data(%AuditLog{} = log) do
    %{
      id: log.id,
      admin_user: user_summary(log.admin_user),
      target_user: user_summary(log.target_user),
      action: log.action,
      details: log.details,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      inserted_at: log.inserted_at
    }
  end

  defp user_summary(nil), do: nil
  defp user_summary(user) do
    %{
      id: user.id,
      email: user.email,
      name: user.name
    }
  end
end
