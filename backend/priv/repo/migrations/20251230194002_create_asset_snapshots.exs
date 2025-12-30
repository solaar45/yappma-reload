defmodule WealthBackend.Repo.Migrations.CreateAssetSnapshots do
  use Ecto.Migration

  def change do
    create table(:asset_snapshots) do
      add :snapshot_date, :date, null: false
      add :quantity, :decimal, precision: 15, scale: 4
      add :market_price_per_unit, :decimal, precision: 15, scale: 2
      add :value, :decimal, precision: 15, scale: 2, null: false
      add :note, :text
      add :asset_id, references(:assets, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:asset_snapshots, [:asset_id])
    create index(:asset_snapshots, [:snapshot_date])
    create unique_index(:asset_snapshots, [:asset_id, :snapshot_date])
  end
end
