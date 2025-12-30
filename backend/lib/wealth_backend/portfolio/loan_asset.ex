defmodule WealthBackend.Portfolio.LoanAsset do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:asset_id, :id, autogenerate: false}
  schema "loan_assets" do
    field :interest_rate, :decimal
    field :payment_frequency, :string
    field :maturity_date, :date

    belongs_to :asset, WealthBackend.Portfolio.Asset, define_field: false

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(loan_asset, attrs) do
    loan_asset
    |> cast(attrs, [:asset_id, :interest_rate, :payment_frequency, :maturity_date])
    |> validate_required([:asset_id])
  end
end
