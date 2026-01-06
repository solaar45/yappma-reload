defmodule WealthBackend.Accounts.UserNotifier do
  @doc """
  Deliver instructions to confirm account.
  """
  def deliver_confirmation_instructions(_user, _url), do: {:ok, :no_op}

  @doc """
  Deliver instructions to reset a user password.
  """
  def deliver_reset_password_instructions(_user, _url), do: {:ok, :no_op}

  @doc """
  Deliver instructions to update a user email.
  """
  def deliver_update_email_instructions(_user, _url), do: {:ok, :no_op}
end
