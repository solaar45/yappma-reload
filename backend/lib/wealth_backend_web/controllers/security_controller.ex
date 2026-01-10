defmodule WealthBackendWeb.SecurityController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Portfolio.MetadataEnricher

  require Logger

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
    # Safely convert type parameter to atom
    type = 
      params
      |> Map.get("type", "auto")
      |> normalize_type()
    
    Logger.info("Enriching security: identifier=#{identifier}, type=#{type}")
    
    case MetadataEnricher.enrich(identifier, type) do
      {:ok, metadata} ->
        Logger.info("Successfully enriched security: #{identifier}")
        conn
        |> put_status(:ok)
        |> json(%{data: metadata})
      
      {:error, :not_found} ->
        Logger.warning("Security not found: #{identifier}")
        conn
        |> put_status(:not_found)
        |> json(%{error: "Security not found"})
      
      {:error, :conversion_not_supported} ->
        Logger.info("ISIN/WKN conversion not supported for: #{identifier}")
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "ISIN/WKN to ticker conversion not yet supported. Please use ticker symbol directly."})
      
      {:error, :api_error} ->
        Logger.error("External API error for: #{identifier}")
        conn
        |> put_status(:service_unavailable)
        |> json(%{error: "External API error. Please try again later."})
      
      {:error, :network_error} ->
        Logger.error("Network error for: #{identifier}")
        conn
        |> put_status(:service_unavailable)
        |> json(%{error: "Network error. Please check your connection."})
      
      {:error, :parse_error} ->
        Logger.error("Parse error for: #{identifier}")
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Failed to parse API response"})
      
      {:error, :extraction_error} ->
        Logger.error("Extraction error for: #{identifier}")
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Failed to extract metadata from API response"})
      
      {:error, reason} ->
        Logger.error("Unknown error enriching security #{identifier}: #{inspect(reason)}")
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Failed to enrich security data"})
    end
  end

  def enrich(conn, _params) do
    Logger.warning("Invalid enrich request: missing identifier")
    conn
    |> put_status(:bad_request)
    |> json(%{error: "Missing required parameter: identifier"})
  end

  # Normalize type parameter to atom safely
  defp normalize_type(type) when is_binary(type) do
    case String.downcase(type) do
      "ticker" -> :ticker
      "isin" -> :isin
      "wkn" -> :wkn
      "auto" -> :auto
      _ -> :auto
    end
  end
  defp normalize_type(_), do: :auto
end
