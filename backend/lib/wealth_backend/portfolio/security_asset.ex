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
    |> empty_string_to_nil([:isin, :wkn, :ticker, :exchange, :sector])
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
