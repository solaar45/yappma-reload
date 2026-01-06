defmodule WealthBackendWeb.UserSettingsController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Accounts
  alias WealthBackendWeb.UserAuth

  def update_password(conn, %{"current_password" => password, "user" => user_params}) do
    user = conn.assigns.current_user

    case Accounts.update_user_password(user, password, user_params) do
      {:ok, user} ->
        conn
        |> UserAuth.log_in_user(user)
        |> json(%{message: "Password updated successfully"})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> put_view(json: WealthBackendWeb.ChangesetJSON)
        |> render("error.json", changeset: changeset)
    end
  end
end
