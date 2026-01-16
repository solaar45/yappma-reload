defmodule WealthBackend.Repo.Migrations.AddFieldsToInstitutions do
  use Ecto.Migration

  def change do
    alter table(:institutions) do
      add :is_system_provided, :boolean, default: false, null: false
      add :category, :string
      add :bic, :string
      add :logo_url, :string
      add :website, :string
      modify :user_id, :bigint, null: true
    end

    create index(:institutions, [:is_system_provided])
    create index(:institutions, [:category])
    
    # Unique name for system institutions
    create unique_index(:institutions, [:name], where: "is_system_provided = true", name: :system_institutions_name_index)
  end
end
