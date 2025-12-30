defmodule WealthBackendWeb.AccountSnapshotJSON do
  alias WealthBackend.Analytics.AccountSnapshot

  def index(%{snapshots: snapshots}) do
    %{data: for(snapshot <- snapshots, do: data(snapshot))}
  end

  def show(%{snapshot: snapshot}) do
    %{data: data(snapshot)}
  end

  defp data(%AccountSnapshot{} = snapshot) do
    %{
      id: snapshot.id,
      snapshot_date: snapshot.snapshot_date,
      balance: to_string(snapshot.balance),
      currency: snapshot.currency,
      note: snapshot.note,
      account_id: snapshot.account_id,
      inserted_at: snapshot.inserted_at,
      updated_at: snapshot.updated_at
    }
  end
end
