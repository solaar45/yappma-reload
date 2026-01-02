defmodule Yappma.BankConnections.StyxClient do
  @moduledoc """
  HTTP client for Styx PSD2 XS2A API.
  
  This module handles all communication with the Styx server.
  """

  require Logger

  @styx_base_url Application.compile_env(:yappma, :styx_base_url, "http://localhost:8093")
  @http_client Application.compile_env(:yappma, :http_client, HTTPoison)

  @doc """
  Lists all configured ASPSPs (banks).
  """
  def list_aspsps do
    with {:ok, response} <- get("/aspsps"),
         {:ok, body} <- Jason.decode(response.body) do
      {:ok, body["aspsps"]}
    end
  end

  @doc """
  Gets details for a specific ASPSP.
  """
  def get_aspsp(aspsp_id) do
    with {:ok, response} <- get("/aspsps/#{aspsp_id}"),
         {:ok, body} <- Jason.decode(response.body) do
      {:ok, body}
    end
  end

  @doc """
  Creates a new consent request.
  
  ## Parameters
  
    - aspsp_id: Bank identifier
    - params: Map with consent parameters
      - redirect_url: Callback URL after authorization
      - accounts: Optional list of specific IBANs to access
      - valid_until: Optional expiry date (default: 90 days from now)
  """
  def create_consent(aspsp_id, params) do
    body = %{
      access: %{
        accounts: params[:accounts] || [],
        balances: params[:accounts] || [],
        transactions: params[:accounts] || [],
        availableAccounts: if(params[:accounts] == [], do: "allAccounts", else: nil)
      },
      recurringIndicator: true,
      validUntil: params[:valid_until] || calculate_expiry_date(),
      frequencyPerDay: 4
    }

    headers = [
      {"PSU-ID", params[:psu_id]},
      {"TPP-Redirect-URI", params[:redirect_url]}
    ]

    with {:ok, response} <- post("/consents/#{aspsp_id}", body, headers),
         {:ok, result} <- Jason.decode(response.body) do
      {:ok, result}
    end
  end

  @doc """
  Gets consent status.
  """
  def get_consent_status(consent_id) do
    with {:ok, response} <- get("/consents/#{consent_id}"),
         {:ok, body} <- Jason.decode(response.body) do
      {:ok, body}
    end
  end

  @doc """
  Deletes (revokes) a consent.
  """
  def delete_consent(consent_id) do
    with {:ok, _response} <- delete("/consents/#{consent_id}") do
      {:ok, %{status: "revoked"}}
    end
  end

  @doc """
  Gets all accounts for a consent.
  """
  def get_accounts(consent_id) do
    headers = [{"Consent-ID", consent_id}]

    with {:ok, response} <- get("/accounts", headers),
         {:ok, body} <- Jason.decode(response.body) do
      {:ok, body["accounts"]}
    end
  end

  @doc """
  Gets detailed account information including balance.
  """
  def get_account_details(consent_id, account_id) do
    headers = [{"Consent-ID", consent_id}]

    with {:ok, response} <- get("/accounts/#{account_id}", headers),
         {:ok, body} <- Jason.decode(response.body) do
      {:ok, body}
    end
  end

  @doc """
  Gets account balance.
  """
  def get_balance(consent_id, account_id) do
    headers = [{"Consent-ID", consent_id}]

    with {:ok, response} <- get("/accounts/#{account_id}/balances", headers),
         {:ok, body} <- Jason.decode(response.body) do
      {:ok, body["balances"]}
    end
  end

  @doc """
  Gets transactions for an account.
  
  ## Options
  
    - date_from: Start date (Date)
    - date_to: End date (Date)
    - booking_status: "booked" | "pending" | "both" (default: "booked")
  """
  def get_transactions(consent_id, account_id, opts \\ []) do
    headers = [{"Consent-ID", consent_id}]
    
    query_params = build_transaction_query(opts)
    path = "/accounts/#{account_id}/transactions?#{URI.encode_query(query_params)}"

    with {:ok, response} <- get(path, headers),
         {:ok, body} <- Jason.decode(response.body) do
      transactions = 
        body["transactions"]
        |> Map.get("booked", [])
        |> Kernel.++(Map.get(body["transactions"], "pending", []))
      
      {:ok, transactions}
    end
  end

  # Private HTTP helpers

  defp get(path, headers \\ []) do
    url = "#{@styx_base_url}#{path}"
    headers = default_headers() ++ headers

    Logger.debug("Styx GET: #{url}")
    
    case @http_client.get(url, headers) do
      {:ok, %{status_code: status} = response} when status in 200..299 ->
        {:ok, response}
      
      {:ok, %{status_code: status, body: body}} ->
        Logger.error("Styx API error: #{status} - #{body}")
        {:error, {:http_error, status, body}}
      
      {:error, reason} ->
        Logger.error("Styx connection error: #{inspect(reason)}")
        {:error, {:connection_error, reason}}
    end
  end

  defp post(path, body, headers \\ []) do
    url = "#{@styx_base_url}#{path}"
    headers = default_headers() ++ [{"Content-Type", "application/json"}] ++ headers
    json_body = Jason.encode!(body)

    Logger.debug("Styx POST: #{url}")
    
    case @http_client.post(url, json_body, headers) do
      {:ok, %{status_code: status} = response} when status in 200..299 ->
        {:ok, response}
      
      {:ok, %{status_code: status, body: body}} ->
        Logger.error("Styx API error: #{status} - #{body}")
        {:error, {:http_error, status, body}}
      
      {:error, reason} ->
        {:error, {:connection_error, reason}}
    end
  end

  defp delete(path, headers \\ []) do
    url = "#{@styx_base_url}#{path}"
    headers = default_headers() ++ headers

    Logger.debug("Styx DELETE: #{url}")
    
    case @http_client.delete(url, headers) do
      {:ok, %{status_code: status} = response} when status in 200..299 ->
        {:ok, response}
      
      {:error, reason} ->
        {:error, {:connection_error, reason}}
    end
  end

  defp default_headers do
    [
      {"X-Request-ID", generate_request_id()},
      {"Accept", "application/json"}
    ]
  end

  defp generate_request_id do
    UUID.uuid4()
  end

  defp calculate_expiry_date do
    Date.utc_today()
    |> Date.add(90)
    |> Date.to_iso8601()
  end

  defp build_transaction_query(opts) do
    %{}
    |> maybe_add(:dateFrom, opts[:date_from])
    |> maybe_add(:dateTo, opts[:date_to])
    |> maybe_add(:bookingStatus, opts[:booking_status] || "booked")
  end

  defp maybe_add(map, _key, nil), do: map
  defp maybe_add(map, key, %Date{} = value), do: Map.put(map, key, Date.to_iso8601(value))
  defp maybe_add(map, key, value), do: Map.put(map, key, value)
end
