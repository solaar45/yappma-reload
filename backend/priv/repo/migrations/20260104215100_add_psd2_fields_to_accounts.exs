defmodule WealthBackend.Repo.Migrations.AddPsd2FieldsToAccounts do
  use Ecto.Migration

  def change do
    alter table(:accounts) do
      # PSD2/Bank-specific fields
      add :iban, :string
      add :external_id, :string  # PSD2 account resource_id from bank
      add :bank_consent_id, references(:bank_consents, on_delete: :nilify_all)
      
      # Sync status fields
      add :is_synced, :boolean, default: false
      add :last_synced_at, :utc_datetime
      add :sync_enabled, :boolean, default: false
      
      # Metadata for additional PSD2 data (account details, limits, etc.)
      add :metadata, :map
    end

    # Indexes for efficient querying
    create index(:accounts, [:iban])
    create index(:accounts, [:external_id])
    create index(:accounts, [:bank_consent_id])
    create index(:accounts, [:is_synced])
    create index(:accounts, [:sync_enabled])
    
    # Unique constraint: one external_id per consent
    create unique_index(:accounts, [:external_id, :bank_consent_id], 
      name: :accounts_external_id_consent_id_index,
      where: "external_id IS NOT NULL AND bank_consent_id IS NOT NULL"
    )
  end
end
