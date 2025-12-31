defmodule WealthBackend.Portfolio.InsuranceAsset do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:asset_id, :id, autogenerate: false}
  schema "insurance_assets" do
    field :insurer_name, :string
    field :policy_number, :string
    field :insurance_type, :string
    field :coverage_amount, :decimal
    field :deductible, :decimal
    field :payment_frequency, :string

    belongs_to :asset, WealthBackend.Portfolio.Asset, define_field: false

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(insurance_asset, attrs) do
    insurance_asset
    |> cast(attrs, [:asset_id, :insurer_name, :policy_number, :insurance_type, :coverage_amount, :deductible, :payment_frequency])
    |> validate_required([:asset_id])
    |> empty_string_to_nil([:insurer_name, :policy_number, :insurance_type, :payment_frequency])
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
