defmodule WealthBackend.Repo.Migrations.CreateInstitutions do
  use Ecto.Migration

  def change do
    create table(:institutions) do
      add :name, :string, null: false
      add :type, :string, null: false
      add :country, :string
      add :user_id, references(:users, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:institutions, [:user_id])
  end
end
