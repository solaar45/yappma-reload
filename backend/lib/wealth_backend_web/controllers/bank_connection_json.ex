defmodule WealthBackendWeb.BankConnectionJSON do
  alias WealthBackend.FinTS.BankConnection

  @doc """
  Renders a list of bank connections.
  """
  def index(%{bank_connections: bank_connections}) do
    %{data: for(bank_connection <- bank_connections, do: data(bank_connection))}
  end

  @doc """
  Renders a single bank connection.
  """
  def show(%{bank_connection: bank_connection}) do
    %{data: data(bank_connection)}
  end

  defp data(%BankConnection{} = bank_connection) do
    %{
      id: bank_connection.id,
      name: bank_connection.name,
      blz: bank_connection.blz,
      user_id_fints: bank_connection.user_id_fints,
      fints_url: bank_connection.fints_url,
      status: bank_connection.status,
      last_sync_at: bank_connection.last_sync_at,
      error_message: bank_connection.error_message,
      user_id: bank_connection.user_id,
      inserted_at: bank_connection.inserted_at,
      updated_at: bank_connection.updated_at
    }
    # Note: pin and pin_encrypted are intentionally excluded from JSON output for security
  end
end
