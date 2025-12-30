defmodule WealthBackend.Repo.Migrations.CreateAssetTypes do
  use Ecto.Migration

  def change do
    create table(:asset_types) do
      add :code, :string, null: false
      add :description, :string

      timestamps(type: :utc_datetime)
    end

    create unique_index(:asset_types, [:code])
  end
end
