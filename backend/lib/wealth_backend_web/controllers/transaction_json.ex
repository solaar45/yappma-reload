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
      external_id: transaction.external_id,
      booking_date: transaction.booking_date,
      value_date: transaction.value_date,
      amount: to_string(transaction.transaction_amount),
      currency: transaction.transaction_currency,
      status: transaction.status,
      description: transaction.remittance_information,
      additional_info: transaction.additional_information,
      creditor_name: transaction.creditor_name,
      creditor_iban: transaction.creditor_account_iban,
      debtor_name: transaction.debtor_name,
      debtor_iban: transaction.debtor_account_iban,
      inserted_at: transaction.inserted_at,
      updated_at: transaction.updated_at
    }
  end
end
