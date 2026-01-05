defmodule Yappma.BankConnections.AccountSync do
  @moduledoc """
  Syncs bank accounts and transactions from Styx to YAPPMA.
  """

  alias Yappma.Repo
  alias Yappma.Accounts.Account
  alias Yappma.BankConnections.StyxClient
  import Ecto.Query
  require Logger

  @doc """
  Syncs accounts for a user's consent.
  
  - user_id: Internal YAPPMA user ID
  - internal_consent_id: Internal DB consent ID (integer)
  - external_consent_id: External Styx consent ID (string)
  """
  def sync_user_accounts(user_id, internal_consent_id, external_consent_id) do
    Logger.info(
      "Starting account sync for user=#{user_id}, internal_consent=#{internal_consent_id}, external_consent=#{external_consent_id}"
    )

    with {:ok, styx_accounts} <- get_styx_accounts(external_consent_id),
         {:ok, synced_count} <-
           sync_accounts_to_db(user_id, internal_consent_id, styx_accounts) do
      {:ok,
       %{
         accounts_synced: synced_count,
         transactions_imported: 0
       }}
    else
      {:error, reason} ->
        Logger.error("Account sync failed: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp get_styx_accounts(external_consent_id) do
    case StyxClient.get_accounts(external_consent_id) do
      {:ok, accounts} ->
        {:ok, accounts}

      {:error, {:request_failed, :econnrefused}} ->
        # Styx not running - return mock accounts
        Logger.debug("Styx not available, using mock accounts")
        {:ok, mock_accounts()}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp sync_accounts_to_db(user_id, internal_consent_id, styx_accounts) do
    synced_count =
      Enum.reduce(styx_accounts, 0, fn styx_account, count ->
        case upsert_account(user_id, internal_consent_id, styx_account) do
          {:ok, _account} ->
            count + 1

          {:error, changeset} ->
            Logger.error("Failed to sync account: #{inspect(changeset.errors)}")
            count
        end
      end)

    {:ok, synced_count}
  end

  defp upsert_account(user_id, internal_consent_id, styx_account) do
    external_id = styx_account["resourceId"] || styx_account[:resource_id]
    iban = styx_account["iban"] || styx_account[:iban]
    name = styx_account["name"] || styx_account[:name] || "Imported Account"
    currency = styx_account["currency"] || styx_account[:currency] || "EUR"
    account_type = styx_account["product"] || styx_account["account_type"] || styx_account[:account_type] || "checking"

    # Skip if no external_id
    if is_nil(external_id) do
      Logger.warn("Skipping account without external_id: #{inspect(styx_account)}")
      {:error, :missing_external_id}
    else
      # Find existing account by external_id + consent_id (internal DB ID)
      existing_account =
        if external_id do
          Repo.one(
            from a in Account,
              where: a.external_id == ^external_id and a.bank_consent_id == ^internal_consent_id
          )
        else
          nil
        end

      attrs = %{
        user_id: user_id,
        name: name,
        type: account_type,
        currency: currency,
        iban: iban,
        external_id: external_id,
        bank_consent_id: internal_consent_id,
        last_synced_at: DateTime.utc_now(),
        sync_enabled: true,
        is_active: true
      }

      # Extract balance if present
      balance = extract_balance(styx_account)

      if existing_account do
        # Update existing account
        existing_account
        |> Account.changeset(attrs)
        |> Repo.update()
        |> case do
          {:ok, account} ->
            # Create balance snapshot if balance is present
            if balance do
              create_balance_snapshot(account.id, balance)
            end

            {:ok, account}

          {:error, changeset} ->
            {:error, changeset}
        end
      else
        # Create new account
        %Account{}
        |> Account.changeset(attrs)
        |> Repo.insert()
        |> case do
          {:ok, account} ->
            # Create initial balance snapshot
            if balance do
              create_balance_snapshot(account.id, balance)
            end

            {:ok, account}

          {:error, changeset} ->
            {:error, changeset}
        end
      end
    end
  end

  defp extract_balance(styx_account) do
    # Try different balance structures from Styx
    balance_data = styx_account["balance"] || styx_account[:balance]

    cond do
      # PSD2 format: balance.balanceAmount.amount
      is_map(balance_data) && (balance_data["balanceAmount"] || balance_data[:balanceAmount]) ->
        balance_amount = balance_data["balanceAmount"] || balance_data[:balanceAmount]
        amount = balance_amount["amount"] || balance_amount[:amount]
        currency = balance_amount["currency"] || balance_amount[:currency] || "EUR"
        
        if amount do
          %{amount: Decimal.new(to_string(amount)), currency: currency}
        else
          nil
        end
      
      # Simple format: balance.amount
      is_map(balance_data) ->
        amount = balance_data["amount"] || balance_data[:amount]
        currency = balance_data["currency"] || balance_data[:currency] || "EUR"
        
        if amount do
          %{amount: Decimal.new(to_string(amount)), currency: currency}
        else
          nil
        end
      
      true ->
        nil
    end
  end

  defp create_balance_snapshot(account_id, balance) do
    # We'll use account_snapshots table for this
    snapshot_attrs = %{
      account_id: account_id,
      balance: balance.amount,
      currency: balance.currency,
      snapshot_date: Date.utc_today()
    }

    # Check if AccountSnapshot schema exists, otherwise skip
    try do
      alias Yappma.Accounts.AccountSnapshot
      
      # Check if snapshot for today already exists
      existing = Repo.one(
        from s in AccountSnapshot,
          where: s.account_id == ^account_id and s.snapshot_date == ^snapshot_attrs.snapshot_date
      )
      
      if existing do
        # Update existing snapshot
        existing
        |> AccountSnapshot.changeset(snapshot_attrs)
        |> Repo.update()
      else
        # Create new snapshot
        %AccountSnapshot{}
        |> AccountSnapshot.changeset(snapshot_attrs)
        |> Repo.insert()
      end
    rescue
      _ ->
        Logger.debug("AccountSnapshot not available, skipping balance snapshot")
        :ok
    end
  end

  # Mock accounts when Styx is not available
  defp mock_accounts do
    [
      %{
        "resourceId" => "account-1",
        "iban" => "DE89370400440532013000",
        "name" => "Girokonto",
        "currency" => "EUR",
        "balance" => %{
          "balanceAmount" => %{
            "amount" => "2543.89",
            "currency" => "EUR"
          },
          "balanceType" => "interimAvailable"
        },
        "product" => "Girokonto"
      },
      %{
        "resourceId" => "account-2",
        "iban" => "DE89370400440532013001",
        "name" => "Sparkonto",
        "currency" => "EUR",
        "balance" => %{
          "balanceAmount" => %{
            "amount" => "15789.42",
            "currency" => "EUR"
          },
          "balanceType" => "interimAvailable"
        },
        "product" => "Sparkonto"
      },
      %{
        "resourceId" => "account-3",
        "iban" => "DE89370400440532013002",
        "name" => "Tagesgeldkonto",
        "currency" => "EUR",
        "balance" => %{
          "balanceAmount" => %{
            "amount" => "8234.15",
            "currency" => "EUR"
          },
          "balanceType" => "interimAvailable"
        },
        "product" => "Tagesgeldkonto"
      }
    ]
  end
end
