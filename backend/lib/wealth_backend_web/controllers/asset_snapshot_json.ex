defmodule WealthBackendWeb.AssetSnapshotJSON do
  alias WealthBackend.Analytics.AssetSnapshot

  def index(%{snapshots: snapshots}) do
    %{data: for(snapshot <- snapshots, do: data(snapshot))}
  end

  def show(%{snapshot: snapshot}) do
    %{data: data(snapshot)}
  end

  defp data(%AssetSnapshot{} = snapshot) do
    %{
      id: snapshot.id,
      snapshot_date: snapshot.snapshot_date,
      quantity: snapshot.quantity,
      market_price_per_unit: snapshot.market_price_per_unit,
      value: snapshot.value,
      note: snapshot.note,
      asset_id: snapshot.asset_id,
      inserted_at: snapshot.inserted_at,
      updated_at: snapshot.updated_at
    }
  end
end
