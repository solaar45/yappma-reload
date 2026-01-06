defmodule WealthBackend.Repo.Migrations.EliminateAccounts do
  use Ecto.Migration

  def up do
    # 1. Add institution_id to assets
    alter table(:assets) do
      add :institution_id, references(:institutions, on_delete: :nilify_all)
    end
    create index(:assets, [:institution_id])

    # 2. Migrate institution_id from accounts to assets for existing assets
    execute """
    UPDATE assets
    SET institution_id = accounts.institution_id
    FROM accounts
    WHERE assets.account_id = accounts.id
    """

    # 3. Create a temporary column to help with snapshot migration
    alter table(:assets) do
      add :temp_old_account_id, :integer
    end

    # 4. Convert accounts to assets of type 'cash'
    execute """
    INSERT INTO assets (name, currency, is_active, user_id, institution_id, asset_type_id, temp_old_account_id, inserted_at, updated_at)
    SELECT name, currency, is_active, user_id, institution_id, (SELECT id FROM asset_types WHERE code = 'cash' LIMIT 1), id, NOW(), NOW()
    FROM accounts
    """

    # 5. Migrate account snapshots to asset snapshots
    execute """
    INSERT INTO asset_snapshots (snapshot_date, value, note, asset_id, inserted_at, updated_at)
    SELECT s.snapshot_date, s.balance, s.note, a.id, s.inserted_at, s.updated_at
    FROM account_snapshots s
    JOIN assets a ON a.temp_old_account_id = s.account_id
    """

    # 6. Cleanup: Remove old account references
    alter table(:assets) do
      remove :account_id
      remove :temp_old_account_id
    end

    drop_if_exists table(:account_snapshots)
    drop_if_exists table(:bank_accounts)
    drop_if_exists table(:bank_connections)
    drop_if_exists table(:accounts)
  end

  def down do
    raise "Reverting this migration is not supported due to data loss on accounts table removal."
  end
end
