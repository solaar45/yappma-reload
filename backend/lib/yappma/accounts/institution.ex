defmodule Yappma.Accounts.Institution do
  use Ecto.Schema
  import Ecto.Changeset

  schema "institutions" do
    field :name, :string
    field :bic, :string
    field :country, :string

    has_many :accounts, Yappma.Accounts.Account

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(institution, attrs) do
    institution
    |> cast(attrs, [:name, :bic, :country])
    |> validate_required([:name])
    |> validate_length(:name, min: 1, max: 255)
  end
end
