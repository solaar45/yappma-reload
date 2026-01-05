defmodule WealthBackend.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field :name, :string
    field :email, :string
    field :tax_allowance_limit, :integer, default: 1000
    field :tax_status, :string, default: "single"

    has_many :institutions, WealthBackend.Accounts.Institution
    has_many :accounts, WealthBackend.Accounts.Account
    has_many :tax_exemptions, WealthBackend.Taxes.TaxExemption

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :email, :tax_allowance_limit, :tax_status])
    |> validate_required([:name, :email])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/, message: "must be a valid email")
    |> validate_inclusion(:tax_status, ~w(single married))
    |> validate_number(:tax_allowance_limit, greater_than_or_equal_to: 0)
    |> unique_constraint(:email)
  end
end
