defmodule WealthBackendWeb.BankConnectionController do
  use WealthBackendWeb, :controller

  alias WealthBackend.FinTS
  alias WealthBackend.FinTS.BankConnection

  action_fallback WealthBackendWeb.FallbackController

  def index(conn, _params) do
    # TODO: Get user_id from session/auth (Phase 2B)
    user_id = 1
    bank_connections = FinTS.list_bank_connections(user_id)
    render(conn, :index, bank_connections: bank_connections)
  end

  def create(conn, %{"bank_connection" => bank_connection_params}) do
    case FinTS.create_bank_connection(bank_connection_params) do
      {:ok, bank_connection} ->
        conn
        |> put_status(:created)
        |> put_resp_header("location", ~p"/api/bank_connections/#{bank_connection}")
        |> render(:show, bank_connection: bank_connection)

      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> put_view(json: WealthBackendWeb.ChangesetJSON)
        |> render(:error, changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    bank_connection = FinTS.get_bank_connection!(id)
    render(conn, :show, bank_connection: bank_connection)
  end

  def update(conn, %{"id" => id, "bank_connection" => bank_connection_params}) do
    bank_connection = FinTS.get_bank_connection!(id)

    with {:ok, %BankConnection{} = bank_connection} <-
           FinTS.update_bank_connection(bank_connection, bank_connection_params) do
      render(conn, :show, bank_connection: bank_connection)
    end
  end

  def delete(conn, %{"id" => id}) do
    bank_connection = FinTS.get_bank_connection!(id)

    with {:ok, %BankConnection{}} <- FinTS.delete_bank_connection(bank_connection) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Test FinTS connection credentials without persisting.
  POST /api/bank_connections/test
  """
  def test(conn, _params) do
    # Mock implementation for Phase 2A
    # Real FinTS test will be implemented in Phase 2C
    result = %{
      success: true,
      message: "Connection test successful (mock)",
      account_count: 2
    }

    json(conn, result)
  end

  @doc """
  Fetch accounts from FinTS server.
  POST /api/bank_connections/:id/fetch_accounts
  """
  def fetch_accounts(conn, %{"id" => id}) do
    bank_connection = FinTS.get_bank_connection!(id)

    # Mock implementation for Phase 2A
    mock_accounts = [
      %{
        iban: "DE89370400440532013000",
        account_number: "532013000",
        account_name: "Girokonto",
        bic: "COBADEFFXXX",
        bank_name: "Commerzbank",
        currency: "EUR",
        type: "checking"
      },
      %{
        iban: "DE89370400440532013001",
        account_number: "532013001",
        account_name: "Sparkonto",
        bic: "COBADEFFXXX",
        bank_name: "Commerzbank",
        currency: "EUR",
        type: "savings"
      }
    ]

    # Create/update bank accounts in database
    case FinTS.upsert_bank_accounts(bank_connection.id, mock_accounts) do
      results when is_list(results) ->
        json(conn, %{
          success: true,
          accounts: mock_accounts
        })

      _error ->
        json(conn, %{
          success: false,
          error: "Failed to save accounts"
        })
    end
  end

  @doc """
  Sync balances from FinTS server and create snapshots.
  POST /api/bank_connections/:id/sync_balances
  """
  def sync_balances(conn, %{"id" => id}) do
    bank_connection = FinTS.get_bank_connection!(id)

    # Mock balance data
    mock_balances = [
      %{
        iban: "DE89370400440532013000",
        balance: 1234.56,
        currency: "EUR",
        date: Date.utc_today()
      },
      %{
        iban: "DE89370400440532013001",
        balance: 5678.90,
        currency: "EUR",
        date: Date.utc_today()
      }
    ]

    case FinTS.create_snapshots_from_balances(bank_connection.id, mock_balances) do
      {:ok, count} ->
        FinTS.update_sync_status(bank_connection.id, "active", nil)

        json(conn, %{
          success: true,
          message: "Balances synced successfully",
          snapshots_created: count
        })

      {:error, reason} ->
        FinTS.update_sync_status(bank_connection.id, "error", to_string(reason))

        json(conn, %{
          success: false,
          error: to_string(reason)
        })
    end
  end
end
