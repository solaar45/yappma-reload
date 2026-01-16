defmodule WealthBackendWeb.ImportController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Import
  action_fallback WealthBackendWeb.FallbackController

  def create(conn, %{"file" => upload} = params) do
    user = conn.assigns.current_user
    
    # Read file content
    csv_content = File.read!(upload.path)
    
    # Get optional target account ID
    target_account_id = params["account_id"]

    case Import.import_csv(user.id, csv_content, target_account_id: target_account_id) do
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
