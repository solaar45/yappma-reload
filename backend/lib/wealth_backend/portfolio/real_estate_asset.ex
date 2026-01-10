defmodule WealthBackend.Portfolio.RealEstateAsset do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:asset_id, :id, autogenerate: false}
  schema "real_estate_assets" do
    field :address, :string
    field :size_m2, :decimal
    field :purchase_price, :decimal
    field :purchase_date, :date
    
    # Extended fields
    field :property_type, :string
    field :usage, :string
    field :rental_income, :decimal
    field :operating_expenses, :decimal
    field :property_tax, :decimal
    field :mortgage_outstanding, :decimal
    field :mortgage_rate, :decimal
    field :construction_year, :integer
    field :renovation_year, :integer
    field :cadastral_number, :string

    belongs_to :asset, WealthBackend.Portfolio.Asset, define_field: false

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(real_estate_asset, attrs) do
    real_estate_asset
    |> cast(attrs, [
      :asset_id,
      :address,
      :size_m2,
      :purchase_price,
      :purchase_date,
      :property_type,
      :usage,
      :rental_income,
      :operating_expenses,
      :property_tax,
      :mortgage_outstanding,
      :mortgage_rate,
      :construction_year,
      :renovation_year,
      :cadastral_number
    ])
    |> validate_required([:asset_id])
    |> empty_string_to_nil([
      :address,
      :property_type,
      :usage,
      :cadastral_number
    ])
    |> validate_inclusion(:property_type, [
      "residential",
      "commercial",
      "land",
      "mixed_use",
      nil
    ])
    |> validate_inclusion(:usage, [
      "owner_occupied",
      "rented_out",
      "vacant",
      "development",
      nil
    ])
    |> validate_number(:size_m2, greater_than: 0)
    |> validate_number(:purchase_price, greater_than_or_equal_to: 0)
    |> validate_number(:rental_income, greater_than_or_equal_to: 0)
    |> validate_number(:operating_expenses, greater_than_or_equal_to: 0)
    |> validate_number(:property_tax, greater_than_or_equal_to: 0)
    |> validate_number(:mortgage_outstanding, greater_than_or_equal_to: 0)
    |> validate_number(:mortgage_rate, greater_than_or_equal_to: 0)
    |> validate_number(:construction_year, greater_than: 1800, less_than_or_equal_to: 2100)
    |> validate_number(:renovation_year, greater_than: 1800, less_than_or_equal_to: 2100)
    |> validate_renovation_year()
  end

  # Validate that renovation_year is not before construction_year
  defp validate_renovation_year(changeset) do
    construction_year = get_field(changeset, :construction_year)
    renovation_year = get_field(changeset, :renovation_year)

    if construction_year && renovation_year && renovation_year < construction_year do
      add_error(changeset, :renovation_year, "cannot be before construction year")
    else
      changeset
    end
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
