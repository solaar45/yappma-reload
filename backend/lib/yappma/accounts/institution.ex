defmodule Yappma.Accounts.Institution do
  use Ecto.Schema
  import Ecto.Changeset

  schema "institutions" do
    field :name, :string
    field :type, Ecto.Enum, values: [:bank, :broker, :insurance, :other]
    field :country, :string
    
    # From Yappma version
    field :bic, :string

    belongs_to :user, Yappma.Accounts.User
    has_many :accounts, Yappma.Accounts.Account

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(institution, attrs) do
    institution
    |> cast(attrs, [:name, :type, :country, :bic, :user_id])
    |> validate_required([:name, :type, :user_id])
  end
end
