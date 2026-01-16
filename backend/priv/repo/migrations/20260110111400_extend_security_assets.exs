defmodule WealthBackend.Repo.Migrations.ExtendSecurityAssets do
  use Ecto.Migration

  def change do
    alter table(:security_assets) do
      add :security_type, :string
      add :distribution_type, :string
      add :expense_ratio, :decimal, precision: 10, scale: 4
      add :issuer, :string
      add :coupon_rate, :decimal, precision: 10, scale: 4
      add :maturity_date, :date
      add :country_of_domicile, :string
      add :benchmark_index, :string
    end

    create index(:security_assets, [:security_type])
    create index(:security_assets, [:distribution_type])
  end
end
