defmodule WealthBackend.Repo.Migrations.CreateUsersAuthTables do
  use Ecto.Migration

  def change do
    execute "CREATE EXTENSION IF NOT EXISTS citext", ""

    alter table(:users) do
      modify :email, :citext, null: false
      add :hashed_password, :string, null: true # Allow null for now
      add :confirmed_at, :utc_datetime
    end

    flush()

    # Backfill existing users with a dummy password hash (e.g. for "password1234")
    # Bcrypt hash for "password1234": $2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgdtzq77hdj8H7azN3S9U9i85jH2
    execute "UPDATE users SET hashed_password = '$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgdtzq77hdj8H7azN3S9U9i85jH2' WHERE hashed_password IS NULL"
    # Mark existing users as confirmed
    execute "UPDATE users SET confirmed_at = NOW() WHERE confirmed_at IS NULL"

    alter table(:users) do
      modify :hashed_password, :string, null: false
    end

    # Email index already exists from 20251230192001_create_users.exs, 
    # but we might want to ensure it's unique and uses citext if supported.
    # Since it's already unique, we can leave it or drop/recreate.

    create table(:users_tokens) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :token, :binary, null: false
      add :context, :string, null: false
      add :sent_to, :string

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create index(:users_tokens, [:user_id])
    create unique_index(:users_tokens, [:context, :token])
  end
end
