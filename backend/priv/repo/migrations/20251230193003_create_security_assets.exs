defmodule WealthBackend.Repo.Migrations.CreateSecurityAssets do
  use Ecto.Migration

  def change do
    create table(:security_assets, primary_key: false) do
      add :asset_id, references(:assets, on_delete: :delete_all), primary_key: true
      add :isin, :string
      add :wkn, :string
      add :ticker, :string
      add :exchange, :string
      add :sector, :string

      timestamps(type: :utc_datetime)
    end

    create index(:security_assets, [:isin])
    create index(:security_assets, [:ticker])
  end
end
