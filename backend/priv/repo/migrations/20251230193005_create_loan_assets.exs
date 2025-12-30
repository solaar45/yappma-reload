defmodule WealthBackend.Repo.Migrations.CreateLoanAssets do
  use Ecto.Migration

  def change do
    create table(:loan_assets, primary_key: false) do
      add :asset_id, references(:assets, on_delete: :delete_all), primary_key: true
      add :interest_rate, :decimal, precision: 5, scale: 2
      add :payment_frequency, :string
      add :maturity_date, :date

      timestamps(type: :utc_datetime)
    end
  end
end
