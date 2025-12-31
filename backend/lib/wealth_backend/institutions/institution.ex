defmodule WealthBackend.Institutions.Institution do
  use Ecto.Schema
  import Ecto.Changeset

  schema "institutions" do
    field :name, :string
    field :type, :string
    field :country, :string
    field :user_id, :integer

    # Associations
    belongs_to :user, WealthBackend.Accounts.User, define_field: false
    has_many :accounts, WealthBackend.Portfolio.Account

    timestamps()
  end

  @doc false
  def changeset(institution, attrs) do
    institution
    |> cast(attrs, [:name, :type, :country, :user_id])
    |> validate_required([:name, :type, :user_id])
    |> validate_length(:name, min: 1, max: 255)
    |> validate_length(:type, min: 1, max: 255)
    |> validate_length(:country, max: 255)
  end
end
