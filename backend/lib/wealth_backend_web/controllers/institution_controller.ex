defmodule WealthBackendWeb.InstitutionController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Institutions
  alias WealthBackend.Institutions.Institution

  action_fallback WealthBackendWeb.FallbackController

  @doc """
  List all institutions for the current user.
  """
  def index(conn, _params) do
    user = conn.assigns.current_user
    institutions = Institutions.list_available_institutions(user.id)
    render(conn, :index, institutions: institutions)
  end

  @doc """
  Create a new institution.
  """
  def create(conn, %{"institution" => institution_params}) do
    user = conn.assigns.current_user
    institution_params = Map.put(institution_params, "user_id", user.id)

    case Institutions.create_institution(institution_params) do
      {:ok, institution} ->
        conn
        |> put_status(:created)
        |> put_resp_header("location", ~p"/api/institutions/#{institution}")
        |> render(:show, institution: institution)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> put_view(json: WealthBackendWeb.ErrorJSON)
        |> render(:error, changeset: changeset)
    end
  end

  @doc """
  Get a single institution by ID.
  """
  def show(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    case Institutions.get_institution_by_user(id, user.id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> put_view(json: WealthBackendWeb.ErrorJSON)
        |> render(:"404.json")

      institution ->
        render(conn, :show, institution: institution)
    end
  end

  @doc """
  Update an existing institution.
  """
  def update(conn, %{"id" => id, "institution" => institution_params}) do
    user = conn.assigns.current_user

    case Institutions.get_institution_by_user(id, user.id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> put_view(json: WealthBackendWeb.ErrorJSON)
        |> render(:"404.json")

      institution ->
        case Institutions.update_institution(institution, institution_params) do
          {:ok, institution} ->
            render(conn, :show, institution: institution)

          {:error, changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> put_view(json: WealthBackendWeb.ErrorJSON)
            |> render(:error, changeset: changeset)
        end
    end
  end

  @doc """
  Delete an institution.
  """
  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    case Institutions.get_institution_by_user(id, user.id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> put_view(json: WealthBackendWeb.ErrorJSON)
        |> render(:"404.json")

      institution ->
        with {:ok, %Institution{}} <- Institutions.delete_institution(institution) do
          send_resp(conn, :no_content, "")
        end
    end
  end
end
