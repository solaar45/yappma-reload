defmodule WealthBackendWeb.InstitutionJSON do
  alias WealthBackend.Accounts.Institution

  def index(%{institutions: institutions}) do
    %{data: for(institution <- institutions, do: data(institution))}
  end

  def show(%{institution: institution}) do
    %{data: data(institution)}
  end

  defp data(%Institution{} = institution) do
    %{
      id: institution.id,
      name: institution.name,
      type: institution.type,
      country: institution.country,
      user_id: institution.user_id,
      inserted_at: institution.inserted_at,
      updated_at: institution.updated_at
    }
  end
end
