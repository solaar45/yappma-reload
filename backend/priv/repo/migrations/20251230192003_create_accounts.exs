defmodule WealthBackend.Repo.Migrations.CreateAccounts do
  use Ecto.Migration

  def change do
    create table(:accounts) do
      add :name, :string, null: false
      # Type stores the string representation of the atom (e.g., "checking", "savings", "wallet", "loan")
      add :type, :string, null: false
      add :currency, :string, null: false
      add :is_active, :boolean, default: true, null: false
      add :opened_at, :date
      add :closed_at, :date
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :institution_id, references(:institutions, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end

    create index(:accounts, [:user_id])
    create index(:accounts, [:institution_id])
  end
end
