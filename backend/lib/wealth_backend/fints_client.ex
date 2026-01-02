defmodule WealthBackend.FintsClient do
  @moduledoc """
  HTTP Client for communicating with Python FinTS Worker.
  Handles all FinTS protocol communication.
  """

  use Tesla

  plug Tesla.Middleware.BaseUrl, get_base_url()
  plug Tesla.Middleware.JSON
  plug Tesla.Middleware.Timeout, timeout: 30_000

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
    case post("/api/fints/fetch-accounts", %{
           blz: blz,
           user_id: user_id,
           pin: pin,
           fints_url: fints_url
         }) do
      {:ok, %{status: 200, body: %{"accounts" => accounts}}} ->
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
    case post("/api/fints/fetch-balances", %{
           blz: blz,
           user_id: user_id,
           pin: pin,
           fints_url: fints_url
         }) do
      {:ok, %{status: 200, body: %{"balances" => balances}}} ->
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
    Application.get_env(:wealth_backend, :fints_worker_url, "http://localhost:5000")
  end
end
