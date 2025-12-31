defmodule WealthBackendWeb.InstitutionController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Institutions
  alias WealthBackend.Institutions.Institution

  action_fallback WealthBackendWeb.FallbackController

  # TODO: Get user_id from authenticated session/JWT token
  @default_user_id 1

  def index(conn, params) do
    user_id = Map.get(params, "user_id", @default_user_id)
    institutions = Institutions.list_institutions(user_id)
    render(conn, :index, institutions: institutions)
  end

  def create(conn, %{"institution" => institution_params} = params) do
    # Add default user_id if not provided
    institution_params = Map.put_new(institution_params, "user_id", Map.get(params, "user_id", @default_user_id))
    
    with {:ok, %Institution{} = institution} <- Institutions.create_institution(institution_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/institutions/#{institution}")
      |> render(:show, institution: institution)
    end
  end

  def show(conn, %{"id" => id}) do
    institution = Institutions.get_institution!(id)
    render(conn, :show, institution: institution)
  end

  def update(conn, %{"id" => id, "institution" => institution_params}) do
    institution = Institutions.get_institution!(id)

    with {:ok, %Institution{} = institution} <- Institutions.update_institution(institution, institution_params) do
      render(conn, :show, institution: institution)
    end
  end

  def delete(conn, %{"id" => id}) do
    institution = Institutions.get_institution!(id)

    with {:ok, %Institution{}} <- Institutions.delete_institution(institution) do
      send_resp(conn, :no_content, "")
    end
  end
end
