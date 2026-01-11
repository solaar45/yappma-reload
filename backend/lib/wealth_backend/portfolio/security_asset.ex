defmodule WealthBackend.Portfolio.SecurityAsset do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:asset_id, :id, autogenerate: false}
  schema "security_assets" do
    field :isin, :string
    field :wkn, :string
    field :ticker, :string
    field :exchange, :string
    field :sector, :string
    
    # Extended fields
    field :security_type, :string
    field :distribution_type, :string
    field :expense_ratio, :decimal
    field :issuer, :string
    field :coupon_rate, :decimal
    field :maturity_date, :date
    field :country_of_domicile, :string
    field :benchmark_index, :string

    belongs_to :asset, WealthBackend.Portfolio.Asset, define_field: false

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(security_asset, attrs) do
    security_asset
    |> cast(attrs, [
      :asset_id,
      :isin,
      :wkn,
      :ticker,
      :exchange,
      :sector,
      :security_type,
      :distribution_type,
      :expense_ratio,
      :issuer,
      :coupon_rate,
      :maturity_date,
      :country_of_domicile,
      :benchmark_index
    ])
    |> empty_string_to_nil([
      :isin,
      :wkn,
      :ticker,
      :exchange,
      :sector,
      :security_type,
      :distribution_type,
      :issuer,
      :country_of_domicile,
      :benchmark_index
    ])
    # Removed validate_inclusion for security_type to allow any value from FMP API
    |> validate_inclusion(:distribution_type, [
      "accumulating",
      "distributing",
      nil
    ])
    |> validate_number(:expense_ratio, greater_than_or_equal_to: 0, less_than_or_equal_to: 100)
    |> validate_number(:coupon_rate, greater_than_or_equal_to: 0)
  end

  # Convert empty strings to nil for optional fields
  defp empty_string_to_nil(changeset, fields) do
    Enum.reduce(fields, changeset, fn field, acc ->
      case get_change(acc, field) do
        "" -> put_change(acc, field, nil)
        _ -> acc
      end
    end)
  end
end
