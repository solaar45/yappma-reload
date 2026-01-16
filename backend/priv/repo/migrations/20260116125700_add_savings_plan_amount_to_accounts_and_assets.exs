defmodule WealthBackend.Repo.Migrations.AddSavingsPlanAmountToAccountsAndAssets do
  use Ecto.Migration

  def change do
    alter table(:accounts) do
      add :savings_plan_amount, :decimal, precision: 15, scale: 2, default: 0
    end

    alter table(:assets) do
      add :savings_plan_amount, :decimal, precision: 15, scale: 2, default: 0
    end
  end
end
