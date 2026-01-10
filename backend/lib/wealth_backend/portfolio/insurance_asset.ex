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
    
    # Extended fields
    field :policy_start_date, :date
    field :policy_end_date, :date
    field :premium_amount, :decimal

    belongs_to :asset, WealthBackend.Portfolio.Asset, define_field: false

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(insurance_asset, attrs) do
    insurance_asset
    |> cast(attrs, [
      :asset_id,
      :insurer_name,
      :policy_number,
      :insurance_type,
      :coverage_amount,
      :deductible,
      :payment_frequency,
      :policy_start_date,
      :policy_end_date,
      :premium_amount
    ])
    |> validate_required([:asset_id])
    |> empty_string_to_nil([
      :insurer_name,
      :policy_number,
      :insurance_type,
      :payment_frequency
    ])
    |> validate_date_logic()
    |> validate_number(:premium_amount, greater_than_or_equal_to: 0)
    |> validate_number(:coverage_amount, greater_than_or_equal_to: 0)
    |> validate_number(:deductible, greater_than_or_equal_to: 0)
  end

  # Validate that policy_end_date is after policy_start_date
  defp validate_date_logic(changeset) do
    start_date = get_field(changeset, :policy_start_date)
    end_date = get_field(changeset, :policy_end_date)

    if start_date && end_date && Date.compare(end_date, start_date) == :lt do
      add_error(changeset, :policy_end_date, "must be after policy start date")
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
