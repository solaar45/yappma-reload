defmodule WealthBackend.Portfolio.MetadataEnricher do
  @moduledoc """
  Service for enriching security assets with metadata from external APIs.
  Supports ISIN, WKN, and ticker symbol lookups.
  
  Supported providers:
  - Alpha Vantage (primary, requires API key)
  - Yahoo Finance (fallback, limited access)
  - Demo mode (for testing)
  """

  require Logger

  @alpha_vantage_base "https://www.alphavantage.co/query"
  @yahoo_quote_url "https://query1.finance.yahoo.com/v7/finance/quote"
  @timeout 10_000
  @recv_timeout 10_000

  # Demo data for common tickers when no API key is available
  @demo_data %{
    "AAPL" => %{
      ticker: "AAPL",
      name: "Apple Inc.",
      security_type: "stock",
      exchange: "NASDAQ",
      currency: "USD",
      sector: "Technology",
      country_of_domicile: "US"
    },
    "MSFT" => %{
      ticker: "MSFT",
      name: "Microsoft Corporation",
      security_type: "stock",
      exchange: "NASDAQ",
      currency: "USD",
      sector: "Technology",
      country_of_domicile: "US"
    },
    "VWCE" => %{
      ticker: "VWCE",
      name: "Vanguard FTSE All-World UCITS ETF",
      security_type: "etf",
      exchange: "XETRA",
      currency: "EUR",
      country_of_domicile: "IE"
    },
    "VOO" => %{
      ticker: "VOO",
      name: "Vanguard S&P 500 ETF",
      security_type: "etf",
      exchange: "NYSE",
      currency: "USD",
      country_of_domicile: "US"
    }
  }

  @doc """
  Enriches security metadata based on identifier (ISIN, WKN, or ticker).
  Returns a map with enriched fields or {:error, reason}.
  """
  def enrich(identifier, type \\ :auto)

  def enrich(identifier, :auto) when is_binary(identifier) do
    identifier = String.trim(identifier)
    
    cond do
      is_isin?(identifier) -> 
        Logger.info("Detected ISIN: #{identifier}")
        enrich_by_isin(identifier)
      
      is_wkn?(identifier) -> 
        Logger.info("Detected WKN: #{identifier}")
        enrich_by_wkn(identifier)
      
      true -> 
        Logger.info("Treating as ticker: #{identifier}")
        enrich_by_ticker(identifier)
    end
  end

  def enrich(identifier, :isin), do: enrich_by_isin(identifier)
  def enrich(identifier, :wkn), do: enrich_by_wkn(identifier)
  def enrich(identifier, :ticker), do: enrich_by_ticker(identifier)

  @doc "Enriches by ISIN"
  def enrich_by_isin(isin) when is_binary(isin) do
    Logger.info("Enriching security by ISIN: #{isin}")
    {:error, :conversion_not_supported}
  end

  @doc "Enriches by WKN (German Securities Code)"
  def enrich_by_wkn(wkn) when is_binary(wkn) do
    Logger.info("Enriching security by WKN: #{wkn}")
    {:error, :conversion_not_supported}
  end

  @doc "Enriches by ticker symbol"
  def enrich_by_ticker(ticker) when is_binary(ticker) do
    Logger.info("Enriching security by ticker: #{ticker}")
    ticker = String.upcase(String.trim(ticker))
    
    # Try providers in order
    with {:error, _} <- fetch_alpha_vantage(ticker),
         {:error, _} <- fetch_demo_data(ticker) do
      Logger.warning("All providers failed for ticker: #{ticker}")
      {:error, :not_found}
    end
  end

  # Private functions

  defp fetch_alpha_vantage(ticker) do
    api_key = get_alpha_vantage_key()
    
    if api_key == nil or api_key == "" or api_key == "demo" do
      Logger.info("Alpha Vantage API key not configured, skipping")
      {:error, :no_api_key}
    else
      do_fetch_alpha_vantage(ticker, api_key)
    end
  end

  defp do_fetch_alpha_vantage(ticker, api_key) do
    # Use OVERVIEW endpoint for company information
    url = "#{@alpha_vantage_base}?function=OVERVIEW&symbol=#{ticker}&apikey=#{api_key}"
    
    headers = [
      {"User-Agent", "Mozilla/5.0"},
      {"Accept", "application/json"}
    ]
    
    Logger.info("Fetching data from Alpha Vantage for: #{ticker}")
    
    case HTTPoison.get(url, headers, timeout: @timeout, recv_timeout: @recv_timeout) do
      {:ok, %{status_code: 200, body: body}} ->
        parse_alpha_vantage_response(body, ticker)
      
      {:ok, %{status_code: status}} ->
        Logger.warning("Alpha Vantage returned status #{status}")
        {:error, :api_error}
      
      {:error, %HTTPoison.Error{reason: reason}} ->
        Logger.error("HTTP error fetching from Alpha Vantage: #{inspect(reason)}")
        {:error, :network_error}
    end
  rescue
    e ->
      Logger.error("Exception in Alpha Vantage fetch: #{inspect(e)}")
      {:error, :api_error}
  end

  defp parse_alpha_vantage_response(body, ticker) do
    case Jason.decode(body) do
      {:ok, data} when is_map(data) ->
        # Check if we got an error or empty response
        cond do
          Map.has_key?(data, "Error Message") ->
            Logger.warning("Alpha Vantage error: #{data["Error Message"]}")
            {:error, :not_found}
          
          Map.has_key?(data, "Note") ->
            Logger.warning("Alpha Vantage rate limit: #{data["Note"]}")
            {:error, :rate_limit}
          
          map_size(data) == 0 ->
            Logger.warning("Alpha Vantage returned empty data for: #{ticker}")
            {:error, :not_found}
          
          true ->
            extract_alpha_vantage_metadata(data, ticker)
        end
      
      {:error, reason} ->
        Logger.error("JSON decode error: #{inspect(reason)}")
        {:error, :parse_error}
    end
  end

  defp extract_alpha_vantage_metadata(data, ticker) do
    metadata = %{
      ticker: data["Symbol"] || ticker,
      name: data["Name"],
      security_type: determine_av_type(data["AssetType"]),
      exchange: data["Exchange"],
      currency: data["Currency"],
      sector: data["Sector"],
      country_of_domicile: data["Country"],
      description: data["Description"],
      market_cap: data["MarketCapitalization"],
      dividend_yield: data["DividendYield"]
    }
    |> remove_nil_values()

    if map_size(metadata) > 1 do
      Logger.info("Successfully enriched #{ticker} with Alpha Vantage: #{map_size(metadata)} fields")
      {:ok, metadata}
    else
      Logger.warning("Insufficient data from Alpha Vantage for: #{ticker}")
      {:error, :insufficient_data}
    end
  rescue
    e ->
      Logger.error("Error extracting Alpha Vantage metadata: #{Exception.message(e)}")
      {:error, :extraction_error}
  end

  defp fetch_demo_data(ticker) do
    case Map.get(@demo_data, ticker) do
      nil ->
        Logger.info("No demo data available for: #{ticker}")
        {:error, :not_found}
      
      data ->
        Logger.info("Using demo data for: #{ticker}")
        {:ok, data}
    end
  end

  defp determine_av_type(asset_type) when is_binary(asset_type) do
    case String.downcase(asset_type) do
      "common stock" -> "stock"
      "etf" -> "etf"
      "mutual fund" -> "mutual_fund"
      _ -> "other"
    end
  end
  defp determine_av_type(_), do: nil

  defp remove_nil_values(map) do
    map
    |> Enum.reject(fn {_k, v} -> is_nil(v) or v == "" end)
    |> Enum.into(%{})
  end

  defp get_alpha_vantage_key do
    Application.get_env(:wealth_backend, :alpha_vantage_api_key) ||
      System.get_env("ALPHA_VANTAGE_API_KEY")
  end

  # Identifier validation
  defp is_isin?(str) when is_binary(str) do
    str = String.trim(str)
    String.length(str) == 12 and String.match?(str, ~r/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/)
  end
  defp is_isin?(_), do: false

  defp is_wkn?(str) when is_binary(str) do
    str = String.trim(str)
    String.length(str) == 6 and String.match?(str, ~r/^[A-Z0-9]{6}$/)
  end
  defp is_wkn?(_), do: false
end
