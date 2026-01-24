defmodule WealthBackend.Admin do
  @moduledoc """
  The Admin context - handles admin-specific operations and user management.
  """

  import Ecto.Query, warn: false
  alias WealthBackend.Repo
  alias WealthBackend.Accounts.User
  alias WealthBackend.Admin.AuditLog

  ## Audit Logging

  @doc """
  Creates an audit log entry.
  """
  def create_audit_log(admin_user_id, action, attrs \\ %{}) do
    %AuditLog{}
    |> AuditLog.changeset(Map.merge(attrs, %{
      admin_user_id: admin_user_id,
      action: to_string(action)
    }))
    |> Repo.insert()
  end

  @doc """
  Lists audit logs with optional filters.
  """
  def list_audit_logs(opts \\ []) do
    query = from l in AuditLog,
      order_by: [desc: l.inserted_at],
      preload: [:admin_user, :target_user]

    query
    |> apply_audit_log_filters(opts)
    |> Repo.all()
  end

  defp apply_audit_log_filters(query, []), do: query
  
  defp apply_audit_log_filters(query, [{:admin_user_id, admin_id} | rest]) do
    query
    |> where([l], l.admin_user_id == ^admin_id)
    |> apply_audit_log_filters(rest)
  end

  defp apply_audit_log_filters(query, [{:action, action} | rest]) do
    query
    |> where([l], l.action == ^action)
    |> apply_audit_log_filters(rest)
  end

  defp apply_audit_log_filters(query, [{:limit, limit} | rest]) do
    query
    |> limit(^limit)
    |> apply_audit_log_filters(rest)
  end

  defp apply_audit_log_filters(query, [_ | rest]) do
    apply_audit_log_filters(query, rest)
  end

  ## User Management (Admin Functions)

  @doc """
  Lists all users with optional filters and stats.
  """
  def list_users(opts \\ []) do
    User
    |> order_by([u], desc: u.inserted_at)
    |> apply_user_filters(opts)
    |> Repo.all()
  end

  defp apply_user_filters(query, []), do: query
  
  defp apply_user_filters(query, [{:role, role} | rest]) do
    query
    |> where([u], u.role == ^role)
    |> apply_user_filters(rest)
  end

  defp apply_user_filters(query, [{:active, is_active} | rest]) do
    query
    |> where([u], u.is_active == ^is_active)
    |> apply_user_filters(rest)
  end

  defp apply_user_filters(query, [_ | rest]) do
    apply_user_filters(query, rest)
  end

  @doc """
  Gets a single user by ID.
  """
  def get_user!(id) do
    Repo.get!(User, id)
  end

  @doc """
  Creates a user as admin (can set role and other admin fields).
  """
  def create_user(attrs, %User{} = admin_user) do
    result = 
      %User{created_by_user_id: admin_user.id}
      |> User.admin_registration_changeset(attrs)
      |> Repo.insert()

    case result do
      {:ok, user} ->
        create_audit_log(admin_user.id, "create_user", %{
          target_user_id: user.id,
          details: %{email: user.email, role: user.role}
        })
        {:ok, user}
      error ->
        error
    end
  end

  @doc """
  Updates a user (admin can change role, email, active status).
  """
  def update_user(%User{} = user, attrs, %User{} = admin_user) do
    result =
      user
      |> User.admin_changeset(attrs)
      |> Repo.update()

    case result do
      {:ok, updated_user} ->
        create_audit_log(admin_user.id, "update_user", %{
          target_user_id: user.id,
          details: Map.take(attrs, ["email", "name", "role", "is_active"])
        })
        {:ok, updated_user}
      error ->
        error
    end
  end

  @doc """
  Resets a user's password (admin function).
  """
  def reset_user_password(%User{} = user, new_password, %User{} = admin_user) do
    result =
      user
      |> User.admin_password_reset_changeset(%{password: new_password, force_password_change: true})
      |> Repo.update()

    case result do
      {:ok, updated_user} ->
        create_audit_log(admin_user.id, "reset_password", %{
          target_user_id: user.id,
          details: %{force_change: true}
        })
        {:ok, updated_user}
      error ->
        error
    end
  end

  @doc """
  Deactivates a user (soft delete).
  """
  def deactivate_user(%User{} = user, %User{} = admin_user) do
    result =
      user
      |> User.admin_changeset(%{
        is_active: false,
        deactivated_at: DateTime.utc_now() |> DateTime.truncate(:second),
        deactivated_by_user_id: admin_user.id
      })
      |> Repo.update()

    case result do
      {:ok, updated_user} ->
        create_audit_log(admin_user.id, "deactivate_user", %{
          target_user_id: user.id
        })
        {:ok, updated_user}
      error ->
        error
    end
  end

  @doc """
  Reactivates a deactivated user.
  """
  def reactivate_user(%User{} = user, %User{} = admin_user) do
    result =
      user
      |> User.admin_changeset(%{
        is_active: true,
        deactivated_at: nil,
        deactivated_by_user_id: nil
      })
      |> Repo.update()

    case result do
      {:ok, updated_user} ->
        create_audit_log(admin_user.id, "reactivate_user", %{
          target_user_id: user.id
        })
        {:ok, updated_user}
      error ->
        error
    end
  end

  @doc """
  Permanently deletes a user and all their data.
  This is a destructive operation and should be used with caution.
  """
  def delete_user(%User{} = user, %User{} = admin_user) do
    # Start a transaction to ensure all user data is deleted
    Repo.transaction(fn ->
      # Log before deletion (with user data)
      create_audit_log(admin_user.id, "delete_user", %{
        target_user_id: user.id,
        details: %{
          email: user.email,
          name: user.name,
          role: user.role
        }
      })

      # Delete related records
      # Note: Assumes CASCADE deletes are set up in the database
      # If not, we need to manually delete:
      # - Accounts
      # - Assets  
      # - Institutions
      # - Transactions
      # - Tax Exemptions
      # - Account Snapshots
      # - Asset Snapshots

      # Delete the user
      case Repo.delete(user) do
        {:ok, deleted_user} -> deleted_user
        {:error, changeset} -> Repo.rollback(changeset)
      end
    end)
  end

  @doc """
  Promotes a user to admin role.
  """
  def promote_to_admin(%User{} = user, %User{} = admin_user) do
    result =
      user
      |> User.admin_changeset(%{role: "admin"})
      |> Repo.update()

    case result do
      {:ok, updated_user} ->
        create_audit_log(admin_user.id, "promote_to_admin", %{
          target_user_id: user.id
        })
        {:ok, updated_user}
      error ->
        error
    end
  end

  @doc """
  Demotes an admin to regular user role.
  """
  def demote_to_user(%User{} = user, %User{} = admin_user) do
    result =
      user
      |> User.admin_changeset(%{role: "user"})
      |> Repo.update()

    case result do
      {:ok, updated_user} ->
        create_audit_log(admin_user.id, "demote_to_user", %{
          target_user_id: user.id
        })
        {:ok, updated_user}
      error ->
        error
    end
  end

  @doc """
  Gets statistics for a specific user.
  """
  def get_user_stats(user_id) do
    # This will need to query the actual data
    # For now, returning a placeholder structure
    %{
      accounts_count: count_user_records(WealthBackend.Accounts.Account, user_id),
      assets_count: count_user_records(WealthBackend.Assets.Asset, user_id),
      institutions_count: count_user_records(WealthBackend.Accounts.Institution, user_id),
      total_value: Decimal.new("0.00"),
      last_activity: nil
    }
  end

  defp count_user_records(schema, user_id) do
    Repo.one(
      from r in schema,
      where: r.user_id == ^user_id,
      select: count(r.id)
    ) || 0
  rescue
    _ -> 0
  end

  @doc """
  Gets overall system statistics.
  """
  def get_system_stats do
    %{
      total_users: Repo.one(from u in User, select: count(u.id)),
      active_users: Repo.one(from u in User, where: u.is_active == true, select: count(u.id)),
      inactive_users: Repo.one(from u in User, where: u.is_active == false, select: count(u.id)),
      admin_users: Repo.one(from u in User, where: u.role in ["admin", "super_admin"], select: count(u.id)),
      recent_logins: Repo.one(
        from u in User,
        where: u.last_login_at > ago(7, "day"),
        select: count(u.id)
      )
    }
  end
end
