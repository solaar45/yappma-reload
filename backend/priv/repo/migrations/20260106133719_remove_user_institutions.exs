defmodule WealthBackend.Repo.Migrations.RemoveUserInstitutions do
  use Ecto.Migration
  import Ecto.Query

  def up do
    # Remove all institutions that are associated with a user (i.e. not system globally provided)
    # This enforces the "Global Master" pattern where only system institutions remain.
    
    # Use execute to run raw SQL for simplicity and speed, or use Ecto query logic.
    # Since we want to delete based on user_id IS NOT NULL.
    
    execute "DELETE FROM institutions WHERE user_id IS NOT NULL"
  end

  def down do
    # This is a destructive operation, so we cannot easily restore the deleted data without a backup.
    # Ideally, we would not do anything here, or we could try to restore from a backup if we had one.
    # For this task, we leave it empty.
    :ok
  end
end
