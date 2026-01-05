defmodule WealthBackend.Institutions.Institution do
  use Ecto.Schema
  import Ecto.Changeset

  @categories ~w(bank neobank broker insurance crypto other)

  schema "institutions" do
    field :name, :string
    field :type, :string
    field :country, :string
    field :is_system_provided, :boolean, default: false
    field :category, :string
    field :bic, :string
    field :logo_url, :string
    field :website, :string
    field :user_id, :integer

    # Associations
    belongs_to :user, WealthBackend.Accounts.User, define_field: false
    has_many :accounts, WealthBackend.Accounts.Account

    timestamps()
  end

  @doc false
  def changeset(institution, attrs) do
    institution
    |> cast(attrs, [:name, :type, :country, :user_id, :is_system_provided, :category, :bic, :logo_url, :website])
    |> validate_required([:name, :type])
    |> validate_required_if_not_system([:user_id])
    |> validate_inclusion(:category, @categories)
    |> validate_length(:name, min: 1, max: 255)
    |> validate_length(:type, min: 1, max: 255)
    |> validate_length(:country, max: 255)
    |> unique_constraint(:name, name: :system_institutions_name_index)
  end

  defp validate_required_if_not_system(changeset, fields) do
    if get_field(changeset, :is_system_provided) do
      changeset
    else
      validate_required(changeset, fields)
    end
  end
end
