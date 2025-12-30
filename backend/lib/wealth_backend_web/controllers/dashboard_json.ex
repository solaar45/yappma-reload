defmodule WealthBackendWeb.DashboardJSON do
  def net_worth(%{net_worth: net_worth, date: date}) do
    %{
      data: %{
        total: to_string(net_worth.total),
        accounts: to_string(net_worth.accounts),
        assets: to_string(net_worth.assets),
        date: date
      }
    }
  end

  def account_snapshots(%{snapshots: snapshots, date: date}) do
    %{
      data: %{
        snapshots: Enum.map(snapshots, &account_snapshot_data/1),
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

  defp account_snapshot_data(snapshot) do
    %{
      id: snapshot.id,
      snapshot_date: snapshot.snapshot_date,
      balance: to_string(snapshot.balance),
      currency: snapshot.currency,
      account: %{
        id: snapshot.account.id,
        name: snapshot.account.name,
        type: snapshot.account.type,
        institution: institution_data(snapshot.account.institution)
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
        account: account_data(snapshot.asset.account)
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

  defp account_data(nil), do: nil
  defp account_data(account) do
    %{
      id: account.id,
      name: account.name,
      type: account.type
    }
  end

  defp decimal_to_string(nil), do: nil
  defp decimal_to_string(decimal), do: to_string(decimal)
end
