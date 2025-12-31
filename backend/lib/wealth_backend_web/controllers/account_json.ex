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
      iban: account.iban,
      user_id: account.user_id,
      institution_id: account.institution_id,
      account_type_id: account.account_type_id,
      institution: institution_data(account.institution),
      account_type: account_type_data(account.account_type),
      snapshots: snapshots_data(account.snapshots),
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

  defp account_type_data(%Ecto.Association.NotLoaded{}), do: nil
  defp account_type_data(nil), do: nil
  defp account_type_data(account_type) do
    %{
      id: account_type.id,
      code: account_type.code,
      description: account_type.description
    }
  end

  defp snapshots_data(%Ecto.Association.NotLoaded{}), do: []
  defp snapshots_data(snapshots) when is_list(snapshots) do
    Enum.map(snapshots, &snapshot_data/1)
  end
  defp snapshots_data(_), do: []

  defp snapshot_data(snapshot) do
    %{
      id: snapshot.id,
      snapshot_date: snapshot.snapshot_date,
      balance: snapshot.balance,
      currency: snapshot.currency,
      notes: snapshot.notes,
      account_id: snapshot.account_id
    }
  end
end
