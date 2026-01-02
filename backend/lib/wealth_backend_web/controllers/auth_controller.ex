defmodule WealthBackendWeb.AuthController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Accounts
  alias WealthBackend.Token

  action_fallback WealthBackendWeb.FallbackController

  @doc """
  Register a new user.
  POST /api/auth/register
  
  Body:
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "password_confirmation": "securepassword123",
    "currency_default": "EUR"
  }
  """
  def register(conn, %{"user" => user_params}) do
    case Accounts.register_user(user_params) do
      {:ok, user} ->
        {:ok, token} = Token.generate_token(user.id)

        conn
        |> put_status(:created)
        |> render(:token, token: token, user: user)

      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> put_view(json: WealthBackendWeb.ChangesetJSON)
        |> render(:error, changeset: changeset)
    end
  end

  # Support direct params without "user" wrapper
  def register(conn, params) when is_map(params) do
    register(conn, %{"user" => params})
  end

  @doc """
  Authenticate user and return JWT token.
  POST /api/auth/login
  
  Body:
  {
    "email": "john@example.com",
    "password": "securepassword123"
  }
  """
  def login(conn, %{"email" => email, "password" => password}) do
    case Accounts.authenticate_user(email, password) do
      {:ok, user} ->
        {:ok, token} = Token.generate_token(user.id)
        render(conn, :token, token: token, user: user)

      {:error, :unauthorized} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid email or password"})
    end
  end

  def login(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "Email and password are required"})
  end
end
