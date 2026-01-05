defmodule WealthBackendWeb.TransactionJSON do
  alias WealthBackend.Banking.Transaction

  @doc """
  Renders a list of transactions.
  """
  def index(%{transactions: transactions}) do
    %{data: for(transaction <- transactions, do: data(transaction))}
  end

  @doc """
  Renders a single transaction.
  """
  def show(%{transaction: transaction}) do
    %{data: data(transaction)}
  end

  defp data(%Transaction{} = transaction) do
    %{
      id: transaction.id,
      account_id: transaction.account_id,
      consent_id: transaction.consent_id,
      external_id: transaction.external_id,
      end_to_end_id: transaction.end_to_end_id,
      booking_date: transaction.booking_date,
      value_date: transaction.value_date,
      transaction_amount: transaction.transaction_amount,
      transaction_currency: transaction.transaction_currency,
      status: transaction.status,
      remittance_information: transaction.remittance_information,
      additional_information: transaction.additional_information,
      creditor_name: transaction.creditor_name,
      creditor_account_iban: transaction.creditor_account_iban,
      debtor_name: transaction.debtor_name,
      debtor_account_iban: transaction.debtor_account_iban,
      bank_transaction_code: transaction.bank_transaction_code,
      proprietary_bank_transaction_code: transaction.proprietary_bank_transaction_code,
      inserted_at: transaction.inserted_at,
      updated_at: transaction.updated_at
    }
  end
end
