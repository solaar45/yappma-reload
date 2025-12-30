defmodule WealthBackendWeb.AccountJSON do
  alias WealthBackend.Accounts.Account

  def index(%{accounts: accounts}) do
    %{data: for(account <- accounts, do: data(account))}
  end

  def show(%{account: account}) do
    %{data: data(account)}
  end

  defp data(%Account{} = account) do
    %{
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      is_active: account.is_active,
      opened_at: account.opened_at,
      closed_at: account.closed_at,
      user_id: account.user_id,
      institution_id: account.institution_id,
      institution: institution_data(account.institution),
      inserted_at: account.inserted_at,
      updated_at: account.updated_at
    }
  end

  defp institution_data(%Ecto.Association.NotLoaded{}), do: nil
  defp institution_data(nil), do: nil
  defp institution_data(institution) do
    %{
      id: institution.id,
      name: institution.name,
      type: institution.type,
      country: institution.country
    }
  end
end
