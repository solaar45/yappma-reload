defmodule WealthBackendWeb.ImportController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Import
  action_fallback WealthBackendWeb.FallbackController

  def create(conn, %{"file" => upload}) do
    user = conn.assigns.current_user
    
    # Read file content
    csv_content = File.read!(upload.path)

    case Import.import_csv(user.id, csv_content) do
      {:ok, result} ->
        conn
        |> put_status(:created)
        |> json(%{data: result})

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: to_string(reason)})
    end
  end
end
