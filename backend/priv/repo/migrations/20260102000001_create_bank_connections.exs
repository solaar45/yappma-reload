defmodule WealthBackend.Repo.Migrations.CreateBankConnections do
  use Ecto.Migration

  def change do
    create table(:bank_connections) do
      add :name, :string, null: false
      add :blz, :string, null: false
      add :fints_url, :string, null: false
      add :user_id_encrypted, :binary, null: false
      add :pin_encrypted, :binary, null: false
      add :status, :string, default: "active", null: false
      add :last_sync_at, :utc_datetime
      add :sync_frequency, :string, default: "manual", null: false
      add :auto_sync_enabled, :boolean, default: false, null: false
      add :last_error, :text
      add :sync_count, :integer, default: 0, null: false
      
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :institution_id, references(:institutions, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end

    create index(:bank_connections, [:user_id])
    create index(:bank_connections, [:institution_id])
    create index(:bank_connections, [:status])
    create index(:bank_connections, [:auto_sync_enabled])
  end
end
