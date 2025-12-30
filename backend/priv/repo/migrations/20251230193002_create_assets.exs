defmodule WealthBackend.Repo.Migrations.CreateAssets do
  use Ecto.Migration

  def change do
    create table(:assets) do
      add :name, :string, null: false
      add :symbol, :string
      add :currency, :string, null: false
      add :is_active, :boolean, default: true, null: false
      add :created_at_date, :date
      add :closed_at, :date
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :account_id, references(:accounts, on_delete: :nilify_all)
      add :asset_type_id, references(:asset_types, on_delete: :restrict), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:assets, [:user_id])
    create index(:assets, [:account_id])
    create index(:assets, [:asset_type_id])
  end
end
