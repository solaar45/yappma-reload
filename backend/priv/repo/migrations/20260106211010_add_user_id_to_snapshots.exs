defmodule WealthBackend.Repo.Migrations.AddUserIdToSnapshots do
  use Ecto.Migration

  def up do
    alter table(:account_snapshots) do
      add :user_id, references(:users, on_delete: :delete_all)
    end

    alter table(:asset_snapshots) do
      add :user_id, references(:users, on_delete: :delete_all)
    end

    flush()

    # Backfill user_id from associated account/asset
    execute """
    UPDATE account_snapshots SET user_id = (SELECT user_id FROM accounts WHERE accounts.id = account_snapshots.account_id)
    """

    execute """
    UPDATE asset_snapshots SET user_id = (SELECT user_id FROM assets WHERE assets.id = asset_snapshots.asset_id)
    """

    # Now make it non-nullable if we want to enforce it, but let's keep it simple for now or enforce it.
    alter table(:account_snapshots) do
      modify :user_id, :bigint, null: false
    end

    alter table(:asset_snapshots) do
      modify :user_id, :bigint, null: false
    end

    create index(:account_snapshots, [:user_id])
    create index(:asset_snapshots, [:user_id])
  end

  def down do
    alter table(:account_snapshots) do
      remove :user_id
    end

    alter table(:asset_snapshots) do
      remove :user_id
    end
  end
end
