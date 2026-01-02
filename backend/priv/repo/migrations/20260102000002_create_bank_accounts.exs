defmodule WealthBackend.Repo.Migrations.CreateBankAccounts do
  use Ecto.Migration

  def change do
    create table(:bank_accounts) do
      add :iban, :string
      add :account_number, :string
      add :bic, :string
      add :external_id, :string
      add :account_name, :string
      add :auto_import_enabled, :boolean, default: true, null: false
      
      add :bank_connection_id, references(:bank_connections, on_delete: :delete_all), null: false
      add :account_id, references(:accounts, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end

    create index(:bank_accounts, [:bank_connection_id])
    create index(:bank_accounts, [:account_id])
    create unique_index(:bank_accounts, [:iban, :bank_connection_id], name: :bank_accounts_iban_connection_index)
  end
end
