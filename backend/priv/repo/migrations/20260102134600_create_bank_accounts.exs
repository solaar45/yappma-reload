defmodule WealthBackend.Repo.Migrations.CreateBankAccounts do
  use Ecto.Migration

  def change do
    create table(:bank_accounts) do
      add :iban, :string, null: false
      add :account_number, :string
      add :account_name, :string, null: false
      add :bic, :string
      add :bank_name, :string
      add :currency, :string, default: "EUR", null: false
      add :type, :string
      add :bank_connection_id, references(:bank_connections, on_delete: :delete_all), null: false
      add :account_id, references(:accounts, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end

    create index(:bank_accounts, [:bank_connection_id])
    create index(:bank_accounts, [:account_id])
    create index(:bank_accounts, [:iban])
    create unique_index(:bank_accounts, [:bank_connection_id, :iban],
      name: :bank_accounts_unique_iban_per_connection)
  end
end
