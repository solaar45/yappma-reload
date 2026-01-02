defmodule WealthBackend.Repo.Migrations.AddSourceToSnapshots do
  use Ecto.Migration

  def change do
    alter table(:account_snapshots) do
      add :source, :string, default: "manual", null: false
      add :external_reference, :string
    end

    create index(:account_snapshots, [:source])
  end
end
