defmodule WealthBackend.Repo.Migrations.CreateBankConnections do
  use Ecto.Migration

  def change do
    create table(:bank_connections) do
      add :name, :string, null: false
      add :blz, :string, null: false
      add :user_id_fints, :string, null: false
      add :pin_encrypted, :binary, null: false
      add :fints_url, :string, null: false
      add :status, :string, default: "active", null: false
      add :last_sync_at, :utc_datetime
      add :error_message, :text
      add :user_id, references(:users, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:bank_connections, [:user_id])
    create index(:bank_connections, [:status])
    create unique_index(:bank_connections, [:user_id, :blz, :user_id_fints], 
      name: :bank_connections_unique_per_user)
  end
end
