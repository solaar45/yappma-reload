defmodule Yappma.Services.FMPClient do
  @moduledoc """
  Client for Financial Modeling Prep API integration.
  Handles security validation and metadata enrichment via ticker or ISIN.
  
  Get your API key at: https://site.financialmodelingprep.com/
  Free tier: 250 API calls total
  
  API Documentation: https://site.financialmodelingprep.com/developer/docs/quickstart
  """

  require Logger

  # Updated base URLs according to FMP documentation
  @base_url "https://financialmodelingprep.com/stable"
  @api_v3 "https://financialmodelingprep.com/api/v3"
  @timeout 10_000
  @recv_timeout 10_000

  # ============================================================================
  # Public API - Validation
  # ============================================================================

  @doc """
  Validates a ticker symbol against FMP API.
  Uses /stable/search-name endpoint.
  Returns {:ok, security_data} if found, {:error, :not_found} otherwise.
  """
  def validate_ticker(ticker) when is_binary(ticker) do
    ticker = String.trim(ticker) |> String.upcase()
    url = "#{@base_url}/search-name?query=#{URI.encode(ticker)}&apikey=#{api_key()}"

    Logger.debug("FMP API: Validating ticker #{ticker}")

    case HTTPoison.get(url, [], timeout: @timeout, recv_timeout: @recv_timeout) do
      {:ok, %{status_code: 200, body: body}} ->
        case Jason.decode(body) do
          {:ok, [result | _]} ->
            Logger.info("FMP API: Ticker #{ticker} found")
            {:ok, format_ticker_result(result)}

          {:ok, []} ->
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
  Note: ISIN endpoint might not be available on free tier.
  Returns {:ok, security_data} if found, {:error, :not_found} otherwise.
  """
  def validate_isin(isin) when is_binary(isin) do
    isin = String.trim(isin) |> String.upcase()
    # Try search by ISIN in the general search first
    url = "#{@base_url}/search-name?query=#{URI.encode(isin)}&apikey=#{api_key()}"

    Logger.debug("FMP API: Validating ISIN #{isin}")

    case HTTPoison.get(url, [], timeout: @timeout, recv_timeout: @recv_timeout) do
      {:ok, %{status_code: 200, body: body}} ->
        case Jason.decode(body) do
          {:ok, [result | _]} when is_map(result) ->
            Logger.info("FMP API: ISIN #{isin} found")
            {:ok, format_isin_result(result)}

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
  Uses /api/v3/profile endpoint for detailed company data.
  Returns {:ok, enriched_data} with comprehensive metadata or error tuple.
  """
  def enrich_by_ticker(ticker) when is_binary(ticker) do
    ticker = String.trim(ticker) |> String.upcase()
    url = "#{@api_v3}/profile/#{URI.encode(ticker)}?apikey=#{api_key()}"

    Logger.info("FMP API: Enriching ticker #{ticker}")

    case HTTPoison.get(url, [], timeout: @timeout, recv_timeout: @recv_timeout) do
      {:ok, %{status_code: 200, body: body}} ->
        parse_enrichment_response(body, ticker)

      {:ok, %{status_code: 404}} ->
        Logger.info("FMP API: Ticker #{ticker} not found")
        {:error, :not_found}

      {:ok, %{status_code: status}} ->
        Logger.error("FMP API: Unexpected status code #{status} for ticker #{ticker}")
        {:error, :api_error}

      {:error, reason} ->
        Logger.error("FMP API: Request failed for ticker #{ticker}: #{inspect(reason)}")
        {:error, :network_error}
    end
  rescue
    e ->
      Logger.error("FMP API: Exception enriching ticker #{ticker}: #{inspect(e)}")
      {:error, :api_error}
  end

  @doc """
  Enriches security metadata by ISIN.
  First converts ISIN to ticker, then fetches full profile.
  Returns {:ok, enriched_data} with comprehensive metadata or error tuple.
  """
  def enrich_by_isin(isin) when is_binary(isin) do
    isin = String.trim(isin) |> String.upcase()
    Logger.info("FMP API: Enriching ISIN #{isin}")

    # Step 1: Convert ISIN to ticker
    case convert_isin_to_ticker(isin) do
      {:ok, ticker} ->
        # Step 2: Enrich by ticker
        case enrich_by_ticker(ticker) do
          {:ok, data} ->
            # Add ISIN to enriched data
            {:ok, Map.put(data, :isin, isin)}
          
          error ->
            error
        end

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
  # Private Functions
  # ============================================================================

  # Parse enrichment response from FMP profile endpoint
  defp parse_enrichment_response(body, ticker) do
    case Jason.decode(body) do
      {:ok, [data | _]} when is_map(data) ->
        extract_enriched_metadata(data, ticker)

      {:ok, []} ->
        Logger.warning("FMP API: Empty profile data for #{ticker}")
        {:error, :not_found}

      {:ok, data} when is_map(data) ->
        extract_enriched_metadata(data, ticker)

      {:error, reason} ->
        Logger.error("FMP API: Failed to parse enrichment response: #{inspect(reason)}")
        {:error, :parse_error}
    end
  end

  # Extract and format enriched metadata from FMP profile response
  defp extract_enriched_metadata(data, ticker) do
    metadata = %{
      ticker: Map.get(data, "symbol") || ticker,
      isin: Map.get(data, "isin"),
      name: Map.get(data, "companyName"),
      security_type: determine_security_type(data),
      exchange: Map.get(data, "exchange"),
      exchange_short: Map.get(data, "exchangeShortName"),
      currency: Map.get(data, "currency"),
      country: Map.get(data, "country"),
      country_of_domicile: Map.get(data, "country"),
      sector: Map.get(data, "sector"),
      industry: Map.get(data, "industry"),
      description: Map.get(data, "description"),
      website: Map.get(data, "website"),
      ceo: Map.get(data, "ceo"),
      market_cap: parse_number(Map.get(data, "mktCap")),
      employees: parse_integer(Map.get(data, "fullTimeEmployees")),
      ipo_date: Map.get(data, "ipoDate"),
      is_etf: Map.get(data, "isEtf"),
      is_actively_trading: Map.get(data, "isActivelyTrading")
    }
    |> remove_nil_values()

    if map_size(metadata) > 2 do
      Logger.info("FMP API: Successfully enriched #{ticker} with #{map_size(metadata)} fields")
      {:ok, metadata}
    else
      Logger.warning("FMP API: Insufficient data for #{ticker}")
      {:error, :insufficient_data}
    end
  rescue
    e ->
      Logger.error("FMP API: Error extracting metadata: #{Exception.message(e)}")
      {:error, :extraction_error}
  end

  # Determine security type from FMP data
  defp determine_security_type(data) do
    cond do
      Map.get(data, "isEtf") == true -> "etf"
      Map.get(data, "isAdr") == true -> "stock"
      Map.get(data, "isFund") == true -> "mutual_fund"
      true -> "stock"
    end
  end

  # Parse number from various formats
  defp parse_number(nil), do: nil
  defp parse_number(num) when is_number(num), do: num
  defp parse_number(str) when is_binary(str) do
    case Float.parse(str) do
      {num, _} -> num
      :error -> nil
    end
  end
  defp parse_number(_), do: nil

  # Parse integer from various formats
  defp parse_integer(nil), do: nil
  defp parse_integer(num) when is_integer(num), do: num
  defp parse_integer(str) when is_binary(str) do
    case Integer.parse(str) do
      {num, _} -> num
      :error -> nil
    end
  end
  defp parse_integer(_), do: nil

  # Format ticker search result
  defp format_ticker_result(result) do
    %{
      symbol: Map.get(result, "symbol"),
      name: Map.get(result, "name"),
      currency: Map.get(result, "currency"),
      exchange: Map.get(result, "stockExchange"),
      exchange_short: Map.get(result, "exchangeShortName"),
      type: "ticker"
    }
  end

  # Format ISIN search result
  defp format_isin_result(result) do
    %{
      symbol: Map.get(result, "symbol"),
      name: Map.get(result, "name"),
      isin: Map.get(result, "isin"),
      type: "isin"
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
