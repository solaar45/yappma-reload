defmodule WealthBackendWeb.Admin.UserJSON do
  alias WealthBackend.Accounts.User

  @doc """
  Renders a list of users.
  """
  def index(%{users: users}) do
    %{data: for(user <- users, do: data(user))}
  end

  @doc """
  Renders a single user.
  """
  def show(%{user: user, stats: stats}) do
    %{data: data(user) |> Map.put(:stats, stats)}
  end

  defp data(%User{} = user) do
    %{
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_active: user.is_active,
      currency_default: user.currency_default,
      tax_status: user.tax_status,
      tax_allowance_limit: user.tax_allowance_limit,
      last_login_at: user.last_login_at,
      login_count: user.login_count,
      deactivated_at: user.deactivated_at,
      force_password_change: user.force_password_change,
      created_by_user_id: user.created_by_user_id,
      deactivated_by_user_id: user.deactivated_by_user_id,
      inserted_at: user.inserted_at,
      updated_at: user.updated_at,
      stats: Map.get(user, :stats)
    }
  end
end
