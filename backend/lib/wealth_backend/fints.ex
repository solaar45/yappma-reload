defmodule WealthBackend.FinTS do
  @moduledoc """
  The FinTS context for managing bank connections and accounts.
  """

  import Ecto.Query, warn: false
  alias WealthBackend.Repo
  alias WealthBackend.FinTS.{BankConnection, BankAccount}
  alias WealthBackend.Accounts.Account
  alias WealthBackend.Analytics.AccountSnapshot

  ## Bank Connections

  @doc """
  Returns the list of bank connections for a user.
  """
  def list_bank_connections(user_id) do
    BankConnection
    |> where([bc], bc.user_id == ^user_id)
    |> order_by([bc], desc: bc.inserted_at)
    |> Repo.all()
  end

  @doc """
  Gets a single bank connection.
  """
  def get_bank_connection!(id), do: Repo.get!(BankConnection, id)

  @doc """
  Gets a bank connection with preloaded associations.
  """
  def get_bank_connection_with_accounts!(id) do
    BankConnection
    |> where([bc], bc.id == ^id)
    |> preload([bank_accounts: [:account]])
    |> Repo.one!()
  end

  @doc """
  Creates a bank connection.
  """
  def create_bank_connection(attrs \\ %{}) do
    %BankConnection{}
    |> BankConnection.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a bank connection.
  """
  def update_bank_connection(%BankConnection{} = bank_connection, attrs) do
    bank_connection
    |> BankConnection.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a bank connection.
  """
  def delete_bank_connection(%BankConnection{} = bank_connection) do
    Repo.delete(bank_connection)
  end

  @doc """
  Updates the last sync timestamp and status.
  """
  def update_sync_status(bank_connection_id, status, error_message \\ nil) do
    bank_connection = get_bank_connection!(bank_connection_id)

    attrs = %{
      status: status,
      last_sync_at: DateTime.utc_now(),
      error_message: error_message
    }

    update_bank_connection(bank_connection, attrs)
  end

  ## Bank Accounts

  @doc """
  Returns the list of bank accounts for a connection.
  """
  def list_bank_accounts(bank_connection_id) do
    BankAccount
    |> where([ba], ba.bank_connection_id == ^bank_connection_id)
    |> preload([:account])
    |> Repo.all()
  end

  @doc """
  Gets a single bank account.
  """
  def get_bank_account!(id) do
    BankAccount
    |> preload([:account, :bank_connection])
    |> Repo.get!(id)
  end

  @doc """
  Creates a bank account.
  """
  def create_bank_account(attrs \\ %{}) do
    %BankAccount{}
    |> BankAccount.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a bank account.
  """
  def update_bank_account(%BankAccount{} = bank_account, attrs) do
    bank_account
    |> BankAccount.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Links a bank account to an internal account.
  """
  def link_bank_account(bank_account_id, account_id) do
    bank_account = get_bank_account!(bank_account_id)
    update_bank_account(bank_account, %{account_id: account_id})
  end

  @doc """
  Creates or updates bank accounts from FinTS data.
  """
  def upsert_bank_accounts(bank_connection_id, accounts_data) do
    Enum.map(accounts_data, fn account_data ->
      attrs = Map.put(account_data, :bank_connection_id, bank_connection_id)

      case Repo.get_by(BankAccount, 
        bank_connection_id: bank_connection_id,
        iban: account_data.iban
      ) do
        nil -> create_bank_account(attrs)
        existing -> update_bank_account(existing, attrs)
      end
    end)
  end

  @doc """
  Creates account snapshots from balance data.
  """
  def create_snapshots_from_balances(bank_connection_id, balances) do
    bank_accounts = list_bank_accounts(bank_connection_id)

    results = Enum.map(balances, fn balance ->
      # Find matching bank account by IBAN
      bank_account = Enum.find(bank_accounts, fn ba -> ba.iban == balance.iban end)

      if bank_account && bank_account.account_id do
        # Create snapshot for linked account
        attrs = %{
          account_id: bank_account.account_id,
          snapshot_date: balance.date || Date.utc_today(),
          balance: Decimal.new(to_string(balance.balance)),
          currency: balance.currency,
          source: "fints",
          external_reference: bank_connection_id
        }

        %AccountSnapshot{}
        |> AccountSnapshot.changeset(attrs)
        |> Repo.insert()
      else
        {:error, "Bank account not linked: #{balance.iban}"}
      end
    end)

    # Count successes
    created = Enum.count(results, fn
      {:ok, _} -> true
      _ -> false
    end)

    {:ok, created}
  end
end
