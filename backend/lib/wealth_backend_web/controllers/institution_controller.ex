defmodule WealthBackendWeb.InstitutionController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Accounts
  alias WealthBackend.Accounts.Institution

  action_fallback WealthBackendWeb.FallbackController

  def index(conn, %{"user_id" => user_id}) do
    institutions = Accounts.list_institutions(user_id)
    render(conn, :index, institutions: institutions)
  end

  def create(conn, %{"institution" => institution_params}) do
    with {:ok, %Institution{} = institution} <- Accounts.create_institution(institution_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/institutions/#{institution}")
      |> render(:show, institution: institution)
    end
  end

  def show(conn, %{"id" => id}) do
    institution = Accounts.get_institution!(id)
    render(conn, :show, institution: institution)
  end

  def update(conn, %{"id" => id, "institution" => institution_params}) do
    institution = Accounts.get_institution!(id)

    with {:ok, %Institution{} = institution} <- Accounts.update_institution(institution, institution_params) do
      render(conn, :show, institution: institution)
    end
  end

  def delete(conn, %{"id" => id}) do
    institution = Accounts.get_institution!(id)

    with {:ok, %Institution{}} <- Accounts.delete_institution(institution) do
      send_resp(conn, :no_content, "")
    end
  end
end
