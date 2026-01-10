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
      risk_class: asset.risk_class,
      risk_class_source: asset.risk_class_source,
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
  defp account_data(account) do
    %{
      id: account.id,
      name: account.name,
      type: account.type,
      institution: institution_data(account.institution)
    }
  end

  defp institution_data(%Ecto.Association.NotLoaded{}), do: nil
  defp institution_data(nil), do: nil
  defp institution_data(institution) do
    %{
      id: institution.id,
      name: institution.name,
      type: institution.type,
      country: institution.country,
      website: institution.website
    }
  end

  defp security_data(%Ecto.Association.NotLoaded{}), do: nil
  defp security_data(nil), do: nil
  defp security_data(s) do
    %{
      isin: s.isin,
      wkn: s.wkn,
      ticker: s.ticker,
      exchange: s.exchange,
      sector: s.sector,
      # Extended fields
      security_type: s.security_type,
      distribution_type: s.distribution_type,
      expense_ratio: decimal_to_string(s.expense_ratio),
      issuer: s.issuer,
      coupon_rate: decimal_to_string(s.coupon_rate),
      maturity_date: s.maturity_date,
      country_of_domicile: s.country_of_domicile,
      benchmark_index: s.benchmark_index
    }
  end

  defp insurance_data(%Ecto.Association.NotLoaded{}), do: nil
  defp insurance_data(nil), do: nil
  defp insurance_data(i) do
    %{
      insurer_name: i.insurer_name,
      policy_number: i.policy_number,
      insurance_type: i.insurance_type,
      coverage_amount: decimal_to_string(i.coverage_amount),
      deductible: decimal_to_string(i.deductible),
      payment_frequency: i.payment_frequency,
      # Extended fields
      policy_start_date: i.policy_start_date,
      policy_end_date: i.policy_end_date,
      premium_amount: decimal_to_string(i.premium_amount)
    }
  end

  defp loan_data(%Ecto.Association.NotLoaded{}), do: nil
  defp loan_data(nil), do: nil
  defp loan_data(l) do
    %{
      interest_rate: decimal_to_string(l.interest_rate),
      payment_frequency: l.payment_frequency,
      maturity_date: l.maturity_date
    }
  end

  defp real_estate_data(%Ecto.Association.NotLoaded{}), do: nil
  defp real_estate_data(nil), do: nil
  defp real_estate_data(r) do
    %{
      address: r.address,
      size_m2: decimal_to_string(r.size_m2),
      purchase_price: decimal_to_string(r.purchase_price),
      purchase_date: r.purchase_date,
      # Extended fields
      property_type: r.property_type,
      usage: r.usage,
      rental_income: decimal_to_string(r.rental_income),
      operating_expenses: decimal_to_string(r.operating_expenses),
      property_tax: decimal_to_string(r.property_tax),
      mortgage_outstanding: decimal_to_string(r.mortgage_outstanding),
      mortgage_rate: decimal_to_string(r.mortgage_rate),
      construction_year: r.construction_year,
      renovation_year: r.renovation_year,
      cadastral_number: r.cadastral_number
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
      value: decimal_to_string(snapshot.value),
      quantity: decimal_to_string(snapshot.quantity),
      market_price_per_unit: decimal_to_string(snapshot.market_price_per_unit),
      note: snapshot.note,
      asset_id: snapshot.asset_id
    }
  end

  defp decimal_to_string(nil), do: nil
  defp decimal_to_string(%Decimal{} = decimal), do: Decimal.to_string(decimal)
  defp decimal_to_string(value) when is_number(value), do: to_string(value)
  defp decimal_to_string(value), do: value
end
