defmodule Yappma.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field :name, :string
    field :email, :string
    field :currency_default, :string, default: "EUR"

    has_many :institutions, Yappma.Accounts.Institution
    has_many :accounts, Yappma.Accounts.Account
    has_many :bank_consents, Yappma.Accounts.BankConsent

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :email, :currency_default])
    |> validate_required([:name, :email])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/, message: "must be a valid email")
    |> unique_constraint(:email)
  end
end
