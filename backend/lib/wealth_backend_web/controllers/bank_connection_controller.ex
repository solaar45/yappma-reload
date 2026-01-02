defmodule WealthBackendWeb.BankConnectionController do
  use WealthBackendWeb, :controller

  alias WealthBackend.FinTS
  alias WealthBackend.FinTS.{BankConnection, Client}

  action_fallback WealthBackendWeb.FallbackController

  def index(conn, _params) do
    user_id = conn.assigns.current_user_id
    bank_connections = FinTS.list_bank_connections(user_id)
    render(conn, :index, bank_connections: bank_connections)
  end

  def create(conn, %{"bank_connection" => bank_connection_params}) do
    user_id = conn.assigns.current_user_id
    bank_connection_params = Map.put(bank_connection_params, "user_id", user_id)
    
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
    user_id = conn.assigns.current_user_id
    bank_connection = FinTS.get_bank_connection!(id)
    
    # Ensure bank connection belongs to authenticated user
    if bank_connection.user_id == user_id do
      render(conn, :show, bank_connection: bank_connection)
    else
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Access denied"})
    end
  end

  def update(conn, %{"id" => id, "bank_connection" => bank_connection_params}) do
    user_id = conn.assigns.current_user_id
    bank_connection = FinTS.get_bank_connection!(id)

    # Ensure bank connection belongs to authenticated user
    if bank_connection.user_id == user_id do
      with {:ok, %BankConnection{} = bank_connection} <-
             FinTS.update_bank_connection(bank_connection, bank_connection_params) do
        render(conn, :show, bank_connection: bank_connection)
      end
    else
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Access denied"})
    end
  end

  def delete(conn, %{"id" => id}) do
    user_id = conn.assigns.current_user_id
    bank_connection = FinTS.get_bank_connection!(id)

    # Ensure bank connection belongs to authenticated user
    if bank_connection.user_id == user_id do
      with {:ok, %BankConnection{}} <- FinTS.delete_bank_connection(bank_connection) do
        send_resp(conn, :no_content, "")
      end
    else
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Access denied"})
    end
  end

  @doc """
  Test FinTS connection credentials.
  POST /api/bank_connections/test
  """
  def test(conn, %{"blz" => blz, "user_id" => user_id_fints, "pin" => pin, "fints_url" => fints_url}) do
    case Client.test_connection(blz, user_id_fints, pin, fints_url) do
      {:ok, result} ->
        json(conn, result)
      {:error, reason} ->
        json(conn, %{success: false, message: reason})
    end
  end

  @doc """
  Fetch accounts from FinTS server.
  POST /api/bank_connections/:id/fetch_accounts
  """
  def fetch_accounts(conn, %{"bank_connection_id" => id}) do
    user_id = conn.assigns.current_user_id
    bank_connection = FinTS.get_bank_connection!(id)

    # Ensure bank connection belongs to authenticated user
    if bank_connection.user_id != user_id do
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Access denied"})
    else
      # Decrypt PIN
      pin = FinTS.decrypt_pin(bank_connection.pin_encrypted)

      case Client.fetch_accounts(
        bank_connection.blz,
        bank_connection.user_id_fints,
        pin,
        bank_connection.fints_url
      ) do
        {:ok, accounts} ->
          # Create/update bank accounts in database
          case FinTS.upsert_bank_accounts(bank_connection.id, accounts) do
            results when is_list(results) ->
              json(conn, %{
                success: true,
                accounts: accounts
              })

            _error ->
              json(conn, %{
                success: false,
                error: "Failed to save accounts"
              })
          end

        {:error, reason} ->
          json(conn, %{
            success: false,
            error: reason
          })
      end
    end
  end

  @doc """
  Sync balances from FinTS server and create snapshots.
  POST /api/bank_connections/:id/sync_balances
  """
  def sync_balances(conn, %{"bank_connection_id" => id}) do
    user_id = conn.assigns.current_user_id
    bank_connection = FinTS.get_bank_connection!(id)

    # Ensure bank connection belongs to authenticated user
    if bank_connection.user_id != user_id do
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Access denied"})
    else
      # Decrypt PIN
      pin = FinTS.decrypt_pin(bank_connection.pin_encrypted)

      case Client.fetch_balances(
        bank_connection.blz,
        bank_connection.user_id_fints,
        pin,
        bank_connection.fints_url
      ) do
        {:ok, balances} ->
          # Convert balance maps to have atom keys
          balances_with_atoms = Enum.map(balances, fn balance ->
            %{
              iban: balance["iban"],
              balance: balance["balance"],
              currency: balance["currency"],
              date: Date.from_iso8601!(balance["date"])
            }
          end)

          case FinTS.create_snapshots_from_balances(bank_connection.id, balances_with_atoms) do
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

        {:error, reason} ->
          FinTS.update_sync_status(bank_connection.id, "error", to_string(reason))

          json(conn, %{
            success: false,
            error: to_string(reason)
          })
      end
    end
  end
end
