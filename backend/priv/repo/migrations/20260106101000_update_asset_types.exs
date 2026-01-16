defmodule WealthBackend.Repo.Migrations.UpdateAssetTypes do
  use Ecto.Migration
  import Ecto.Query
  alias WealthBackend.Repo

  def up do
    # Add new asset types
    Repo.insert_all("asset_types", [
      %{code: "crypto", description: "Crypto", inserted_at: ~N[2026-01-06 10:10:00], updated_at: ~N[2026-01-06 10:10:00]},
      %{code: "commodity", description: "Commodities", inserted_at: ~N[2026-01-06 10:10:00], updated_at: ~N[2026-01-06 10:10:00]},
      %{code: "collectible", description: "Valuables", inserted_at: ~N[2026-01-06 10:10:00], updated_at: ~N[2026-01-06 10:10:00]}
    ])

    # Remove loan type (only if no assets are linked to it)
    # Note: If there are existing loan assets, they should be migrated to "other" first
    execute "DELETE FROM asset_types WHERE code = 'loan' AND NOT EXISTS (SELECT 1 FROM assets WHERE asset_type_id = asset_types.id)"
  end

  def down do
    # Restore loan type
    Repo.insert_all("asset_types", [
      %{code: "loan", description: "Loans and debts", inserted_at: ~N[2026-01-06 10:10:00], updated_at: ~N[2026-01-06 10:10:00]}
    ])

    # Remove new types
    execute "DELETE FROM asset_types WHERE code IN ('crypto', 'commodity', 'collectible')"
  end
end
