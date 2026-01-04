defmodule WealthBackend.BankConnections.AccountSync do
  @moduledoc """
  Syncs bank accounts and transactions from Styx to YAPPMA.
  
  Integrates directly with WealthBackend.Accounts context to create/update accounts.
  """

  alias WealthBackend.Repo
  alias WealthBackend.Accounts.Account
  alias WealthBackend.BankConnections.StyxClient
  alias WealthBackend.Analytics.AccountSnapshot
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
    external_id = styx_account[:resource_id] || styx_account["resource_id"]
    iban = styx_account[:iban] || styx_account["iban"]
    name = styx_account[:name] || styx_account["name"] || "Imported Account"
    currency = styx_account[:currency] || styx_account["currency"] || "EUR"
    account_type = map_account_type(styx_account[:account_type] || styx_account["account_type"])

    # Try to find existing account by external_id and consent_id
    existing_account =
      if external_id do
        Repo.one(
          from a in Account,
            where: a.external_id == ^external_id and a.bank_consent_id == ^internal_consent_id
        )
      else
        nil
      end

    # Extract balance if present
    balance = extract_balance(styx_account)

    # Build account attributes with PSD2 fields
    attrs = %{
      user_id: user_id,
      name: name,
      type: account_type,
      currency: currency,
      is_active: true,
      # PSD2 fields
      iban: iban,
      external_id: external_id,
      bank_consent_id: internal_consent_id,
      sync_enabled: true,
      # Store additional PSD2 data in metadata
      metadata: build_metadata(styx_account)
    }

    if existing_account do
      # Update existing account using sync_changeset
      case existing_account
           |> Account.sync_changeset(attrs)
           |> Repo.update() do
        {:ok, account} ->
          # Create balance snapshot if balance is present
          if balance do
            create_balance_snapshot(account.id, balance)
          end

          Logger.info("Updated account: #{account.name} (ID: #{account.id})")
          {:ok, account}

        {:error, changeset} ->
          {:error, changeset}
      end
    else
      # Create new account using sync_changeset
      case %Account{}
           |> Account.sync_changeset(attrs)
           |> Repo.insert() do
        {:ok, account} ->
          # Create initial balance snapshot
          if balance do
            create_balance_snapshot(account.id, balance)
          end

          Logger.info("Created account: #{account.name} (ID: #{account.id})")
          {:ok, account}

        {:error, changeset} ->
          {:error, changeset}
      end
    end
  end

  # Map PSD2 account types to WealthBackend account types
  defp map_account_type("checking"), do: :checking
  defp map_account_type("savings"), do: :savings
  defp map_account_type("credit_card"), do: :credit_card
  defp map_account_type("current"), do: :checking
  defp map_account_type(_), do: :other

  defp extract_balance(styx_account) do
    balance_data = styx_account[:balance] || styx_account["balance"]

    if balance_data do
      amount = balance_data[:amount] || balance_data["amount"]
      currency = balance_data[:currency] || balance_data["currency"] || "EUR"

      if amount do
        %{amount: Decimal.new(to_string(amount)), currency: currency}
      else
        nil
      end
    else
      nil
    end
  end

  defp build_metadata(styx_account) do
    # Store additional PSD2 data that doesn't fit in the main schema
    %{
      psd2_data: %{
        cash_account_type: styx_account[:cash_account_type] || styx_account["cash_account_type"],
        product: styx_account[:product] || styx_account["product"],
        usage: styx_account[:usage] || styx_account["usage"],
        details: styx_account[:details] || styx_account["details"]
      },
      synced_at: DateTime.utc_now() |> DateTime.to_iso8601()
    }
  end

  defp create_balance_snapshot(account_id, balance) do
    # Create a snapshot using the Analytics context
    snapshot_attrs = %{
      account_id: account_id,
      balance: balance.amount,
      snapshot_date: Date.utc_today()
    }

    try do
      %AccountSnapshot{}
      |> AccountSnapshot.changeset(snapshot_attrs)
      |> Repo.insert(
        on_conflict: {:replace, [:balance]},
        conflict_target: [:account_id, :snapshot_date]
      )
    rescue
      e ->
        Logger.debug("Could not create balance snapshot: #{inspect(e)}")
        :ok
    end
  end

  # Mock accounts when Styx is not available
  defp mock_accounts do
    [
      %{
        resource_id: "account-1",
        iban: "DE89370400440532013000",
        name: "Girokonto",
        currency: "EUR",
        balance: %{
          amount: 2543.89,
          currency: "EUR"
        },
        account_type: "checking",
        cash_account_type: "CACC",
        product: "Girokonto Plus"
      },
      %{
        resource_id: "account-2",
        iban: "DE89370400440532013001",
        name: "Sparkonto",
        currency: "EUR",
        balance: %{
          amount: 15789.42,
          currency: "EUR"
        },
        account_type: "savings",
        cash_account_type: "SVGS",
        product: "Tagesgeld"
      },
      %{
        resource_id: "account-3",
        iban: "DE89370400440532013002",
        name: "Tagesgeldkonto",
        currency: "EUR",
        balance: %{
          amount: 8234.15,
          currency: "EUR"
        },
        account_type: "savings",
        cash_account_type: "SVGS"
      }
    ]
  end
end
