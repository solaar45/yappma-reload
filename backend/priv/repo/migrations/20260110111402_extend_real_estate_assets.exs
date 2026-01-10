defmodule WealthBackend.Repo.Migrations.ExtendRealEstateAssets do
  use Ecto.Migration

  def change do
    alter table(:real_estate_assets) do
      add :property_type, :string
      add :usage, :string
      add :rental_income, :decimal, precision: 15, scale: 2
      add :operating_expenses, :decimal, precision: 15, scale: 2
      add :property_tax, :decimal, precision: 15, scale: 2
      add :mortgage_outstanding, :decimal, precision: 15, scale: 2
      add :mortgage_rate, :decimal, precision: 5, scale: 3
      add :construction_year, :integer
      add :renovation_year, :integer
      add :cadastral_number, :string
    end

    create index(:real_estate_assets, [:property_type])
    create index(:real_estate_assets, [:usage])
  end
end
