defmodule WealthBackend.Portfolio.MetadataEnricher do
  @moduledoc """
  Service for enriching security assets with metadata from external APIs.
  Supports ISIN, WKN, and ticker symbol lookups.
  """

  require Logger

  # Using v7 quote endpoint that doesn't require authentication
  @yahoo_quote_url "https://query1.finance.yahoo.com/v7/finance/quote"
  @timeout 10_000
  @recv_timeout 10_000

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
    
    # For ISIN, we need to convert to ticker first
    # Most ISINs don't work directly with Yahoo Finance
    case isin_to_ticker(isin) do
      {:ok, ticker} -> fetch_yahoo_data(ticker)
      {:error, _} = error -> error
    end
  end

  @doc "Enriches by WKN (German Securities Code)"
  def enrich_by_wkn(wkn) when is_binary(wkn) do
    Logger.info("Enriching security by WKN: #{wkn}")
    
    # WKN needs conversion to ticker or ISIN
    case wkn_to_ticker(wkn) do
      {:ok, ticker} -> fetch_yahoo_data(ticker)
      {:error, _} = error -> error
    end
  end

  @doc "Enriches by ticker symbol"
  def enrich_by_ticker(ticker) when is_binary(ticker) do
    Logger.info("Enriching security by ticker: #{ticker}")
    fetch_yahoo_data(String.upcase(ticker))
  end

  # Private functions

  defp fetch_yahoo_data(ticker) do
    # Use v7 quote endpoint which doesn't require authentication
    url = "#{@yahoo_quote_url}?symbols=#{ticker}"
    
    headers = [
      {"User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"},
      {"Accept", "application/json"},
      {"Accept-Language", "en-US,en;q=0.9"},
      {"Referer", "https://finance.yahoo.com/"}
    ]
    
    Logger.info("Fetching data from Yahoo Finance v7 for: #{ticker}")
    
    case HTTPoison.get(url, headers, timeout: @timeout, recv_timeout: @recv_timeout) do
      {:ok, %{status_code: 200, body: body}} ->
        Logger.debug("Received successful response from Yahoo Finance")
        parse_yahoo_v7_response(body, ticker)
      
      {:ok, %{status_code: 404}} ->
        Logger.warning("Yahoo Finance returned 404 for ticker: #{ticker}")
        {:error, :not_found}
      
      {:ok, %{status_code: status, body: body}} ->
        Logger.warning("Yahoo Finance API returned status #{status} for ticker #{ticker}: #{inspect(body)}")
        {:error, :api_error}
      
      {:error, %HTTPoison.Error{reason: :timeout}} ->
        Logger.error("Timeout fetching data for #{ticker}")
        {:error, :network_error}
      
      {:error, %HTTPoison.Error{reason: reason}} ->
        Logger.error("HTTP error fetching data for #{ticker}: #{inspect(reason)}")
        {:error, :network_error}
    end
  rescue
    e ->
      Logger.error("Exception in fetch_yahoo_data: #{inspect(e)}")
      {:error, :api_error}
  end

  defp parse_yahoo_v7_response(body, ticker) do
    case Jason.decode(body) do
      {:ok, %{"quoteResponse" => %{"result" => [quote | _]}}} when quote != nil ->
        Logger.debug("Successfully parsed Yahoo Finance v7 response")
        extract_metadata_v7(quote, ticker)
      
      {:ok, %{"quoteResponse" => %{"result" => []}}} ->
        Logger.warning("Yahoo Finance returned empty result for ticker: #{ticker}")
        {:error, :not_found}
      
      {:ok, %{"quoteResponse" => %{"error" => error}}} ->
        Logger.warning("Yahoo Finance API error: #{inspect(error)}")
        {:error, :not_found}
      
      {:ok, unexpected} ->
        Logger.error("Unexpected Yahoo Finance response format: #{inspect(unexpected)}")
        {:error, :parse_error}
      
      {:error, reason} ->
        Logger.error("JSON decode error: #{inspect(reason)}")
        {:error, :parse_error}
    end
  end

  defp extract_metadata_v7(quote, ticker) do
    metadata = %{
      ticker: quote["symbol"] || ticker,
      name: quote["longName"] || quote["shortName"],
      security_type: determine_security_type_v7(quote["quoteType"]),
      exchange: quote["exchange"],
      currency: quote["currency"],
      sector: quote["sector"],
      country_of_domicile: quote["country"],
      # Additional fields available in v7
      market_cap: format_number(quote["marketCap"]),
      price: quote["regularMarketPrice"],
      fifty_two_week_high: quote["fiftyTwoWeekHigh"],
      fifty_two_week_low: quote["fiftyTwoWeekLow"]
    }
    |> remove_nil_values()

    if map_size(metadata) > 0 do
      Logger.info("Successfully extracted metadata for #{ticker}: #{map_size(metadata)} fields")
      {:ok, metadata}
    else
      Logger.warning("No metadata fields extracted for #{ticker}")
      {:error, :extraction_error}
    end
  rescue
    e ->
      Logger.error("Error extracting metadata: #{Exception.message(e)}")
      Logger.debug("Stack trace: #{Exception.format_stacktrace(__STACKTRACE__)}")
      {:error, :extraction_error}
  end

  defp determine_security_type_v7(quote_type) when is_binary(quote_type) do
    case String.upcase(quote_type) do
      "EQUITY" -> "stock"
      "ETF" -> "etf"
      "MUTUALFUND" -> "mutual_fund"
      "INDEX" -> "index_fund"
      "CRYPTOCURRENCY" -> "crypto"
      _ -> "other"
    end
  end
  defp determine_security_type_v7(_), do: nil

  defp format_number(nil), do: nil
  defp format_number(num) when is_number(num), do: num
  defp format_number(_), do: nil

  defp remove_nil_values(map) do
    map
    |> Enum.reject(fn {_k, v} -> is_nil(v) end)
    |> Enum.into(%{})
  end

  # ISIN to ticker conversion (simplified - would need proper mapping service)
  defp isin_to_ticker(isin) do
    # For US securities, ISIN format is US + 9-char CUSIP + check digit
    # For others, we'd need a proper ISIN->ticker mapping database
    # or use a service like OpenFIGI
    Logger.info("ISIN to ticker conversion not yet supported: #{isin}")
    {:error, :conversion_not_supported}
  end

  # WKN to ticker conversion (simplified)
  defp wkn_to_ticker(wkn) do
    # WKN is German-specific and would need a mapping database
    # or use a service like OpenFIGI or Bundesanzeiger
    Logger.info("WKN to ticker conversion not yet supported: #{wkn}")
    {:error, :conversion_not_supported}
  end

  # Identifier validation
  defp is_isin?(str) when is_binary(str) do
    str = String.trim(str)
    # ISIN: 2 letter country code + 9 alphanumeric + 1 check digit
    String.length(str) == 12 and String.match?(str, ~r/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/)
  end
  defp is_isin?(_), do: false

  defp is_wkn?(str) when is_binary(str) do
    str = String.trim(str)
    # WKN: 6 alphanumeric characters (German securities identification)
    String.length(str) == 6 and String.match?(str, ~r/^[A-Z0-9]{6}$/)
  end
  defp is_wkn?(_), do: false
end
