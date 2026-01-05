defmodule WealthBackend.Banking do
  @moduledoc """
  The Banking context - handles bank connections, consents and transactions.
  """

  import Ecto.Query, warn: false
  alias WealthBackend.Repo
  alias WealthBackend.Banking.{BankConsent, Transaction}
  alias Yappma.Accounts.Account

  require Logger

  ## Transactions

  @doc """
  Returns the list of transactions for a given account.
  """
  def list_transactions(account_id, opts \\ []) do
    from(t in Transaction, where: t.account_id == ^account_id)
    |> apply_transaction_filters(opts)
    |> order_by([t], desc: t.booking_date, desc: t.inserted_at)
    |> Repo.all()
  end

  @doc """
  Returns the list of transactions for a user across all accounts.
  """
  def list_user_transactions(user_id, opts \\ []) do
    from(t in Transaction,
      join: a in Account,
      on: t.account_id == a.id,
      where: a.user_id == ^user_id,
      preload: [account: a]
    )
    |> apply_transaction_filters(opts)
    |> order_by([t], desc: t.booking_date, desc: t.inserted_at)
    |> Repo.all()
  end

  defp apply_transaction_filters(query, opts) do
    Enum.reduce(opts, query, fn
      {:from_date, date}, q ->
        from(t in q, where: t.booking_date >= ^date)

      {:to_date, date}, q ->
        from(t in q, where: t.booking_date <= ^date)

      {:status, status}, q ->
        from(t in q, where: t.status == ^status)

      {:limit, limit}, q ->
        from(t in q, limit: ^limit)

      _, q ->
        q
    end)
  end

  @doc """
  Gets a single transaction.
  """
  def get_transaction!(id) do
    Transaction
    |> preload(:account)
    |> Repo.get!(id)
  end

  @doc """
  Creates a transaction.
  """
  def create_transaction(attrs \\ %{}) do
    %Transaction{}
    |> Transaction.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Creates or updates a transaction based on account_id + external_id.
  """
  def upsert_transaction(attrs) do
    case Repo.get_by(Transaction, account_id: attrs.account_id, external_id: attrs.external_id) do
      nil ->
        create_transaction(attrs)

      existing ->
        existing
        |> Transaction.changeset(attrs)
        |> Repo.update()
    end
  end

  @doc """
  Updates a transaction.
  """
  def update_transaction(%Transaction{} = transaction, attrs) do
    transaction
    |> Transaction.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a transaction.
  """
  def delete_transaction(%Transaction{} = transaction) do
    Repo.delete(transaction)
  end

  @doc """
  Syncs transactions for a specific account from Styx API.
  Returns {:ok, count} or {:error, reason}
  """
  def sync_account_transactions(account_id, consent_external_id, opts \\ []) do
    account = Repo.get!(Account, account_id)

    if is_nil(account.external_id) do
      {:error, "Account has no external_id"}
    else
      # Fetch transactions from Styx
      case fetch_transactions_from_styx(consent_external_id, account.external_id, opts) do
        {:ok, transactions} ->
          # Upsert each transaction
          results =
            Enum.map(transactions, fn tx_data ->
              tx_attrs =
                tx_data
                |> Map.put(:account_id, account_id)
                |> Map.put(:consent_id, get_consent_id_by_external_id(consent_external_id))

              upsert_transaction(tx_attrs)
            end)

          # Count successful inserts/updates
          success_count = Enum.count(results, fn {status, _} -> status == :ok end)
          Logger.info("Synced #{success_count}/#{length(transactions)} transactions for account #{account_id}")

          {:ok, success_count}

        {:error, reason} ->
          Logger.error("Failed to fetch transactions: #{inspect(reason)}")
          {:error, reason}
      end
    end
  end

  defp get_consent_id_by_external_id(external_id) do
    case Repo.get_by(BankConsent, external_id: external_id) do
      nil -> nil
      consent -> consent.id
    end
  end

  # Fetch transactions from Styx API
  defp fetch_transactions_from_styx(consent_id, account_id, opts) do
    styx_url = Application.get_env(:yappma, :styx_url)
    api_key = Application.get_env(:yappma, :styx_api_key)

    # Build query params
    query_params =
      opts
      |> Enum.into(%{})
      |> Map.take([:date_from, :date_to])
      |> URI.encode_query()

    # Styx mock uses /consents/... directly without /api/v2 prefix
    url = "#{styx_url}/consents/#{consent_id}/accounts/#{account_id}/transactions?#{query_params}"

    headers = [
      {"Authorization", "Bearer #{api_key}"},
      {"Content-Type", "application/json"}
    ]

    case HTTPoison.get(url, headers) do
      {:ok, %{status_code: 200, body: body}} ->
        case Jason.decode(body) do
          {:ok, %{"transactions" => %{"booked" => booked, "pending" => pending}}} ->
            all_transactions =
              parse_styx_transactions(booked, "booked") ++
                parse_styx_transactions(pending || [], "pending")

            {:ok, all_transactions}

          {:ok, response} ->
            Logger.warning("Unexpected Styx transaction response format: #{inspect(response)}")
            {:error, "Unexpected response format"}

          {:error, reason} ->
            {:error, "JSON decode error: #{inspect(reason)}"}
        end

      {:ok, %{status_code: status, body: body}} ->
        Logger.error("Styx API error #{status}: #{body}")
        {:error, "API returned status #{status}"}

      {:error, reason} ->
        Logger.error("HTTP request failed: #{inspect(reason)}")
        {:error, "HTTP request failed: #{inspect(reason)}"}
    end
  end

  defp parse_styx_transactions(transactions, status) when is_list(transactions) do
    Enum.map(transactions, fn tx ->
      %{
        external_id: tx["transactionId"],
        end_to_end_id: tx["endToEndId"],
        booking_date: parse_date(tx["bookingDate"]),
        value_date: parse_date(tx["valueDate"]),
        transaction_amount: parse_amount(tx["transactionAmount"]),
        transaction_currency: tx["transactionAmount"]["currency"] || "EUR",
        status: status,
        remittance_information: parse_remittance(tx["remittanceInformationUnstructured"]),
        additional_information: tx["additionalInformation"],
        creditor_name: get_in(tx, ["creditorName"]),
        creditor_account_iban: get_in(tx, ["creditorAccount", "iban"]),
        debtor_name: get_in(tx, ["debtorName"]),
        debtor_account_iban: get_in(tx, ["debtorAccount", "iban"]),
        bank_transaction_code: tx["bankTransactionCode"],
        proprietary_bank_transaction_code: get_in(tx, ["proprietaryBankTransactionCode"]),
        raw_data: tx
      }
    end)
  end

  defp parse_styx_transactions(_, _), do: []

  defp parse_date(nil), do: nil
  defp parse_date(date_string) when is_binary(date_string) do
    case Date.from_iso8601(date_string) do
      {:ok, date} -> date
      _ -> nil
    end
  end

  defp parse_amount(%{"amount" => amount}) when is_binary(amount) do
    case Decimal.parse(amount) do
      {decimal, _} -> decimal
      :error -> Decimal.new(0)
    end
  end

  defp parse_amount(_), do: Decimal.new(0)

  defp parse_remittance(list) when is_list(list), do: Enum.join(list, " ")
  defp parse_remittance(string) when is_binary(string), do: string
  defp parse_remittance(_), do: nil
end
