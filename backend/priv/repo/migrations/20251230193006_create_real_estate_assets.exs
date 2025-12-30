defmodule WealthBackend.Repo.Migrations.CreateRealEstateAssets do
  use Ecto.Migration

  def change do
    create table(:real_estate_assets, primary_key: false) do
      add :asset_id, references(:assets, on_delete: :delete_all), primary_key: true
      add :address, :string
      add :size_m2, :decimal, precision: 10, scale: 2
      add :purchase_price, :decimal, precision: 15, scale: 2
      add :purchase_date, :date

      timestamps(type: :utc_datetime)
    end
  end
end
