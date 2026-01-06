defmodule WealthBackend.Repo.Migrations.AddRiskClassToAssets do
  use Ecto.Migration

  def change do
    alter table(:assets) do
      add :risk_class, :integer, default: 3
      add :risk_class_source, :string, default: "auto_type" # "auto_type", "auto_api", "manual"
    end

    create constraint(:assets, :risk_class_range,
      check: "risk_class >= 1 AND risk_class <= 5")
  end
end
