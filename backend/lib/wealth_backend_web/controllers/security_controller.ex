defmodule WealthBackendWeb.SecurityController do
  use WealthBackendWeb, :controller
  require Logger

  alias WealthBackend.Portfolio.MetadataEnricher
  alias Yappma.Services.FMPClient

  @doc """
  Universal search endpoint for securities.
  Searches by ticker, company name, or ISIN and returns all matches.
  
  POST /api/securities/search
  Body: {"query": "MSFT"} or {"query": "Microsoft"} or {"query": "US5949181045"}
  
  Returns:
  {
    "results": [
      {
        "ticker": "MSFT",
        "name": "Microsoft Corporation",
        "exchange": "NASDAQ",
        "currency": "USD",
        "type": "stock"
      },
      ...
    ]
  }
  """
  def search(conn, %{"query" => query}) when is_binary(query) do
    Logger.info("Searching securities: query=#{query}")
    
    case FMPClient.search_securities(query, 10) do
      {:ok, results} ->
        Logger.info("Found #{length(results)} securities for query: #{query}")
        json(conn, %{results: results})
      
      {:error, reason} ->
        Logger.error("Security search failed: #{inspect(reason)}")
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Search failed"})
    end
  end

  def search(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "Missing 'query' parameter"})
  end

  @doc """
  Enrich security metadata by identifier (ticker, ISIN, or auto-detect).
  
  POST /api/securities/enrich
  Body: {"identifier": "MSFT", "type": "auto"}
  
  Returns enriched metadata or error.
  """
  def enrich(conn, %{"identifier" => identifier, "type" => type}) do
    type_atom = case type do
      "ticker" -> :ticker
      "isin" -> :isin
      "wkn" -> :wkn
      _ -> :auto
    end

    Logger.info("Enriching security: identifier=#{identifier}, type=#{type}")

    case MetadataEnricher.enrich(identifier, type_atom) do
      {:ok, metadata} ->
        Logger.info("Successfully enriched security: #{identifier}")
        json(conn, metadata)

      {:error, :not_found} ->
        Logger.warning("Security not found: #{identifier}")
        conn
        |> put_status(:not_found)
        |> json(%{error: "Security not found"})

      {:error, :conversion_not_supported} ->
        Logger.warning("Conversion not supported for: #{identifier}")
        conn
        |> put_status(:not_implemented)
        |> json(%{error: "WKN conversion not yet supported"})

      {:error, reason} ->
        Logger.error("External API error for: #{identifier}")
        conn
        |> put_status(:service_unavailable)
        |> json(%{error: "Failed to fetch security data: #{inspect(reason)}"})
    end
  end

  def enrich(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "Missing required parameters"})
  end
end
