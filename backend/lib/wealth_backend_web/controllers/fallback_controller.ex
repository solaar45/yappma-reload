defmodule WealthBackendWeb.FallbackController do
  use WealthBackendWeb, :controller

  # This clause handles errors returned by Ecto's insert/update/delete.
  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: WealthBackendWeb.ChangesetJSON)
    |> render(:error, changeset: changeset)
  end

  # Handle security validation errors
  def call(conn, {:error, :security_not_found}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: WealthBackendWeb.ErrorJSON)
    |> json(%{
      errors: %{
        detail: "security_not_found",
        message: "The security identifier (ticker or ISIN) could not be found in the FMP database."
      }
    })
  end

  def call(conn, {:error, :validation_failed}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: WealthBackendWeb.ErrorJSON)
    |> json(%{
      errors: %{
        detail: "validation_failed",
        message: "Security validation failed. Please try again later."
      }
    })
  end

  # This clause is an example of how to handle resources that cannot be found.
  def call(conn, {:error, :not_found}) do
    conn
    |> put_status(:not_found)
    |> put_view(json: WealthBackendWeb.ErrorJSON)
    |> render(:"404")
  end
end
