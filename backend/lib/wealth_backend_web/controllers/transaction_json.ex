defmodule WealthBackendWeb.TransactionJSON do
  alias WealthBackend.Banking.Transaction

  def index(%{transactions: transactions}) do
    %{transactions: Enum.map(transactions, &transaction_json/1)}
  end

  def show(%{transaction: transaction}) do
    %{transaction: transaction_json(transaction)}
  end

  defp transaction_json(%Transaction{} = transaction) do
    %{
      id: transaction.id,
      account_id: transaction.account_id,
      account_name: if(Ecto.assoc_loaded?(transaction.account), do: transaction.account.name, else: nil),
      external_id: transaction.external_id,
      booking_date: transaction.booking_date,
      value_date: transaction.value_date,
      amount: Decimal.to_string(transaction.transaction_amount),
      currency: transaction.transaction_currency,
      status: transaction.status,
      description: transaction.remittance_information,
      creditor_name: transaction.creditor_name,
      creditor_iban: transaction.creditor_account_iban,
      debtor_name: transaction.debtor_name,
      debtor_iban: transaction.debtor_account_iban,
      additional_information: transaction.additional_information,
      category: category_json(transaction.category),
      inserted_at: transaction.inserted_at,
      updated_at: transaction.updated_at
    }
  end

  defp category_json(nil), do: nil
  defp category_json(category) when not is_map(category), do: nil
  defp category_json(%Ecto.Association.NotLoaded{}), do: nil
  defp category_json(category) do
    %{
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      type: category.type
    }
  end
end
