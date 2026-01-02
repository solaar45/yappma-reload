defmodule WealthBackend.Token do
  @moduledoc """
  JWT token generation and verification using Joken.
  """
  use Joken.Config

  @impl true
  def token_config do
    default_claims(default_exp: 60 * 60 * 24 * 7) # 7 days
  end

  @doc """
  Generates a JWT token for a user.
  """
  def generate_token(user_id) when is_integer(user_id) do
    extra_claims = %{"user_id" => user_id}
    generate_and_sign(extra_claims, get_signer())
  end

  @doc """
  Verifies a JWT token and returns the claims.
  """
  def verify_token(token) when is_binary(token) do
    verify_and_validate(token, get_signer())
  end

  @doc """
  Extracts user_id from verified token claims.
  """
  def get_user_id(claims) when is_map(claims) do
    Map.get(claims, "user_id")
  end

  # Get JWT signer from config
  defp get_signer do
    secret = Application.get_env(:wealth_backend, :jwt_secret)
    Joken.Signer.create("HS256", secret)
  end
end
