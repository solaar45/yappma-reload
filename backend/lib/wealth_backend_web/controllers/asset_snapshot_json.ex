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
      quantity: decimal_to_string(snapshot.quantity),
      market_price_per_unit: decimal_to_string(snapshot.market_price_per_unit),
      value: to_string(snapshot.value),
      note: snapshot.note,
      asset_id: snapshot.asset_id,
      inserted_at: snapshot.inserted_at,
      updated_at: snapshot.updated_at
    }
  end

  defp decimal_to_string(nil), do: nil
  defp decimal_to_string(decimal), do: to_string(decimal)
end
