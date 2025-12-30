defmodule WealthBackend.Accounts.Institution do
  use Ecto.Schema
  import Ecto.Changeset

  schema "institutions" do
    field :name, :string
    field :type, Ecto.Enum, values: [:bank, :broker, :insurance, :other]
    field :country, :string

    belongs_to :user, WealthBackend.Accounts.User
    has_many :accounts, WealthBackend.Accounts.Account

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(institution, attrs) do
    institution
    |> cast(attrs, [:name, :type, :country, :user_id])
    |> validate_required([:name, :type, :user_id])
  end
end
