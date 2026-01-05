# Script for populating the database with test transactions
# Run this script with: mix run priv/repo/seeds_transactions.exs

alias WealthBackend.Repo
alias WealthBackend.Banking.Transaction

require Logger

# Clear existing transactions (optional)
Repo.delete_all(Transaction)
Logger.info("Cleared existing transactions")

# Get first account (should be account_id = 5)
account_id = 5

# Sample transactions
transactions = [
  %{
    account_id: account_id,
    external_id: "TX001",
    booking_date: ~D[2026-01-04],
    value_date: ~D[2026-01-04],
    transaction_amount: Decimal.new("1500.00"),
    transaction_currency: "EUR",
    status: "booked",
    remittance_information: "Salary January 2026",
    creditor_name: "Employer GmbH",
    debtor_account_iban: "DE89370400440532013000"
  },
  %{
    account_id: account_id,
    external_id: "TX002",
    booking_date: ~D[2026-01-03],
    value_date: ~D[2026-01-03],
    transaction_amount: Decimal.new("-45.20"),
    transaction_currency: "EUR",
    status: "booked",
    remittance_information: "Grocery shopping - REWE",
    creditor_name: "REWE Markt GmbH",
    creditor_account_iban: "DE89370400440532013001"
  },
  %{
    account_id: account_id,
    external_id: "TX003",
    booking_date: ~D[2026-01-02],
    value_date: ~D[2026-01-02],
    transaction_amount: Decimal.new("-120.50"),
    transaction_currency: "EUR",
    status: "booked",
    remittance_information: "Online order - Amazon",
    creditor_name: "Amazon EU S.a.r.L",
    creditor_account_iban: "LU123456789012345678"
  },
  %{
    account_id: account_id,
    external_id: "TX004",
    booking_date: ~D[2026-01-01],
    value_date: ~D[2026-01-01],
    transaction_amount: Decimal.new("-850.00"),
    transaction_currency: "EUR",
    status: "booked",
    remittance_information: "Rent January 2026",
    creditor_name: "Landlord Management",
    creditor_account_iban: "DE89370400440532013002"
  },
  %{
    account_id: account_id,
    external_id: "TX005",
    booking_date: ~D[2025-12-31],
    value_date: ~D[2025-12-31],
    transaction_amount: Decimal.new("-29.99"),
    transaction_currency: "EUR",
    status: "booked",
    remittance_information: "Netflix subscription",
    creditor_name: "Netflix International B.V.",
    creditor_account_iban: "NL12ABNA0123456789"
  },
  %{
    account_id: account_id,
    external_id: "TX006",
    booking_date: ~D[2025-12-30],
    value_date: ~D[2025-12-30],
    transaction_amount: Decimal.new("-65.30"),
    transaction_currency: "EUR",
    status: "booked",
    remittance_information: "Gas station - Shell",
    creditor_name: "Shell Deutschland Oil GmbH",
    creditor_account_iban: "DE89370400440532013003"
  },
  %{
    account_id: account_id,
    external_id: "TX007",
    booking_date: ~D[2025-12-29],
    value_date: ~D[2025-12-29],
    transaction_amount: Decimal.new("250.00"),
    transaction_currency: "EUR",
    status: "booked",
    remittance_information: "Gift from parents",
    debtor_name: "Parents",
    debtor_account_iban: "DE89370400440532013004"
  },
  %{
    account_id: account_id,
    external_id: "TX008",
    booking_date: ~D[2025-12-28],
    value_date: ~D[2025-12-28],
    transaction_amount: Decimal.new("-89.95"),
    transaction_currency: "EUR",
    status: "booked",
    remittance_information: "Restaurant dinner",
    creditor_name: "Restaurant La Bella Vita",
    creditor_account_iban: "DE89370400440532013005"
  },
  %{
    account_id: account_id,
    external_id: "TX009",
    booking_date: ~D[2025-12-27],
    value_date: ~D[2025-12-27],
    transaction_amount: Decimal.new("-12.50"),
    transaction_currency: "EUR",
    status: "pending",
    remittance_information: "Coffee shop",
    creditor_name: "Starbucks Coffee",
    creditor_account_iban: "DE89370400440532013006"
  },
  %{
    account_id: account_id,
    external_id: "TX010",
    booking_date: ~D[2025-12-26],
    value_date: ~D[2025-12-26],
    transaction_amount: Decimal.new("-35.00"),
    transaction_currency: "EUR",
    status: "booked",
    remittance_information: "Pharmacy",
    creditor_name: "City Pharmacy",
    creditor_account_iban: "DE89370400440532013007"
  }
]

# Insert transactions
Enum.each(transactions, fn tx_attrs ->
  case Repo.insert(Transaction.changeset(%Transaction{}, tx_attrs)) do
    {:ok, tx} ->
      Logger.info("Inserted transaction: #{tx.remittance_information}")

    {:error, changeset} ->
      Logger.error("Failed to insert transaction: #{inspect(changeset.errors)}")
  end
end)

Logger.info("\nSeeded #{length(transactions)} transactions!")
Logger.info("Run the app and navigate to /transactions to see them!")
