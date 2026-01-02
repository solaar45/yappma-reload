defmodule WealthBackend.BankConnections do
  @moduledoc """
  Context for managing bank connections and FinTS integration.
  Handles DKB and comdirect for Phase 1 MVP.
  """

  import Ecto.Query, warn: false
  alias WealthBackend.Repo
  alias WealthBackend.BankConnections.{BankConnection, BankAccount}
  alias WealthBackend.Analytics.AccountSnapshot
  alias WealthBackend.FintsClient

  @doc """
  Returns the list of bank_connections for a user.
  """
  def list_bank_connections(user_id) do
    BankConnection
    |> where([bc], bc.user_id == ^user_id)
    |> preload([:institution, :bank_accounts])
    |> Repo.all()
  end

  @doc """
  Gets a single bank_connection.
  """
  def get_bank_connection!(id) do
    BankConnection
    |> preload([:institution, bank_accounts: :account])
    |> Repo.get!(id)
  end

  @doc """
  Creates a bank_connection.
  """
  def create_bank_connection(attrs \\ %{}) do
    %BankConnection{}
    |> BankConnection.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a bank_connection.
  """
  def update_bank_connection(%BankConnection{} = bank_connection, attrs) do
    bank_connection
    |> BankConnection.update_changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a bank_connection.
  """
  def delete_bank_connection(%BankConnection{} = bank_connection) do
    Repo.delete(bank_connection)
  end

  @doc """
  Tests connection to bank via FinTS.
  """
  def test_connection(attrs) do
    FintsClient.test_connection(
      attrs.blz,
      attrs.banking_user_id,
      attrs.banking_pin,
      attrs.fints_url
    )
  end

  @doc """
  Fetches accounts from bank via FinTS.
  Returns list of bank accounts that can be imported.
  """
  def fetch_bank_accounts(bank_connection_id) do
    bank_connection = get_bank_connection!(bank_connection_id)

    with {:ok, accounts} <- FintsClient.fetch_accounts(
           bank_connection.blz,
           decrypt_field(bank_connection.user_id_encrypted),
           decrypt_field(bank_connection.pin_encrypted),
           bank_connection.fints_url
         ) do
      {:ok, accounts}
    else
      {:error, reason} ->
        update_bank_connection(bank_connection, %{
          status: :error,
          last_error: "Failed to fetch accounts: #{inspect(reason)}"
        })

        {:error, reason}
    end
  end

  @doc """
  Creates a bank_account and links it to a YAPPMA account.
  """
  def create_bank_account(attrs \\ %{}) do
    %BankAccount{}
    |> BankAccount.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Links a bank_account to a YAPPMA account.
  """
  def link_bank_account(bank_account_id, account_id) do
    bank_account = Repo.get!(BankAccount, bank_account_id)

    bank_account
    |> BankAccount.changeset(%{account_id: account_id})
    |> Repo.update()
  end

  @doc """
  Syncs balances for a bank connection.
  Creates AccountSnapshots for all linked accounts.
  """
  def sync_balances(bank_connection_id) do
    bank_connection =
      bank_connection_id
      |> get_bank_connection!()
      |> Repo.preload(bank_accounts: :account)

    with {:ok, balances} <- fetch_balances(bank_connection) do
      results =
        Enum.map(balances, fn balance ->
          create_snapshot_from_balance(bank_connection, balance)
        end)

      # Update sync status
      update_bank_connection(bank_connection, %{
        last_sync_at: DateTime.utc_now(),
        sync_count: bank_connection.sync_count + 1,
        status: :active,
        last_error: nil
      })

      {:ok, results}
    else
      {:error, reason} ->
        update_bank_connection(bank_connection, %{
          status: :error,
          last_error: "Sync failed: #{inspect(reason)}"
        })

        {:error, reason}
    end
  end

  defp fetch_balances(bank_connection) do
    FintsClient.fetch_balances(
      bank_connection.blz,
      decrypt_field(bank_connection.user_id_encrypted),
      decrypt_field(bank_connection.pin_encrypted),
      bank_connection.fints_url
    )
  end

  defp create_snapshot_from_balance(bank_connection, balance) do
    # Find matching bank_account by IBAN
    bank_account =
      Enum.find(bank_connection.bank_accounts, fn ba ->
        ba.iban == balance.iban
      end)

    if bank_account && bank_account.account_id && bank_account.auto_import_enabled do
      # Create snapshot
      %AccountSnapshot{}
      |> AccountSnapshot.changeset(%{
        account_id: bank_account.account_id,
        balance: Decimal.new(balance.balance),
        snapshot_date: balance.date,
        source: :fints_auto,
        external_reference: balance.iban
      })
      |> Repo.insert()
    else
      {:skipped, "No linked account or auto_import disabled"}
    end
  end

  # TODO: Implement proper encryption/decryption with Cloak
  defp decrypt_field(encrypted_binary) when is_binary(encrypted_binary) do
    encrypted_binary
  end

  defp decrypt_field(nil), do: nil
end
