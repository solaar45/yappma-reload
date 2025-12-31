defmodule WealthBackendWeb.InstitutionController do
  use WealthBackendWeb, :controller

  # TODO: Institutions context doesn't exist yet!
  # Need to create:
  # - lib/wealth_backend/institutions.ex (context)
  # - lib/wealth_backend/institutions/institution.ex (schema)
  # - priv/repo/migrations/*_create_institutions.exs (migration)
  #
  # For now, return empty list to prevent frontend errors

  action_fallback WealthBackendWeb.FallbackController

  def index(conn, _params) do
    # Return empty list for now
    render(conn, :index, institutions: [])
  end

  def create(conn, %{"institution" => _institution_params}) do
    conn
    |> put_status(:not_implemented)
    |> json(%{
      error: "Institutions feature not yet implemented",
      message: "Please check back later or create the Institutions context"
    })
  end

  def show(conn, %{"id" => _id}) do
    conn
    |> put_status(:not_found)
    |> json(%{error: "Institution not found"})
  end

  def update(conn, %{"id" => _id, "institution" => _institution_params}) do
    conn
    |> put_status(:not_implemented)
    |> json(%{error: "Institutions feature not yet implemented"})
  end

  def delete(conn, %{"id" => _id}) do
    conn
    |> put_status(:not_implemented)
    |> json(%{error: "Institutions feature not yet implemented"})
  end
end
