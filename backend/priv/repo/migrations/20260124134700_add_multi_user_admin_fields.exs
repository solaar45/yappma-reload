defmodule WealthBackend.Repo.Migrations.AddMultiUserAdminFields do
  use Ecto.Migration

  def change do
    # Add new fields to users table
    alter table(:users) do
      add :role, :string, default: "user", null: false
      add :is_active, :boolean, default: true, null: false
      add :created_by_user_id, references(:users, on_delete: :nilify_all)
      add :last_login_at, :utc_datetime
      add :login_count, :integer, default: 0, null: false
      add :deactivated_at, :utc_datetime
      add :deactivated_by_user_id, references(:users, on_delete: :nilify_all)
      add :force_password_change, :boolean, default: false, null: false
    end

    # Create indexes for performance
    create index(:users, [:role])
    create index(:users, [:is_active])
    create index(:users, [:created_by_user_id])
    create index(:users, [:deactivated_by_user_id])
    create index(:users, [:last_login_at])

    # Create audit_logs table
    create table(:audit_logs) do
      add :admin_user_id, references(:users, on_delete: :nilify_all), null: false
      add :action, :string, null: false
      add :target_user_id, references(:users, on_delete: :nilify_all)
      add :details, :map, default: %{}
      add :ip_address, :string
      add :user_agent, :text
      
      timestamps(updated_at: false)
    end

    # Indexes for audit log queries
    create index(:audit_logs, [:admin_user_id])
    create index(:audit_logs, [:target_user_id])
    create index(:audit_logs, [:action])
    create index(:audit_logs, [:inserted_at])
    create index(:audit_logs, [:admin_user_id, :inserted_at])

    # Set first user as super_admin if exists
    execute(
      """
      UPDATE users 
      SET role = 'super_admin' 
      WHERE id = (SELECT id FROM users ORDER BY inserted_at ASC LIMIT 1)
      """,
      """
      UPDATE users 
      SET role = 'user' 
      WHERE role = 'super_admin'
      """
    )
  end
end
