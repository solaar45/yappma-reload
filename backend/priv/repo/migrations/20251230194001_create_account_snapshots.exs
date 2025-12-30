defmodule WealthBackend.Repo.Migrations.CreateAccountSnapshots do
  use Ecto.Migration

  def change do
    create table(:account_snapshots) do
      add :snapshot_date, :date, null: false
      add :balance, :decimal, precision: 15, scale: 2, null: false
      add :currency, :string, null: false
      add :note, :text
      add :account_id, references(:accounts, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:account_snapshots, [:account_id])
    create index(:account_snapshots, [:snapshot_date])
    create unique_index(:account_snapshots, [:account_id, :snapshot_date])
  end
end
