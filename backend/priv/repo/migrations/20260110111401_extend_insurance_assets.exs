defmodule WealthBackend.Repo.Migrations.ExtendInsuranceAssets do
  use Ecto.Migration

  def change do
    alter table(:insurance_assets) do
      add :policy_start_date, :date
      add :policy_end_date, :date
      add :premium_amount, :decimal, precision: 15, scale: 2
    end
  end
end
