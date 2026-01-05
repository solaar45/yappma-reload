defmodule WealthBackend.Repo.Migrations.AddTaxFieldsToUsersAndCreateTaxExemptions do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :tax_allowance_limit, :integer, default: 1000
      add :tax_status, :string, default: "single"
    end

    create table(:tax_exemptions) do
      add :amount, :decimal, precision: 12, scale: 2, null: false
      add :year, :integer, null: false
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :institution_id, references(:institutions, on_delete: :delete_all), null: false

      timestamps()
    end

    create index(:tax_exemptions, [:user_id])
    create index(:tax_exemptions, [:institution_id])
    create unique_index(:tax_exemptions, [:user_id, :institution_id, :year])
  end
end
