defmodule WealthBackend.Repo.Migrations.CreateTransactions do
  use Ecto.Migration

  def change do
    create table(:transactions) do
      # Link to account
      add :account_id, references(:accounts, on_delete: :delete_all), null: false
      
      # Link to bank consent (optional - for tracking which sync brought it in)
      add :consent_id, references(:bank_consents, on_delete: :nilify_all)
      
      # Styx/PSD2 Transaction ID
      add :external_id, :string, null: false
      add :end_to_end_id, :string
      
      # Transaction details
      add :booking_date, :date, null: false
      add :value_date, :date
      add :transaction_amount, :decimal, precision: 15, scale: 2, null: false
      add :transaction_currency, :string, default: "EUR", null: false
      
      # Status
      add :status, :string, null: false  # "booked" or "pending"
      
      # Description fields
      add :remittance_information, :text
      add :additional_information, :text
      
      # Counterparty information
      add :creditor_name, :string
      add :creditor_account_iban, :string
      add :debtor_name, :string
      add :debtor_account_iban, :string
      
      # Metadata
      add :bank_transaction_code, :string
      add :proprietary_bank_transaction_code, :string
      
      # Raw data from Styx (for debugging/future use)
      add :raw_data, :map

      timestamps(type: :utc_datetime)
    end

    create index(:transactions, [:account_id])
    create index(:transactions, [:consent_id])
    create index(:transactions, [:booking_date])
    create index(:transactions, [:status])
    create unique_index(:transactions, [:account_id, :external_id], name: :transactions_account_external_id_index)
  end
end
