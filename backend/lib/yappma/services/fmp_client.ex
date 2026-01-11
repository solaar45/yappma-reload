defmodule Yappma.Services.FMPClient do
  @moduledoc """
  Client for Financial Modeling Prep API integration.
  Handles security validation and metadata enrichment via ticker, ISIN, or company name.
  
  Get your API key at: https://site.financialmodelingprep.com/
  Free tier: 250 API calls total
  
  API Documentation: https://site.financialmodelingprep.com/developer/docs/quickstart
  
  Note: Only /stable endpoints are used as /api/v3 is legacy-only since Aug 2025.
  
  Available Search Methods:
  - /stable/search-symbol - Search by ticker symbol (exact matches)
  - /stable/search-name - Search by company name (fuzzy matches)
  - ISIN detection via pattern matching
  """

  require Logger

  # Only use /stable endpoints - /api/v3 is legacy-only
  @base_url "https://financialmodelingprep.com/stable"
  @timeout 10_000
  @recv_timeout 10_000

  # ============================================================================
  # Public API - Universal Search (NEW)
  # ============================================================================

  @doc """
  Universal search for securities by ticker, company name, or ISIN.
  Searches all three methods in parallel and returns merged, deduplicated results.
  
  ## Parameters
  - query: String - ticker symbol, company name, or ISIN
  - limit: Integer - max results to return (default: 10)
  
  ## Returns
  {:ok, [%{ticker: ..., name: ..., currency: ..., exchange: ..., type: ...}, ...]}
  {:error, reason}
  
  ## Examples
      iex> FMPClient.search_securities("MSFT")
      {:ok, [
        %{ticker: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", ...},
        %{ticker: "MSFO", name: "YieldMax MSFT ETF", exchange: "AMEX", ...}
      ]}
      
      iex> FMPClient.search_securities("Microsoft")
      {:ok, [
        %{ticker: "MSFT", name: "Microsoft Corporation", ...},
        %{ticker: "MSFT.NE", name: "Microsoft Corporation", exchange: "NEO", ...}
      ]}
      
      iex> FMPClient.search_securities("US5949181045")  # MSFT ISIN
      {:ok, [%{ticker: "MSFT", name: "Microsoft Corporation", isin: "US5949181045", ...}]}
  """
  def search_securities(query, limit \\ 10) when is_binary(query) do
    query = String.trim(query)
    
    cond do
      # Empty query
      String.length(query) == 0 ->
        {:ok, []}
      
      # ISIN: 12 characters, starts with 2 letters (country code)
      is_isin?(query) ->
        Logger.info("FMP API: Searching by ISIN: #{query}")
        search_by_isin(query, limit)
      
      # Otherwise: Search both ticker and company name
      true ->
        Logger.info("FMP API: Universal search for: #{query}")
        search_ticker_and_name(query, limit)
    end
  end

  # ============================================================================
  # Public API - Validation
  # ============================================================================

  @doc """
  Validates a ticker symbol against FMP API.
  Uses /stable/search-symbol endpoint for exact ticker matching.
  Returns {:ok, security_data} if found, {:error, :not_found} otherwise.
  """
  def validate_ticker(ticker) when is_binary(ticker) do
    ticker = String.trim(ticker) |> String.upcase()
    url = "#{@base_url}/search-symbol?query=#{URI.encode(ticker)}&limit=10&apikey=#{api_key()}"

    Logger.debug("FMP API: Validating ticker #{ticker}")

    case HTTPoison.get(url, [], timeout: @timeout, recv_timeout: @recv_timeout) do
      {:ok, %{status_code: 200, body: body}} ->
        case Jason.decode(body) do
          {:ok, results} when is_list(results) ->
            # Filter for exact ticker match
            case find_exact_ticker_match(results, ticker) do
              {:ok, result} ->
                Logger.info("FMP API: Ticker #{ticker} found")
                {:ok, format_search_result(result)}
              
              :error ->
                Logger.info("FMP API: Ticker #{ticker} not found (no exact match)")
                {:error, :not_found}
            end

          {:ok, _} ->
            Logger.info("FMP API: Ticker #{ticker} not found")
            {:error, :not_found}

          {:error, reason} ->
            Logger.error("FMP API: Failed to decode ticker response: #{inspect(reason)}")
            {:error, :invalid_response}
        end

      {:ok, %{status_code: status}} ->
        Logger.error("FMP API: Unexpected status code #{status} for ticker #{ticker}")
        {:error, :api_error}

      {:error, reason} ->
        Logger.error("FMP API: Request failed for ticker #{ticker}: #{inspect(reason)}")
        {:error, :api_error}
    end
  end

  @doc """
  Validates an ISIN against FMP API.
  Uses general search endpoint as ISIN-specific endpoint is not available.
  Returns {:ok, security_data} if found, {:error, :not_found} otherwise.
  """
  def validate_isin(isin) when is_binary(isin) do
    isin = String.trim(isin) |> String.upcase()
    
    case search_by_isin(isin, 1) do
      {:ok, [result | _]} ->
        Logger.info("FMP API: ISIN #{isin} found")
        {:ok, format_search_result(result)}
      
      {:ok, []} ->
        Logger.info("FMP API: ISIN #{isin} not found")
        {:error, :not_found}
      
      {:error, reason} ->
        {:error, reason}
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
      is_isin?(identifier) ->
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
  Uses /stable/search-symbol for exact ticker matching.
  Returns {:ok, enriched_data} with available metadata or error tuple.
  """
  def enrich_by_ticker(ticker) when is_binary(ticker) do
    ticker = String.trim(ticker) |> String.upcase()
    Logger.info("FMP API: Enriching ticker #{ticker}")
    
    url = "#{@base_url}/search-symbol?query=#{URI.encode(ticker)}&limit=10&apikey=#{api_key()}"

    case HTTPoison.get(url, [], timeout: @timeout, recv_timeout: @recv_timeout) do
      {:ok, %{status_code: 200, body: body}} ->
        case Jason.decode(body) do
          {:ok, results} when is_list(results) ->
            case find_exact_ticker_match(results, ticker) do
              {:ok, match} ->
                extract_enriched_metadata(match, ticker)
              
              :error ->
                Logger.info("FMP API: Ticker #{ticker} not found")
                {:error, :not_found}
            end
          
          {:ok, _} ->
            {:error, :not_found}
          
          {:error, reason} ->
            Logger.error("FMP API: Failed to parse response: #{inspect(reason)}")
            {:error, :parse_error}
        end

      {:ok, %{status_code: 404}} ->
        Logger.info("FMP API: Ticker #{ticker} not found")
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
      Logger.error("FMP API: Exception enriching ticker #{ticker}: #{inspect(e)}")
      {:error, :api_error}
  end

  @doc """
  Enriches security metadata by ISIN.
  Searches for ISIN, then returns available data.
  Returns {:ok, enriched_data} with available metadata or error tuple.
  """
  def enrich_by_isin(isin) when is_binary(isin) do
    isin = String.trim(isin) |> String.upcase()
    Logger.info("FMP API: Enriching ISIN #{isin}")

    case search_by_isin(isin, 1) do
      {:ok, [result | _]} ->
        case extract_enriched_metadata(result, isin) do
          {:ok, data} ->
            # Add ISIN to enriched data
            {:ok, Map.put(data, :isin, isin)}
          
          error ->
            error
        end
      
      {:ok, []} ->
        {:error, :not_found}
      
      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Converts ISIN to ticker symbol using FMP search endpoint.
  Returns {:ok, ticker} or error tuple.
  """
  def convert_isin_to_ticker(isin) when is_binary(isin) do
    case search_by_isin(isin, 1) do
      {:ok, [%{ticker: ticker} | _]} when is_binary(ticker) ->
        Logger.info("FMP API: Converted ISIN #{isin} to ticker #{ticker}")
        {:ok, ticker}
      
      {:ok, []} ->
        Logger.info("FMP API: ISIN #{isin} not found")
        {:error, :not_found}
      
      {:error, reason} ->
        {:error, reason}
    end
  end

  # ============================================================================
  # Private Functions - Search Logic
  # ============================================================================

  # Search by ticker symbol AND company name, merge results
  defp search_ticker_and_name(query, limit) do
    # Run both searches in parallel
    tasks = [
      Task.async(fn -> search_by_ticker_symbol(query, limit) end),
      Task.async(fn -> search_by_company_name(query, limit) end)
    ]
    
    results = Task.await_many(tasks, @timeout)
    
    # Merge and deduplicate results
    merged = results
    |> Enum.flat_map(fn
      {:ok, list} -> list
      {:error, _} -> []
    end)
    |> deduplicate_by_ticker()
    |> Enum.take(limit)
    
    {:ok, merged}
  rescue
    e ->
      Logger.error("FMP API: Error in parallel search: #{inspect(e)}")
      {:error, :search_failed}
  end

  # Search by ticker symbol using /stable/search-symbol
  defp search_by_ticker_symbol(query, limit) do
    url = "#{@base_url}/search-symbol?query=#{URI.encode(query)}&limit=#{limit}&apikey=#{api_key()}"
    Logger.debug("FMP API: Searching ticker symbol: #{query}")
    
    case HTTPoison.get(url, [], timeout: @timeout, recv_timeout: @recv_timeout) do
      {:ok, %{status_code: 200, body: body}} ->
        case Jason.decode(body) do
          {:ok, results} when is_list(results) ->
            formatted = Enum.map(results, &format_search_result/1)
            Logger.debug("FMP API: Found #{length(formatted)} ticker matches")
            {:ok, formatted}
          
          _ ->
            {:ok, []}
        end
      
      _ ->
        {:ok, []}
    end
  end

  # Search by company name using /stable/search-name
  defp search_by_company_name(query, limit) do
    url = "#{@base_url}/search-name?query=#{URI.encode(query)}&limit=#{limit}&apikey=#{api_key()}"
    Logger.debug("FMP API: Searching company name: #{query}")
    
    case HTTPoison.get(url, [], timeout: @timeout, recv_timeout: @recv_timeout) do
      {:ok, %{status_code: 200, body: body}} ->
        case Jason.decode(body) do
          {:ok, results} when is_list(results) ->
            formatted = Enum.map(results, &format_search_result/1)
            Logger.debug("FMP API: Found #{length(formatted)} name matches")
            {:ok, formatted}
          
          _ ->
            {:ok, []}
        end
      
      _ ->
        {:ok, []}
    end
  end

  # Search by ISIN - searches both endpoints for ISIN pattern
  defp search_by_isin(isin, limit) do
    isin_upper = String.upcase(isin)
    
    # Try both endpoints - ISINs might appear in either
    tasks = [
      Task.async(fn -> search_by_ticker_symbol(isin_upper, limit) end),
      Task.async(fn -> search_by_company_name(isin_upper, limit) end)
    ]
    
    results = Task.await_many(tasks, @timeout)
    
    merged = results
    |> Enum.flat_map(fn
      {:ok, list} -> list
      {:error, _} -> []
    end)
    |> deduplicate_by_ticker()
    |> Enum.map(fn result -> Map.put(result, :isin, isin_upper) end)
    |> Enum.take(limit)
    
    {:ok, merged}
  rescue
    e ->
      Logger.error("FMP API: Error searching ISIN: #{inspect(e)}")
      {:error, :search_failed}
  end

  # Check if string is an ISIN (12 chars, starts with 2-letter country code)
  defp is_isin?(str) do
    String.length(str) == 12 and String.match?(str, ~r/^[A-Z]{2}[A-Z0-9]{10}$/i)
  end

  # Deduplicate results by ticker symbol (keep first occurrence)
  defp deduplicate_by_ticker(results) do
    results
    |> Enum.uniq_by(fn result -> Map.get(result, :ticker) end)
  end

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

  # ============================================================================
  # Private Functions - Data Processing
  # ============================================================================

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

  # Determine security type from FMP data
  defp determine_security_type(data) do
    symbol = Map.get(data, "symbol", "")
    name = Map.get(data, "name", "")
    
    cond do
      String.contains?(String.downcase(name), "etf") -> "etf"
      String.contains?(symbol, ".") -> "etf"
      true -> "stock"
    end
  end

  # Format search result to unified structure
  defp format_search_result(result) when is_map(result) do
    %{
      ticker: Map.get(result, "symbol"),
      name: Map.get(result, "name"),
      currency: Map.get(result, "currency"),
      exchange: Map.get(result, "stockExchange") || Map.get(result, "exchange"),
      exchange_short: Map.get(result, "exchangeShortName") || Map.get(result, "exchange"),
      type: determine_security_type(result)
    }
    |> remove_nil_values()
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
