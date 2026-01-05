defmodule WealthBackendWeb.TaxExemptionJSON do
  alias WealthBackend.Taxes.TaxExemption
  alias WealthBackendWeb.InstitutionJSON

  def index(%{tax_exemptions: tax_exemptions}) do
    %{data: for(te <- tax_exemptions, do: data(te))}
  end

  def show(%{tax_exemption: tax_exemption}) do
    %{data: data(tax_exemption)}
  end

  def data(%TaxExemption{} = te) do
    %{
      id: te.id,
      amount: te.amount,
      year: te.year,
      user_id: te.user_id,
      institution_id: te.institution_id,
      institution: render_institution(te.institution),
      inserted_at: te.inserted_at,
      updated_at: te.updated_at
    }
  end

  defp render_institution(%Ecto.Association.NotLoaded{}), do: nil
  defp render_institution(nil), do: nil
  defp render_institution(institution), do: InstitutionJSON.data(institution)
end
