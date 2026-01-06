defmodule WealthBackendWeb.DashboardJSON do
  def net_worth(%{net_worth: net_worth, date: date}) do
    %{
      data: %{
        total: to_string(net_worth.total),
        assets: to_string(net_worth.assets),
        date: date
      }
    }
  end


  def asset_snapshots(%{snapshots: snapshots, date: date}) do
    %{
      data: %{
        snapshots: Enum.map(snapshots, &asset_snapshot_data/1),
        date: date
      }
    }
  end


  defp asset_snapshot_data(snapshot) do
    %{
      id: snapshot.id,
      snapshot_date: snapshot.snapshot_date,
      quantity: decimal_to_string(snapshot.quantity),
      market_price_per_unit: decimal_to_string(snapshot.market_price_per_unit),
      value: to_string(snapshot.value),
      asset: %{
        id: snapshot.asset.id,
        name: snapshot.asset.name,
        symbol: snapshot.asset.symbol,
        currency: snapshot.asset.currency,
        asset_type: asset_type_data(snapshot.asset.asset_type),
        institution: institution_data(snapshot.asset.institution)
      }
    }
  end

  defp institution_data(nil), do: nil
  defp institution_data(institution) do
    %{
      id: institution.id,
      name: institution.name,
      type: institution.type
    }
  end

  defp asset_type_data(nil), do: nil
  defp asset_type_data(type) do
    %{
      id: type.id,
      code: type.code,
      description: type.description
    }
  end


  defp decimal_to_string(nil), do: nil
  defp decimal_to_string(decimal), do: to_string(decimal)
end
