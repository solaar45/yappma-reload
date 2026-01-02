defmodule WealthBackend.FintsClient do
  @moduledoc """
  HTTP Client for communicating with Python FinTS Worker.
  Handles all FinTS protocol communication.
  """

  use Tesla

  plug Tesla.Middleware.BaseUrl, get_base_url()
  plug Tesla.Middleware.JSON
  plug Tesla.Middleware.Headers, get_headers()
  plug Tesla.Middleware.Timeout, timeout: get_timeout()

  @doc """
  Tests connection to bank.
  """
  def test_connection(blz, user_id, pin, fints_url) do
    case post("/api/fints/test-connection", %{
           blz: blz,
           user_id: user_id,
           pin: pin,
           fints_url: fints_url
         }) do
      {:ok, %{status: 200, body: body}} ->
        {:ok, body}

      {:ok, %{status: status, body: body}} ->
        {:error, "HTTP #{status}: #{inspect(body)}"}

      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Fetches list of accounts from bank.
  """
  def fetch_accounts(blz, user_id, pin, fints_url) do
    case post("/api/fints/accounts", %{
           blz: blz,
           user_id: user_id,
           pin: pin,
           fints_url: fints_url
         }) do
      {:ok, %{status: 200, body: %{"success" => true, "accounts" => accounts}}} ->
        {:ok, accounts}

      {:ok, %{status: status, body: body}} ->
        {:error, "HTTP #{status}: #{inspect(body)}"}

      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Fetches current balances for all accounts.
  """
  def fetch_balances(blz, user_id, pin, fints_url) do
    case post("/api/fints/balances", %{
           blz: blz,
           user_id: user_id,
           pin: pin,
           fints_url: fints_url
         }) do
      {:ok, %{status: 200, body: %{"success" => true, "balances" => balances}}} ->
        parsed_balances =
          Enum.map(balances, fn balance ->
            %{
              iban: balance["iban"],
              balance: balance["balance"],
              currency: balance["currency"],
              date: parse_date(balance["date"])
            }
          end)

        {:ok, parsed_balances}

      {:ok, %{status: status, body: body}} ->
        {:error, "HTTP #{status}: #{inspect(body)}"}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp parse_date(date_string) when is_binary(date_string) do
    case Date.from_iso8601(date_string) do
      {:ok, date} -> date
      {:error, _} -> Date.utc_today()
    end
  end

  defp parse_date(_), do: Date.utc_today()

  defp get_base_url do
    config = Application.get_env(:wealth_backend, :fints_worker, [])
    Keyword.get(config, :base_url, "http://localhost:5000")
  end

  defp get_headers do
    config = Application.get_env(:wealth_backend, :fints_worker, [])
    api_key = Keyword.get(config, :api_key, "dev-test-key-12345")
    [{"X-API-Key", api_key}]
  end

  defp get_timeout do
    config = Application.get_env(:wealth_backend, :fints_worker, [])
    Keyword.get(config, :timeout, 30_000)
  end
end
