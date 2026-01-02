defmodule Yappma.Repo.Migrations.AddPsd2FieldsToAccounts do
  use Ecto.Migration

  def change do
    alter table(:accounts) do
      # PSD2 identification
      add :external_id, :string  # From bank's XS2A API (resourceId)
      add :iban, :string
      add :bic, :string
      
      # Bank information
      add :bank_name, :string
      add :bank_logo_url, :text
      
      # Consent reference
      add :consent_id, references(:bank_consents, 
        type: :binary_id, 
        column: :id,
        on_delete: :nilify_all
      )
      
      # Sync tracking
      add :last_synced_at, :utc_datetime
      add :sync_enabled, :boolean, default: true
      add :sync_frequency, :string, default: "daily"  # daily, twice_daily, manual
      
      # Account capabilities from PSD2
      add :supports_transactions, :boolean, default: true
      add :supports_balances, :boolean, default: true
      
      # Product information from bank
      add :product_name, :string  # e.g., "Girokonto", "Visa Card"
      add :product_type, :string  # From PSD2 cashAccountType
    end

    create unique_index(:accounts, [:external_id], where: "external_id IS NOT NULL")
    create unique_index(:accounts, [:iban], where: "iban IS NOT NULL")
    create index(:accounts, [:consent_id])
    create index(:accounts, [:bank_name])
    create index(:accounts, [:last_synced_at])
  end
end
