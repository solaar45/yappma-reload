defmodule WealthBackend.Portfolio.AssetType do
  use Ecto.Schema
  import Ecto.Changeset

  schema "asset_types" do
    field :code, :string
    field :description, :string

    has_many :assets, WealthBackend.Portfolio.Asset

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(asset_type, attrs) do
    asset_type
    |> cast(attrs, [:code, :description])
    |> validate_required([:code])
    |> unique_constraint(:code)
  end
end
