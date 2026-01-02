defmodule WealthBackendWeb.AuthJSON do
  alias WealthBackend.Accounts.User

  @doc """
  Renders a token response with user information.
  """
  def token(%{token: token, user: user}) do
    %{
      token: token,
      user: user_data(user)
    }
  end

  defp user_data(%User{} = user) do
    %{
      id: user.id,
      name: user.name,
      email: user.email,
      currency_default: user.currency_default
    }
  end
end
