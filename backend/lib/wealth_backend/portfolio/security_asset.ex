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

    belongs_to :asset, WealthBackend.Portfolio.Asset, define_field: false

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(security_asset, attrs) do
    security_asset
    |> cast(attrs, [:asset_id, :isin, :wkn, :ticker, :exchange, :sector])
    |> validate_required([:asset_id])
  end
end
