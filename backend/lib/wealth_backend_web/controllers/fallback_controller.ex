defmodule WealthBackendWeb.FallbackController do
  use WealthBackendWeb, :controller

  # This clause handles errors returned by Ecto's insert/update/delete.
  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: WealthBackendWeb.ChangesetJSON)
    |> render(:error, changeset: changeset)
  end

  # This clause handles Ecto.NoResultsError (e.g., when using Repo.get!)
  def call(conn, {:error, %Ecto.NoResultsError{}}) do
    conn
    |> put_status(:not_found)
    |> put_view(json: WealthBackendWeb.ErrorJSON)
    |> render(:"404")
  end

  # This clause is an example of how to handle resources that cannot be found.
  def call(conn, {:error, :not_found}) do
    conn
    |> put_status(:not_found)
    |> put_view(json: WealthBackendWeb.ErrorJSON)
    |> render(:"404")
  end
end
