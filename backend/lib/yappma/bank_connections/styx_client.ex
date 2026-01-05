defmodule Yappma.BankConnections.StyxClient do
  @moduledoc """
  HTTP client for Styx PSD2 middleware.
  
  Styx provides a unified API for accessing multiple banks via PSD2.
  """

  require Logger

  @base_url Application.compile_env(:yappma, :styx_base_url, "http://localhost:8093")

  # ASPSP (Bank) Management

  @doc """
  Lists all available ASPSPs (banks) configured in Styx.
  """
  def list_aspsps do
    get("/aspsps")
  end

  @doc """
  Gets details for a specific ASPSP by ID or BIC.
  """
  def get_aspsp(aspsp_id) do
    get("/aspsps/#{aspsp_id}")
  end

  # Consent Management

  @doc """
  Creates a new consent for accessing bank accounts.
  
  ## Parameters
  
    - aspsp_id: Bank identifier
    - redirect_url: URL to redirect user after authorization
    - opts: Additional options (access scope, validity, etc.)
  """
  def create_consent(aspsp_id, redirect_url, opts \\ []) do
    body = %{
      aspspId: aspsp_id,
      redirectUrl: redirect_url,
      access: Keyword.get(opts, :access, %{
        accounts: [],
        balances: [],
        transactions: []
      }),
      frequencyPerDay: Keyword.get(opts, :frequency_per_day, 4),
      recurringIndicator: Keyword.get(opts, :recurring, true),
      validUntil: Keyword.get(opts, :valid_until, default_valid_until())
    }

    post("/consents", body)
  end

  @doc """
  Completes a consent after user authorization.
  """
  def complete_consent(consent_id, authorization_code) do
    body = %{
      authorizationCode: authorization_code
    }

    post("/consents/#{consent_id}/complete", body)
  end

  @doc """
  Gets the current status of a consent.
  """
  def get_consent_status(consent_id) do
    get("/consents/#{consent_id}")
  end

  @doc """
  Revokes a consent.
  """
  def revoke_consent(consent_id) do
    delete("/consents/#{consent_id}")
  end

  # Account Information

  @doc """
  Lists all accounts accessible with a consent.
  """
  def get_accounts(consent_id) do
    case get("/consents/#{consent_id}/accounts") do
      {:ok, response} ->
        # Styx may return accounts directly or wrapped in a response object
        accounts = case response do
          %{"accounts" => accs} when is_list(accs) -> accs
          accs when is_list(accs) -> accs
          _ -> []
        end
        {:ok, accounts}
      
      error -> error
    end
  end

  @doc """
  Gets detailed information for a specific account.
  """
  def get_account_details(consent_id, account_id) do
    get("/consents/#{consent_id}/accounts/#{account_id}")
  end

  @doc """
  Gets the balance for an account.
  """
  def get_balance(consent_id, account_id) do
    get("/consents/#{consent_id}/accounts/#{account_id}/balances")
  end

  # Transaction Information

  @doc """
  Gets transactions for an account.
  
  ## Options
  
    - date_from: Start date (Date)
    - date_to: End date (Date)
    - booking_status: "booked", "pending", or "both"
  """
  def get_transactions(consent_id, account_id, opts \\ []) do
    query_params =
      opts
      |> Enum.map(fn
        {:date_from, %Date{} = date} -> {"dateFrom", Date.to_iso8601(date)}
        {:date_to, %Date{} = date} -> {"dateTo", Date.to_iso8601(date)}
        {:booking_status, status} -> {"bookingStatus", status}
        {key, value} -> {to_string(key), to_string(value)}
      end)
      |> URI.encode_query()

    path = "/consents/#{consent_id}/accounts/#{account_id}/transactions"
    path = if query_params != "", do: "#{path}?#{query_params}", else: path

    get(path)
  end

  # HTTP Client Implementation

  defp get(path) do
    url = "#{@base_url}#{path}"
    
    Logger.debug("GET #{url}")

    case HTTPoison.get(url, headers()) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        case Jason.decode(body) do
          {:ok, data} -> {:ok, data}
          {:error, reason} -> {:error, {:json_decode_error, reason}}
        end
      
      {:ok, %HTTPoison.Response{status_code: code, body: body}} ->
        Logger.error("Styx API error: #{code} - #{body}")
        {:error, {:http_error, code, body}}
      
      {:error, %HTTPoison.Error{reason: reason}} ->
        Logger.error("HTTP request failed: #{inspect(reason)}")
        {:error, {:request_failed, reason}}
    end
  end

  defp post(path, body) do
    url = "#{@base_url}#{path}"
    json_body = Jason.encode!(body)
    
    Logger.debug("POST #{url}")

    case HTTPoison.post(url, json_body, headers()) do
      {:ok, %HTTPoison.Response{status_code: code, body: response_body}} when code in 200..299 ->
        case Jason.decode(response_body) do
          {:ok, data} -> {:ok, data}
          {:error, reason} -> {:error, {:json_decode_error, reason}}
        end
      
      {:ok, %HTTPoison.Response{status_code: code, body: response_body}} ->
        Logger.error("Styx API error: #{code} - #{response_body}")
        {:error, {:http_error, code, response_body}}
      
      {:error, %HTTPoison.Error{reason: reason}} ->
        Logger.error("HTTP request failed: #{inspect(reason)}")
        {:error, {:request_failed, reason}}
    end
  end

  defp delete(path) do
    url = "#{@base_url}#{path}"
    
    Logger.debug("DELETE #{url}")

    case HTTPoison.delete(url, headers()) do
      {:ok, %HTTPoison.Response{status_code: code}} when code in 200..299 ->
        {:ok, %{status: "deleted"}}
      
      {:ok, %HTTPoison.Response{status_code: code, body: body}} ->
        Logger.error("Styx API error: #{code} - #{body}")
        {:error, {:http_error, code, body}}
      
      {:error, %HTTPoison.Error{reason: reason}} ->
        Logger.error("HTTP request failed: #{inspect(reason)}")
        {:error, {:request_failed, reason}}
    end
  end

  defp headers do
    [
      {"Content-Type", "application/json"},
      {"Accept", "application/json"},
      {"x-styx-api-key", Application.get_env(:yappma, :styx_api_key, "local-dev-key")}
    ]
  end

  defp default_valid_until do
    # PSD2 consents are typically valid for 90 days
    DateTime.utc_now()
    |> DateTime.add(90, :day)
    |> DateTime.to_iso8601()
  end
end
