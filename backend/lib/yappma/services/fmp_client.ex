defmodule Yappma.Services.FMPClient do
  @moduledoc """
  Client for Financial Modeling Prep API integration.
  Handles security validation and metadata enrichment via ticker or ISIN.
  
  Get your API key at: https://site.financialmodelingprep.com/
  Free tier: 250 API calls total
  
  API Documentation: https://site.financialmodelingprep.com/developer/docs/quickstart
  
  Note: Only /stable endpoints are used as /api/v3 is legacy-only since Aug 2025.
  
  Important: FMP's /stable/search-name searches by COMPANY NAME, not ticker symbol.
  Searching 'MSFT' finds derivative ETFs (MSFO, MSFW) but NOT Microsoft itself.
  Must search 'Microsoft' to find MSFT ticker.
  """

  require Logger

  # Only use /stable endpoints - /api/v3 is legacy-only
  @base_url "https://financialmodelingprep.com/stable"
  @timeout 10_000
  @recv_timeout 10_000

  # ============================================================================
  # Public API - Validation
  # ============================================================================

  @doc """
  Validates a ticker symbol against FMP API.
  Tries direct ticker search, falls back to searching common stock names.
  Returns {:ok, security_data} if found, {:error, :not_found} otherwise.
  """
  def validate_ticker(ticker) when is_binary(ticker) do
    ticker = String.trim(ticker) |> String.upcase()
    
    # Try ticker-based search first (searches in name field)
    case search_and_find_ticker(ticker, ticker) do
      {:ok, _} = result -> result
      {:error, :not_found} -> try_common_ticker_names(ticker)
    end
  end

  @doc """
  Validates an ISIN against FMP API.
  Uses general search endpoint as ISIN-specific endpoint is not available.
  Returns {:ok, security_data} if found, {:error, :not_found} otherwise.
  """
  def validate_isin(isin) when is_binary(isin) do
    isin = String.trim(isin) |> String.upcase()
    url = "#{@base_url}/search-name?query=#{URI.encode(isin)}&apikey=#{api_key()}"

    Logger.debug("FMP API: Validating ISIN #{isin}")

    case HTTPoison.get(url, [], timeout: @timeout, recv_timeout: @recv_timeout) do
      {:ok, %{status_code: 200, body: body}} ->
        case Jason.decode(body) do
          {:ok, [result | _]} when is_map(result) ->
            Logger.info("FMP API: ISIN #{isin} found")
            {:ok, format_search_result(result)}

          {:ok, []} ->
            Logger.info("FMP API: ISIN #{isin} not found")
            {:error, :not_found}

          {:error, reason} ->
            Logger.error("FMP API: Failed to decode ISIN response: #{inspect(reason)}")
            {:error, :invalid_response}
        end

      {:ok, %{status_code: status}} ->
        Logger.error("FMP API: Unexpected status code #{status} for ISIN #{isin}")
        {:error, :api_error}

      {:error, reason} ->
        Logger.error("FMP API: Request failed for ISIN #{isin}: #{inspect(reason)}")
        {:error, :api_error}
    end
  end

  @doc """
  Validates a security identifier (ticker or ISIN) against FMP API.
  Automatically detects whether the identifier is an ISIN (12 chars, starts with 2 letters)
  or a ticker symbol.
  """
  def validate_security(identifier) when is_binary(identifier) do
    identifier = String.trim(identifier)

    cond do
      # ISIN: 12 characters, starts with 2 letters (country code)
      String.length(identifier) == 12 and String.match?(identifier, ~r/^[A-Z]{2}/i) ->
        validate_isin(identifier)

      # Otherwise treat as ticker
      String.length(identifier) > 0 ->
        validate_ticker(identifier)

      true ->
        {:error, :invalid_identifier}
    end
  end

  # ============================================================================
  # Public API - Enrichment
  # ============================================================================

  @doc """
  Enriches security metadata by ticker symbol.
  Tries ticker search first, then falls back to known company names.
  Returns {:ok, enriched_data} with available metadata or error tuple.
  """
  def enrich_by_ticker(ticker) when is_binary(ticker) do
    ticker = String.trim(ticker) |> String.upcase()
    Logger.info("FMP API: Enriching ticker #{ticker}")
    
    # Try ticker-based search first
    case search_and_extract(ticker, ticker) do
      {:ok, _} = result -> result
      {:error, :not_found} -> try_common_ticker_enrichment(ticker)
    end
  end

  @doc """
  Enriches security metadata by ISIN.
  Searches for ISIN, then returns available data.
  Returns {:ok, enriched_data} with available metadata or error tuple.
  """
  def enrich_by_isin(isin) when is_binary(isin) do
    isin = String.trim(isin) |> String.upcase()
    Logger.info("FMP API: Enriching ISIN #{isin}")

    case search_and_extract(isin, nil) do
      {:ok, data} ->
        # Add ISIN to enriched data if not already present
        {:ok, Map.put_new(data, :isin, isin)}
      
      error ->
        error
    end
  end

  @doc """
  Converts ISIN to ticker symbol using FMP search endpoint.
  Returns {:ok, ticker} or error tuple.
  """
  def convert_isin_to_ticker(isin) when is_binary(isin) do
    isin = String.trim(isin) |> String.upcase()
    url = "#{@base_url}/search-name?query=#{URI.encode(isin)}&apikey=#{api_key()}"

    Logger.debug("FMP API: Converting ISIN #{isin} to ticker")

    case HTTPoison.get(url, [], timeout: @timeout, recv_timeout: @recv_timeout) do
      {:ok, %{status_code: 200, body: body}} ->
        case Jason.decode(body) do
          {:ok, [result | _]} when is_map(result) ->
            case Map.get(result, "symbol") do
              nil ->
                Logger.warning("FMP API: No ticker found for ISIN #{isin}")
                {:error, :not_found}
              
              ticker ->
                Logger.info("FMP API: Converted ISIN #{isin} to ticker #{ticker}")
                {:ok, ticker}
            end

          {:ok, []} ->
            Logger.info("FMP API: ISIN #{isin} not found")
            {:error, :not_found}

          {:error, reason} ->
            Logger.error("FMP API: Failed to decode ISIN response: #{inspect(reason)}")
            {:error, :invalid_response}
        end

      {:ok, %{status_code: status}} ->
        Logger.error("FMP API: Unexpected status code #{status} for ISIN #{isin}")
        {:error, :api_error}

      {:error, reason} ->
        Logger.error("FMP API: Request failed for ISIN #{isin}: #{inspect(reason)}")
        {:error, :network_error}
    end
  end

  # ============================================================================
  # Private Functions - Search Logic
  # ============================================================================

  # Try searching by ticker, look for exact match in results
  defp search_and_find_ticker(query, expected_ticker) do
    url = "#{@base_url}/search-name?query=#{URI.encode(query)}&apikey=#{api_key()}"
    Logger.debug("FMP API: Searching for '#{query}' expecting ticker '#{expected_ticker}'")

    case HTTPoison.get(url, [], timeout: @timeout, recv_timeout: @recv_timeout) do
      {:ok, %{status_code: 200, body: body}} ->
        case Jason.decode(body) do
          {:ok, results} when is_list(results) ->
            case find_exact_ticker_match(results, expected_ticker) do
              {:ok, result} ->
                Logger.info("FMP API: Found exact match for ticker #{expected_ticker}")
                {:ok, format_search_result(result)}
              
              :error ->
                Logger.debug("FMP API: No exact match for ticker #{expected_ticker} in #{length(results)} results")
                {:error, :not_found}
            end

          {:ok, _} ->
            {:error, :not_found}

          {:error, reason} ->
            Logger.error("FMP API: Failed to decode response: #{inspect(reason)}")
            {:error, :invalid_response}
        end

      {:ok, %{status_code: status}} ->
        Logger.error("FMP API: Unexpected status code #{status}")
        {:error, :api_error}

      {:error, reason} ->
        Logger.error("FMP API: Request failed: #{inspect(reason)}")
        {:error, :api_error}
    end
  end

  # Search and extract metadata for enrichment
  defp search_and_extract(query, expected_ticker) do
    url = "#{@base_url}/search-name?query=#{URI.encode(query)}&apikey=#{api_key()}"

    case HTTPoison.get(url, [], timeout: @timeout, recv_timeout: @recv_timeout) do
      {:ok, %{status_code: 200, body: body}} ->
        parse_enrichment_response(body, query, expected_ticker)

      {:ok, %{status_code: 404}} ->
        Logger.info("FMP API: Not found (404) for query #{query}")
        {:error, :not_found}

      {:ok, %{status_code: 403}} ->
        Logger.error("FMP API: Access forbidden (403) - check API key validity")
        {:error, :api_error}

      {:ok, %{status_code: status}} ->
        Logger.error("FMP API: Unexpected status code #{status}")
        {:error, :api_error}

      {:error, reason} ->
        Logger.error("FMP API: Request failed: #{inspect(reason)}")
        {:error, :network_error}
    end
  rescue
    e ->
      Logger.error("FMP API: Exception during search: #{inspect(e)}")
      {:error, :api_error}
  end

  # Try common ticker to company name mappings
  defp try_common_ticker_names(ticker) do
    company_name = ticker_to_company_name(ticker)
    
    if company_name do
      Logger.info("FMP API: Trying company name search for #{ticker} -> #{company_name}")
      search_and_find_ticker(company_name, ticker)
    else
      Logger.info("FMP API: No known company name mapping for ticker #{ticker}")
      {:error, :not_found}
    end
  end

  # Try enrichment with company name fallback
  defp try_common_ticker_enrichment(ticker) do
    company_name = ticker_to_company_name(ticker)
    
    if company_name do
      Logger.info("FMP API: Trying company name enrichment for #{ticker} -> #{company_name}")
      search_and_extract(company_name, ticker)
    else
      Logger.info("FMP API: Ticker #{ticker} not found")
      {:error, :not_found}
    end
  end

  # Map common tickers to company names for fallback search
  # FMP's search-name searches company names, not tickers!
  defp ticker_to_company_name(ticker) do
    case String.upcase(ticker) do
      "AAPL" -> "Apple"
      "MSFT" -> "Microsoft"
      "GOOGL" -> "Alphabet"
      "GOOG" -> "Alphabet"
      "AMZN" -> "Amazon"
      "NVDA" -> "NVIDIA"
      "TSLA" -> "Tesla"
      "META" -> "Meta"
      "BRK.A" -> "Berkshire"
      "BRK.B" -> "Berkshire"
      "JPM" -> "JPMorgan"
      "V" -> "Visa"
      "WMT" -> "Walmart"
      _ -> nil
    end
  end

  # ============================================================================
  # Private Functions - Data Processing
  # ============================================================================

  # Find exact ticker match in search results
  defp find_exact_ticker_match(results, ticker) when is_list(results) do
    ticker_upper = String.upcase(ticker)
    
    case Enum.find(results, fn result -> 
      String.upcase(Map.get(result, "symbol", "")) == ticker_upper
    end) do
      nil -> :error
      result -> {:ok, result}
    end
  end

  # Parse enrichment response from FMP search endpoint
  defp parse_enrichment_response(body, query, expected_ticker) do
    case Jason.decode(body) do
      {:ok, results} when is_list(results) and length(results) > 0 ->
        # Try to find exact ticker match if we know what we're looking for
        result = if expected_ticker do
          case find_exact_ticker_match(results, expected_ticker) do
            {:ok, match} -> match
            :error -> List.first(results)  # Fallback to first result
          end
        else
          List.first(results)
        end
        
        extract_enriched_metadata(result, query)

      {:ok, []} ->
        Logger.warning("FMP API: No data found for #{query}")
        {:error, :not_found}

      {:error, reason} ->
        Logger.error("FMP API: Failed to parse response: #{inspect(reason)}")
        {:error, :parse_error}
    end
  end

  # Extract and format enriched metadata from FMP search response
  defp extract_enriched_metadata(data, identifier) do
    metadata = %{
      ticker: Map.get(data, "symbol"),
      name: Map.get(data, "name"),
      security_type: determine_security_type(data),
      exchange: Map.get(data, "stockExchange") || Map.get(data, "exchange"),
      exchange_short: Map.get(data, "exchangeShortName") || Map.get(data, "exchange"),
      currency: Map.get(data, "currency")
    }
    |> remove_nil_values()

    if map_size(metadata) > 1 do
      Logger.info("FMP API: Successfully enriched #{identifier} with #{map_size(metadata)} fields")
      {:ok, metadata}
    else
      Logger.warning("FMP API: Insufficient data for #{identifier}")
      {:error, :insufficient_data}
    end
  rescue
    e ->
      Logger.error("FMP API: Error extracting metadata: #{Exception.message(e)}")
      {:error, :extraction_error}
  end

  # Determine security type from limited FMP search data
  defp determine_security_type(data) do
    symbol = Map.get(data, "symbol", "")
    
    cond do
      String.contains?(symbol, ".") -> "etf"
      true -> "stock"
    end
  end

  # Format search result for validation
  defp format_search_result(result) do
    %{
      symbol: Map.get(result, "symbol"),
      name: Map.get(result, "name"),
      currency: Map.get(result, "currency"),
      exchange: Map.get(result, "stockExchange") || Map.get(result, "exchange"),
      exchange_short: Map.get(result, "exchangeShortName") || Map.get(result, "exchange"),
      type: "ticker"
    }
  end

  # Remove nil and empty values from map
  defp remove_nil_values(map) do
    map
    |> Enum.reject(fn {_k, v} -> is_nil(v) or v == "" end)
    |> Enum.into(%{})
  end

  # Get API key from environment variable
  defp api_key do
    System.get_env("FMP_API_KEY") ||
      Application.get_env(:wealth_backend, :fmp_api)[:api_key] ||
      raise "FMP_API_KEY not configured. Please set FMP_API_KEY environment variable."
  end
end
