defmodule WealthBackend.Repo.Migrations.RemoveCryptoAndCommodityAssetTypes do
  use Ecto.Migration

  def up do
    # Since no assets exist with these types (verified by query),
    # we can safely delete them
    execute("""
      DELETE FROM asset_types WHERE code IN ('crypto', 'commodity');
    """)
  end

  def down do
    # Recreate the asset types if rollback is needed
    execute("""
      INSERT INTO asset_types (code, description, inserted_at, updated_at)
      VALUES
        ('crypto', 'Crypto', NOW(), NOW()),
        ('commodity', 'Commodities', NOW(), NOW())
      ON CONFLICT (code) DO NOTHING;
    """)
  end
end
