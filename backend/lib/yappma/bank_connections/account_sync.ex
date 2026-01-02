defmodule Yappma.BankConnections.AccountSync do
  @moduledoc """
  Syncs bank accounts and transactions into YAPPMA database.
  
  This module:
  - Creates/updates accounts from PSD2 data
  - Imports transactions
  - Maps external data to YAPPMA schema
  """

  require Logger
  alias Yappma.BankConnections.StyxClient
  alias Yappma.BankConnections.TransactionMapper
  alias Yappma.Repo
  # TODO: Add proper schema imports
  # alias Yappma.Accounts.Account
  # alias Yappma.Transactions.Transaction

  @doc """
  Syncs all accounts for a user's consent.
  """
  def sync_user_accounts(user_id, consent_id) do
    Logger.info("Starting account sync for user #{user_id}, consent #{consent_id}")

    with {:ok, accounts} <- StyxClient.get_accounts(consent_id),
         {:ok, synced_accounts} <- sync_accounts(user_id, consent_id, accounts) do
      
      # Sync transactions for each account
      transaction_results =
        synced_accounts
        |> Enum.map(fn account ->
          sync_account_transactions(consent_id, account)
        end)

      total_transactions = 
        transaction_results
        |> Enum.map(fn {:ok, count} -> count end)
        |> Enum.sum()

      Logger.info("Sync completed: #{length(synced_accounts)} accounts, #{total_transactions} transactions")

      {:ok, %{
        accounts_synced: length(synced_accounts),
        transactions_imported: total_transactions
      }}
    end
  end

  defp sync_accounts(user_id, consent_id, psd2_accounts) do
    accounts =
      psd2_accounts
      |> Enum.map(fn psd2_account ->
        # Get detailed info including balance
        {:ok, details} = StyxClient.get_account_details(consent_id, psd2_account["resourceId"])
        {:ok, balances} = StyxClient.get_balance(consent_id, psd2_account["resourceId"])

        account_data = %{
          user_id: user_id,
          external_id: psd2_account["resourceId"],
          iban: psd2_account["iban"],
          name: psd2_account["name"] || "Account #{psd2_account["iban"]}",
          currency: psd2_account["currency"],
          account_type: "checking",  # Could be mapped from product field
          balance: extract_balance(balances),
          bank_name: details["bank"] || "Unknown",
          last_synced_at: DateTime.utc_now()
        }

        # TODO: Use real schema
        # case Repo.get_by(Account, external_id: account_data.external_id) do
        #   nil ->
        #     %Account{}
        #     |> Account.changeset(account_data)
        #     |> Repo.insert()
        #   
        #   existing ->
        #     existing
        #     |> Account.changeset(account_data)
        #     |> Repo.update()
        # end

        Logger.info("Synced account: #{account_data.iban}")
        {:ok, account_data}
      end)
      |> Enum.map(fn {:ok, account} -> account end)

    {:ok, accounts}
  end

  defp sync_account_transactions(consent_id, account) do
    # Get last sync date or default to 90 days ago
    date_from = account[:last_synced_at] || DateTime.add(DateTime.utc_now(), -90, :day)
    
    opts = [
      date_from: DateTime.to_date(date_from),
      booking_status: "booked"
    ]

    with {:ok, psd2_transactions} <- StyxClient.get_transactions(consent_id, account.external_id, opts) do
      imported_count =
        psd2_transactions
        |> Enum.map(fn psd2_tx ->
          import_transaction(account, psd2_tx)
        end)
        |> Enum.count(fn result -> match?({:ok, _}, result) end)

      {:ok, imported_count}
    end
  end

  defp import_transaction(account, psd2_transaction) do
    transaction_data = TransactionMapper.map_from_psd2(account, psd2_transaction)

    # TODO: Use real schema and prevent duplicates
    # case Repo.get_by(Transaction, external_id: transaction_data.external_id) do
    #   nil ->
    #     %Transaction{}
    #     |> Transaction.changeset(transaction_data)
    #     |> Repo.insert()
    #   
    #   _existing ->
    #     # Skip duplicates
    #     {:ok, :skipped}
    # end

    Logger.debug("Imported transaction: #{transaction_data.description}")
    {:ok, transaction_data}
  end

  defp extract_balance(balances) when is_list(balances) do
    # Try to get closingBooked balance first, fall back to interimAvailable
    balance =
      Enum.find(balances, fn b -> b["balanceType"] == "closingBooked" end) ||
      Enum.find(balances, fn b -> b["balanceType"] == "interimAvailable" end) ||
      List.first(balances)

    case balance do
      %{"balanceAmount" => %{"amount" => amount}} when is_binary(amount) ->
        String.to_float(amount)
      
      %{"balanceAmount" => %{"amount" => amount}} when is_number(amount) ->
        amount / 1
      
      _ ->
        0.0
    end
  end

  defp extract_balance(_), do: 0.0
end
