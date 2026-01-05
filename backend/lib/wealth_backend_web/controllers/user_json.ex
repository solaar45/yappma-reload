defmodule WealthBackendWeb.UserJSON do
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
  def show(%{user: user}) do
    %{data: data(user)}
  end

  defp data(%User{} = user) do
    %{
      id: user.id,
      name: user.name,
      email: user.email,
      currency_default: user.currency_default,
      tax_allowance_limit: user.tax_allowance_limit,
      tax_status: user.tax_status,
      inserted_at: user.inserted_at,
      updated_at: user.updated_at
    }
  end
end
