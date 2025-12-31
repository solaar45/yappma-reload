defmodule WealthBackend.Portfolio.RealEstateAsset do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:asset_id, :id, autogenerate: false}
  schema "real_estate_assets" do
    field :address, :string
    field :size_m2, :decimal
    field :purchase_price, :decimal
    field :purchase_date, :date

    belongs_to :asset, WealthBackend.Portfolio.Asset, define_field: false

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(real_estate_asset, attrs) do
    real_estate_asset
    |> cast(attrs, [:asset_id, :address, :size_m2, :purchase_price, :purchase_date])
    |> validate_required([:asset_id])
    |> empty_string_to_nil([:address])
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
