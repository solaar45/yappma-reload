defmodule WealthBackend.Taxes do
  import Ecto.Query, warn: false
  alias WealthBackend.Repo
  alias WealthBackend.Taxes.TaxExemption

  def list_user_tax_exemptions(user_id, year) do
    TaxExemption
    |> where([te], te.user_id == ^user_id and te.year == ^year)
    |> preload(:institution)
    |> Repo.all()
  end

  def get_tax_exemption!(id), do: Repo.get!(TaxExemption, id)

  def create_tax_exemption(attrs \\ %{}) do
    %TaxExemption{}
    |> TaxExemption.changeset(attrs)
    |> Repo.insert()
  end

  def update_tax_exemption(%TaxExemption{} = tax_exemption, attrs) do
    tax_exemption
    |> TaxExemption.changeset(attrs)
    |> Repo.update()
  end

  def delete_tax_exemption(%TaxExemption{} = tax_exemption) do
    Repo.delete(tax_exemption)
  end

  def change_tax_exemption(%TaxExemption{} = tax_exemption, attrs \\ %{}) do
    TaxExemption.changeset(tax_exemption, attrs)
  end

  def get_total_exemption_amount(user_id, year) do
    TaxExemption
    |> where([te], te.user_id == ^user_id and te.year == ^year)
    |> select([te], sum(te.amount))
    |> Repo.one() || Decimal.new(0)
  end
end
