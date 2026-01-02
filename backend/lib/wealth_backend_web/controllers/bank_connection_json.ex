defmodule WealthBackendWeb.BankConnectionJSON do
  alias WealthBackend.BankConnections.BankConnection

  @doc """
  Renders a list of bank_connections.
  """
  def index(%{bank_connections: bank_connections}) do
    %{data: for(bank_connection <- bank_connections, do: data(bank_connection))}
  end

  @doc """
  Renders a single bank_connection.
  """
  def show(%{bank_connection: bank_connection}) do
    %{data: data(bank_connection)}
  end

  defp data(%BankConnection{} = bank_connection) do
    %{
      id: bank_connection.id,
      name: bank_connection.name,
      blz: bank_connection.blz,
      fints_url: bank_connection.fints_url,
      status: bank_connection.status,
      sync_frequency: bank_connection.sync_frequency,
      auto_sync_enabled: bank_connection.auto_sync_enabled,
      last_sync_at: bank_connection.last_sync_at,
      last_error: bank_connection.last_error,
      sync_count: bank_connection.sync_count,
      institution_id: bank_connection.institution_id,
      bank_accounts: render_bank_accounts(bank_connection.bank_accounts)
    }
  end

  defp render_bank_accounts(bank_accounts) when is_list(bank_accounts) do
    Enum.map(bank_accounts, fn ba ->
      %{
        id: ba.id,
        iban: ba.iban,
        account_number: ba.account_number,
        account_name: ba.account_name,
        auto_import_enabled: ba.auto_import_enabled,
        account_id: ba.account_id
      }
    end)
  end

  defp render_bank_accounts(_), do: []
end
