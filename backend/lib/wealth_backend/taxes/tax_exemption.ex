defmodule WealthBackend.Taxes.TaxExemption do
  use Ecto.Schema
  import Ecto.Changeset

  schema "tax_exemptions" do
    field :amount, :decimal
    field :year, :integer

    belongs_to :user, WealthBackend.Accounts.User
    belongs_to :institution, WealthBackend.Institutions.Institution

    timestamps()
  end

  @doc false
  def changeset(tax_exemption, attrs) do
    tax_exemption
    |> cast(attrs, [:amount, :year, :user_id, :institution_id])
    |> validate_required([:amount, :year, :user_id, :institution_id])
    |> validate_number(:amount, greater_than_or_equal_to: 0)
    |> validate_number(:year, greater_than: 2000)
    |> unique_constraint([:user_id, :institution_id, :year])
  end
end
