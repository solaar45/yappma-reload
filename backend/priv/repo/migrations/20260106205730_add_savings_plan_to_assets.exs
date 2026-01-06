defmodule WealthBackend.Repo.Migrations.AddSavingsPlanToAssets do
  use Ecto.Migration

  def change do
    alter table(:assets) do
      add :savings_plan_amount, :decimal, precision: 12, scale: 2
    end
  end
end
