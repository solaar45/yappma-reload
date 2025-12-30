defmodule WealthBackend.Repo.Migrations.CreateInsuranceAssets do
  use Ecto.Migration

  def change do
    create table(:insurance_assets, primary_key: false) do
      add :asset_id, references(:assets, on_delete: :delete_all), primary_key: true
      add :insurer_name, :string
      add :policy_number, :string
      add :insurance_type, :string
      add :coverage_amount, :decimal, precision: 15, scale: 2
      add :deductible, :decimal, precision: 15, scale: 2
      add :payment_frequency, :string

      timestamps(type: :utc_datetime)
    end

    create index(:insurance_assets, [:policy_number])
  end
end
