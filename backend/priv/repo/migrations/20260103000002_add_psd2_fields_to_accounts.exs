defmodule Yappma.Repo.Migrations.AddPsd2FieldsToAccounts do
  use Ecto.Migration

  def change do
    alter table(:accounts) do
      # PSD2 Integration Fields
      add :external_id, :string  # Styx/Bank account ID
      add :iban, :string
      add :bic, :string
      add :bank_name, :string
      add :account_product, :string  # e.g., "Girokonto", "Sparkonto"
      
      # Sync metadata
      add :last_synced_at, :utc_datetime
      add :sync_enabled, :boolean, default: true
      add :bank_consent_id, references(:bank_consents, on_delete: :nilify_all)
    end

    create index(:accounts, [:external_id])
    create index(:accounts, [:iban])
    create index(:accounts, [:bank_consent_id])
    create unique_index(:accounts, [:external_id, :bank_consent_id], where: "external_id IS NOT NULL")
  end
end
