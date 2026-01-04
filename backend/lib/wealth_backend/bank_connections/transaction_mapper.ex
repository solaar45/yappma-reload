defmodule WealthBackend.BankConnections.TransactionMapper do
  @moduledoc """
  Maps PSD2/XS2A transaction format to YAPPMA transaction schema.
  """

  @doc """
  Converts a PSD2 transaction to YAPPMA format.
  
  ## PSD2 Transaction Format
  
  ```json
  {
    "transactionId": "2021070112345678",
    "bookingDate": "2021-07-01",
    "valueDate": "2021-07-01",
    "transactionAmount": {
      "amount": "-12.50",
      "currency": "EUR"
    },
    "creditorName": "EDEKA Inh. Mustermann",
    "debtorName": "Max Mustermann",
    "remittanceInformationUnstructured": "Einkauf Berlin Hauptstr.",
    "remittanceInformationStructured": null,
    "proprietaryBankTransactionCode": "PURCHASE",
    "merchantCategoryCode": "5411"
  }
  ```
  """
  def map_from_psd2(account, psd2_tx) do
    amount = parse_amount(psd2_tx["transactionAmount"]["amount"])
    
    %{
      account_id: account[:id],
      external_id: psd2_tx["transactionId"],
      date: parse_date(psd2_tx["bookingDate"]),
      value_date: parse_date(psd2_tx["valueDate"]),
      amount: amount,
      currency: psd2_tx["transactionAmount"]["currency"],
      description: build_description(psd2_tx),
      counterparty: extract_counterparty(psd2_tx, amount),
      category: guess_category(psd2_tx),
      merchant_category_code: psd2_tx["merchantCategoryCode"],
      bank_transaction_code: psd2_tx["proprietaryBankTransactionCode"],
      raw_data: psd2_tx,
      imported_at: DateTime.utc_now()
    }
  end

  defp parse_amount(amount) when is_binary(amount) do
    String.to_float(amount)
  end

  defp parse_amount(amount) when is_number(amount), do: amount / 1

  defp parse_date(nil), do: nil
  defp parse_date(date_string) when is_binary(date_string) do
    case Date.from_iso8601(date_string) do
      {:ok, date} -> date
      _ -> nil
    end
  end

  defp build_description(psd2_tx) do
    # Use structured info first, fall back to unstructured
    psd2_tx["remittanceInformationUnstructured"] ||
    psd2_tx["remittanceInformationStructured"] ||
    psd2_tx["additionalInformation"] ||
    "Transaction #{psd2_tx["transactionId"]}"
  end

  defp extract_counterparty(psd2_tx, amount) do
    # For outgoing (negative), use creditor; for incoming (positive), use debtor
    if amount < 0 do
      psd2_tx["creditorName"] || psd2_tx["creditorAccount"]["iban"]
    else
      psd2_tx["debtorName"] || psd2_tx["debtorAccount"]["iban"]
    end
  end

  @doc """
  Guesses transaction category based on available data.
  
  Uses:
  - Merchant Category Codes (MCC)
  - Bank transaction codes
  - Counterparty names
  - Description keywords
  """
  def guess_category(psd2_tx) do
    cond do
      # MCC-based categorization
      mcc = psd2_tx["merchantCategoryCode"] ->
        categorize_by_mcc(mcc)
      
      # Bank code categorization
      code = psd2_tx["proprietaryBankTransactionCode"] ->
        categorize_by_bank_code(code)
      
      # Keyword-based categorization
      true ->
        categorize_by_keywords(psd2_tx)
    end
  end

  # Merchant Category Code mapping (ISO 18245)
  defp categorize_by_mcc(mcc) when is_binary(mcc) do
    case String.to_integer(mcc) do
      code when code in 5411..5499 -> "groceries"
      code when code in 5812..5814 -> "restaurants"
      code when code in 5541..5599 -> "gas_stations"
      code when code in 7011..7299 -> "travel"
      code when code in 5311..5399 -> "shopping"
      code when code in 4111..4900 -> "transport"
      code when code in 8011..8099 -> "healthcare"
      _ -> "other"
    end
  end

  defp categorize_by_mcc(_), do: "other"

  defp categorize_by_bank_code(code) do
    code_upper = String.upcase(code)
    
    cond do
      String.contains?(code_upper, ["SALARY", "WAGE"]) -> "income"
      String.contains?(code_upper, ["RENT", "MIETE"]) -> "housing"
      String.contains?(code_upper, ["INSURANCE", "VERSICHERUNG"]) -> "insurance"
      String.contains?(code_upper, ["ATM", "CASH"]) -> "cash_withdrawal"
      String.contains?(code_upper, ["TRANSFER", "UEBERWEISUNG"]) -> "transfer"
      true -> "other"
    end
  end

  defp categorize_by_keywords(psd2_tx) do
    text = 
      [
        psd2_tx["remittanceInformationUnstructured"],
        psd2_tx["creditorName"],
        psd2_tx["debtorName"]
      ]
      |> Enum.join(" ")
      |> String.downcase()

    cond do
      Regex.match?(~r/edeka|rewe|aldi|lidl|supermarkt/i, text) -> "groceries"
      Regex.match?(~r/restaurant|pizza|cafe|mcdonald/i, text) -> "restaurants"
      Regex.match?(~r/tankstelle|shell|aral|esso/i, text) -> "gas_stations"
      Regex.match?(~r/amazon|ebay|zalando/i, text) -> "shopping"
      Regex.match?(~r/netflix|spotify|disney/i, text) -> "entertainment"
      Regex.match?(~r/miete|rent/i, text) -> "housing"
      Regex.match?(~r/gehalt|lohn|salary/i, text) -> "income"
      true -> "other"
    end
  end
end
