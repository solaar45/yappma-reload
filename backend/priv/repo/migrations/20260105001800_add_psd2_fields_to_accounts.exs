defmodule Yappma.Repo.Migrations.AddPsd2FieldsToAccounts do
  use Ecto.Migration

  def change do
    alter table(:accounts) do
      add :external_id, :string
      add :iban, :string
      add :bic, :string
      add :bank_name, :string
      add :account_product, :string
      add :last_synced_at, :utc_datetime
      add :sync_enabled, :boolean, default: true
      add :bank_consent_id, references(:bank_consents, on_delete: :nilify_all)
    end

    create index(:accounts, [:external_id])
    create unique_index(:accounts, [:external_id, :bank_consent_id], name: :accounts_external_id_bank_consent_id_index)
  end
end
