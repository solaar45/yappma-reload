defmodule WealthBackendWeb.InstitutionJSON do
  alias WealthBackend.Institutions.Institution

  @doc """
  Renders a list of institutions.
  """
  def index(%{institutions: institutions}) do
    %{data: for(institution <- institutions, do: data(institution))}
  end

  @doc """
  Renders a single institution.
  """
  def show(%{institution: institution}) do
    %{data: data(institution)}
  end

  def data(%Institution{} = institution) do
    %{
      id: institution.id,
      name: institution.name,
      type: institution.type,
      country: institution.country,
      category: institution.category,
      logo_url: institution.logo_url,
      website: institution.website,
      is_system_provided: institution.is_system_provided,
      user_id: institution.user_id,
      inserted_at: institution.inserted_at,
      updated_at: institution.updated_at
    }
  end
end
