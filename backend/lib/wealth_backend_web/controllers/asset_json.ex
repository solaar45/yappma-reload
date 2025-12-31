defmodule WealthBackendWeb.AssetJSON do
  alias WealthBackend.Portfolio.Asset

  def index(%{assets: assets}) do
    %{data: for(asset <- assets, do: data(asset))}
  end

  def show(%{asset: asset}) do
    %{data: data(asset)}
  end

  defp data(%Asset{} = asset) do
    # Get isin and ticker from security_asset if available
    {isin, ticker} = case asset.security_asset do
      %Ecto.Association.NotLoaded{} -> {nil, nil}
      nil -> {nil, nil}
      security -> {security.isin, security.ticker}
    end

    %{
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      isin: isin,
      ticker: ticker,
      currency: asset.currency,
      is_active: asset.is_active,
      created_at_date: asset.created_at_date,
      closed_at: asset.closed_at,
      user_id: asset.user_id,
      account_id: asset.account_id,
      asset_type_id: asset.asset_type_id,
      asset_type: asset_type_data(asset.asset_type),
      account: account_data(asset.account),
      security_asset: security_data(asset.security_asset),
      insurance_asset: insurance_data(asset.insurance_asset),
      loan_asset: loan_data(asset.loan_asset),
      real_estate_asset: real_estate_data(asset.real_estate_asset),
      snapshots: snapshots_data(asset.snapshots),
      inserted_at: asset.inserted_at,
      updated_at: asset.updated_at
    }
  end

  defp asset_type_data(%Ecto.Association.NotLoaded{}), do: nil
  defp asset_type_data(nil), do: nil
  defp asset_type_data(type), do: %{id: type.id, code: type.code, description: type.description}

  defp account_data(%Ecto.Association.NotLoaded{}), do: nil
  defp account_data(nil), do: nil
  defp account_data(account), do: %{id: account.id, name: account.name, type: account.type}

  defp security_data(%Ecto.Association.NotLoaded{}), do: nil
  defp security_data(nil), do: nil
  defp security_data(s), do: %{isin: s.isin, wkn: s.wkn, ticker: s.ticker, exchange: s.exchange, sector: s.sector}

  defp insurance_data(%Ecto.Association.NotLoaded{}), do: nil
  defp insurance_data(nil), do: nil
  defp insurance_data(i), do: %{
    insurer_name: i.insurer_name,
    policy_number: i.policy_number,
    insurance_type: i.insurance_type,
    coverage_amount: decimal_to_string(i.coverage_amount),
    deductible: decimal_to_string(i.deductible),
    payment_frequency: i.payment_frequency
  }

  defp loan_data(%Ecto.Association.NotLoaded{}), do: nil
  defp loan_data(nil), do: nil
  defp loan_data(l), do: %{
    interest_rate: decimal_to_string(l.interest_rate),
    payment_frequency: l.payment_frequency,
    maturity_date: l.maturity_date
  }

  defp real_estate_data(%Ecto.Association.NotLoaded{}), do: nil
  defp real_estate_data(nil), do: nil
  defp real_estate_data(r), do: %{
    address: r.address,
    size_m2: decimal_to_string(r.size_m2),
    purchase_price: decimal_to_string(r.purchase_price),
    purchase_date: r.purchase_date
  }

  defp snapshots_data(%Ecto.Association.NotLoaded{}), do: []
  defp snapshots_data(snapshots) when is_list(snapshots) do
    Enum.map(snapshots, &snapshot_data/1)
  end
  defp snapshots_data(_), do: []

  defp snapshot_data(snapshot) do
    %{
      id: snapshot.id,
      snapshot_date: snapshot.snapshot_date,
      value: snapshot.value,
      quantity: decimal_to_string(snapshot.quantity),
      unit_price: decimal_to_string(snapshot.unit_price),
      notes: snapshot.notes,
      asset_id: snapshot.asset_id
    }
  end

  defp decimal_to_string(nil), do: nil
  defp decimal_to_string(decimal), do: to_string(decimal)
end
