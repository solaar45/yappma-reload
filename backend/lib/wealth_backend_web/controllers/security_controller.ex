defmodule WealthBackendWeb.SecurityController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Portfolio.MetadataEnricher

  action_fallback WealthBackendWeb.FallbackController

  @doc """
  POST /api/securities/enrich
  
  Enriches security metadata based on provided identifier.
  
  Body:
  {
    "identifier": "AAPL" or "US0378331005" or "865985",
    "type": "ticker" | "isin" | "wkn" | "auto" (optional, defaults to "auto")
  }
  
  Returns:
  {
    "data": {
      "ticker": "AAPL",
      "name": "Apple Inc.",
      "security_type": "stock",
      "exchange": "NASDAQ",
      "currency": "USD",
      "sector": "Technology",
      ...
    }
  }
  """
  def enrich(conn, %{"identifier" => identifier} = params) when is_binary(identifier) do
    type = Map.get(params, "type", "auto") |> String.to_existing_atom()
    
    case MetadataEnricher.enrich(identifier, type) do
      {:ok, metadata} ->
        conn
        |> put_status(:ok)
        |> json(%{data: metadata})
      
      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Security not found"})
      
      {:error, :conversion_not_supported} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "ISIN/WKN to ticker conversion not yet supported. Please use ticker symbol directly."})
      
      {:error, :api_error} ->
        conn
        |> put_status(:service_unavailable)
        |> json(%{error: "External API error. Please try again later."})
      
      {:error, :network_error} ->
        conn
        |> put_status(:service_unavailable)
        |> json(%{error: "Network error. Please check your connection."})
      
      {:error, _reason} ->
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Failed to enrich security data"})
    end
  rescue
    ArgumentError ->
      conn
      |> put_status(:bad_request)
      |> json(%{error: "Invalid type parameter. Must be 'ticker', 'isin', 'wkn', or 'auto'"})
  end

  def enrich(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "Missing required parameter: identifier"})
  end
end
