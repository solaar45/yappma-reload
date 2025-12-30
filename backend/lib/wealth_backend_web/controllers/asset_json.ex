defmodule WealthBackendWeb.AssetJSON do
  alias WealthBackend.Portfolio.Asset

  def index(%{assets: assets}) do
    %{data: for(asset <- assets, do: data(asset))}
  end

  def show(%{asset: asset}) do
    %{data: data(asset)}
  end

  defp data(%Asset{} = asset) do
    %{
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
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
    coverage_amount: i.coverage_amount,
    deductible: i.deductible,
    payment_frequency: i.payment_frequency
  }

  defp loan_data(%Ecto.Association.NotLoaded{}), do: nil
  defp loan_data(nil), do: nil
  defp loan_data(l), do: %{interest_rate: l.interest_rate, payment_frequency: l.payment_frequency, maturity_date: l.maturity_date}

  defp real_estate_data(%Ecto.Association.NotLoaded{}), do: nil
  defp real_estate_data(nil), do: nil
  defp real_estate_data(r), do: %{address: r.address, size_m2: r.size_m2, purchase_price: r.purchase_price, purchase_date: r.purchase_date}
end
