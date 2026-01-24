defmodule WealthBackendWeb.Admin.UserController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Admin
  alias WealthBackend.Accounts.User

  action_fallback WealthBackendWeb.FallbackController

  @doc """
  GET /api/admin/users
  Lists all users with stats.
  """
  def index(conn, params) do
    filters = build_filters(params)
    users = Admin.list_users(filters)

    users_with_stats = Enum.map(users, fn user ->
      stats = Admin.get_user_stats(user.id)
      Map.put(user, :stats, stats)
    end)

    render(conn, :index, users: users_with_stats)
  end

  @doc """
  GET /api/admin/users/:id
  Get single user details with stats.
  """
  def show(conn, %{"id" => id}) do
    user = Admin.get_user!(id)
    stats = Admin.get_user_stats(id)

    render(conn, :show, user: user, stats: stats)
  end

  @doc """
  POST /api/admin/users
  Create new user as admin.
  """
  def create(conn, %{"user" => user_params}) do
    admin_user = conn.assigns.current_user

    # Set default name if not provided
    user_params = Map.put_new(user_params, "name", user_params["email"])

    case Admin.create_user(user_params, admin_user) do
      {:ok, user} ->
        stats = Admin.get_user_stats(user.id)

        conn
        |> put_status(:created)
        |> render(:show, user: user, stats: stats)

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  @doc """
  PATCH /api/admin/users/:id
  Update user (email, name, role, active status).
  """
  def update(conn, %{"id" => id, "user" => user_params}) do
    admin_user = conn.assigns.current_user
    user = Admin.get_user!(id)

    # Prevent admin from modifying themselves (should use regular user endpoints)
    if user.id == admin_user.id do
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Cannot modify your own account through admin endpoint"})
    else
      # Prevent modifying super_admin unless you are super_admin
      if user.role == "super_admin" && admin_user.role != "super_admin" do
        conn
        |> put_status(:forbidden)
        |> json(%{error: "Cannot modify super admin account"})
      else
        case Admin.update_user(user, user_params, admin_user) do
          {:ok, updated_user} ->
            stats = Admin.get_user_stats(updated_user.id)
            render(conn, :show, user: updated_user, stats: stats)

          {:error, changeset} ->
            {:error, changeset}
        end
      end
    end
  end

  @doc """
  POST /api/admin/users/:id/reset-password
  Admin resets user password.
  """
  def reset_password(conn, %{"id" => id, "password" => new_password}) do
    admin_user = conn.assigns.current_user
    user = Admin.get_user!(id)

    # Prevent resetting your own password
    if user.id == admin_user.id do
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Cannot reset your own password through admin endpoint"})
    else
      case Admin.reset_user_password(user, new_password, admin_user) do
        {:ok, _user} ->
          json(conn, %{
            message: "Password successfully reset",
            force_change: true
          })

        {:error, changeset} ->
          {:error, changeset}
      end
    end
  end

  @doc """
  DELETE /api/admin/users/:id
  Permanently delete user and ALL their data.
  """
  def delete(conn, %{"id" => id}) do
    admin_user = conn.assigns.current_user
    user = Admin.get_user!(id)

    # Prevent deleting yourself
    if user.id == admin_user.id do
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Cannot delete your own account"})
    else
      # Prevent deleting super_admin
      if user.role == "super_admin" do
        conn
        |> put_status(:forbidden)
        |> json(%{error: "Cannot delete super admin account"})
      else
        case Admin.delete_user(user, admin_user) do
          {:ok, _user} ->
            send_resp(conn, :no_content, "")

          {:error, changeset} ->
            {:error, changeset}
        end
      end
    end
  end

  @doc """
  POST /api/admin/users/:id/deactivate
  Soft delete - deactivate user.
  """
  def deactivate(conn, %{"id" => id}) do
    admin_user = conn.assigns.current_user
    user = Admin.get_user!(id)

    # Prevent deactivating yourself
    if user.id == admin_user.id do
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Cannot deactivate your own account"})
    else
      # Prevent deactivating super_admin
      if user.role == "super_admin" do
        conn
        |> put_status(:forbidden)
        |> json(%{error: "Cannot deactivate super admin account"})
      else
        case Admin.deactivate_user(user, admin_user) do
          {:ok, updated_user} ->
            stats = Admin.get_user_stats(updated_user.id)
            render(conn, :show, user: updated_user, stats: stats)

          {:error, changeset} ->
            {:error, changeset}
        end
      end
    end
  end

  @doc """
  POST /api/admin/users/:id/reactivate
  Reactivate deactivated user.
  """
  def reactivate(conn, %{"id" => id}) do
    admin_user = conn.assigns.current_user
    user = Admin.get_user!(id)

    case Admin.reactivate_user(user, admin_user) do
      {:ok, updated_user} ->
        stats = Admin.get_user_stats(updated_user.id)
        render(conn, :show, user: updated_user, stats: stats)

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  @doc """
  POST /api/admin/users/:id/promote-to-admin
  Promote user to admin role (super_admin only).
  """
  def promote_to_admin(conn, %{"id" => id}) do
    admin_user = conn.assigns.current_user

    # Only super_admin can promote
    if admin_user.role != "super_admin" do
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Only super admin can promote users to admin"})
    else
      user = Admin.get_user!(id)

      case Admin.promote_to_admin(user, admin_user) do
        {:ok, updated_user} ->
          stats = Admin.get_user_stats(updated_user.id)
          render(conn, :show, user: updated_user, stats: stats)

        {:error, changeset} ->
          {:error, changeset}
      end
    end
  end

  @doc """
  POST /api/admin/users/:id/demote-to-user
  Demote admin to regular user role (super_admin only).
  """
  def demote_to_user(conn, %{"id" => id}) do
    admin_user = conn.assigns.current_user

    # Only super_admin can demote
    if admin_user.role != "super_admin" do
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Only super admin can demote admins"})
    else
      user = Admin.get_user!(id)

      # Cannot demote super_admin
      if user.role == "super_admin" do
        conn
        |> put_status(:forbidden)
        |> json(%{error: "Cannot demote super admin"})
      else
        case Admin.demote_to_user(user, admin_user) do
          {:ok, updated_user} ->
            stats = Admin.get_user_stats(updated_user.id)
            render(conn, :show, user: updated_user, stats: stats)

          {:error, changeset} ->
            {:error, changeset}
        end
      end
    end
  end

  defp build_filters(params) do
    []
    |> maybe_add_filter(:role, params["role"])
    |> maybe_add_filter(:active, params["active"])
  end

  defp maybe_add_filter(filters, _key, nil), do: filters
  defp maybe_add_filter(filters, key, value), do: [{key, value} | filters]
end
