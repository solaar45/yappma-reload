defmodule WealthBackend.Analytics.AssetSnapshot do
  use Ecto.Schema
  import Ecto.Changeset

  schema "asset_snapshots" do
    field :snapshot_date, :date
    field :quantity, :decimal
    field :market_price_per_unit, :decimal
    field :value, :decimal
    field :note, :string

    belongs_to :user, WealthBackend.Accounts.User
    belongs_to :asset, WealthBackend.Portfolio.Asset

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(asset_snapshot, attrs) do
    asset_snapshot
    |> cast(attrs, [:snapshot_date, :quantity, :market_price_per_unit, :value, :note, :asset_id, :user_id])
    |> validate_required([:snapshot_date, :value, :asset_id, :user_id])
    |> foreign_key_constraint(:asset_id)
    |> foreign_key_constraint(:user_id)
    |> unique_constraint(:snapshot_date, name: :asset_snapshots_asset_id_snapshot_date_index)
  end
end
