defmodule WealthBackend.Portfolio.MetadataEnricher do
  @moduledoc """
  Service for enriching security assets with metadata from external APIs.
  Supports ISIN, WKN, and ticker symbol lookups.
  """

  require Logger

  @yahoo_finance_base "https://query2.finance.yahoo.com/v10/finance/quoteSummary/"
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
    url = "#{@yahoo_finance_base}#{ticker}?modules=summaryDetail,assetProfile,quoteType,fundProfile"
    headers = [
      {"User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
      {"Accept", "application/json"}
    ]
    
    Logger.info("Fetching data from Yahoo Finance for: #{ticker}")
    
    case HTTPoison.get(url, headers, timeout: @timeout, recv_timeout: @recv_timeout) do
      {:ok, %{status_code: 200, body: body}} ->
        Logger.debug("Received successful response from Yahoo Finance")
        parse_yahoo_response(body, ticker)
      
      {:ok, %{status_code: 404}} ->
        Logger.warning("Yahoo Finance returned 404 for ticker: #{ticker}")
        {:error, :not_found}
      
      {:ok, %{status_code: status, body: body}} ->
        Logger.warning("Yahoo Finance API returned status #{status} for ticker #{ticker}: #{body}")
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

  defp parse_yahoo_response(body, ticker) do
    case Jason.decode(body) do
      {:ok, %{"quoteSummary" => %{"result" => [data | _]}}} when data != nil ->
        Logger.debug("Successfully parsed Yahoo Finance response")
        extract_metadata(data, ticker)
      
      {:ok, %{"quoteSummary" => %{"result" => nil}}} ->
        Logger.warning("Yahoo Finance returned null result for ticker: #{ticker}")
        {:error, :not_found}
      
      {:ok, %{"quoteSummary" => %{"error" => error}}} ->
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

  defp extract_metadata(data, ticker) do
    quote_type = get_in(data, ["quoteType"]) || %{}
    summary = get_in(data, ["summaryDetail"]) || %{}
    profile = get_in(data, ["assetProfile"]) || %{}
    fund_profile = get_in(data, ["fundProfile"]) || %{}

    metadata = %{
      ticker: get_in(quote_type, ["symbol"]) || ticker,
      name: get_in(quote_type, ["longName"]) || get_in(quote_type, ["shortName"]),
      security_type: determine_security_type(quote_type),
      exchange: get_in(quote_type, ["exchange"]),
      currency: get_in(summary, ["currency"]),
      sector: get_in(profile, ["sector"]),
      country_of_domicile: get_in(profile, ["country"]),
      expense_ratio: extract_expense_ratio(fund_profile),
      distribution_type: extract_distribution_type(fund_profile),
      benchmark_index: get_in(fund_profile, ["categoryName"])
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

  defp determine_security_type(%{"quoteType" => type}) when is_binary(type) do
    case String.upcase(type) do
      "EQUITY" -> "stock"
      "ETF" -> "etf"
      "MUTUALFUND" -> "mutual_fund"
      "INDEX" -> "index_fund"
      _ -> nil
    end
  end
  defp determine_security_type(_), do: nil

  defp extract_expense_ratio(%{"annualReportExpenseRatio" => ratio}) when is_number(ratio) do
    # Yahoo returns as decimal (e.g., 0.0045 for 0.45%)
    # Convert to percentage string
    Float.to_string(ratio * 100)
  end
  defp extract_expense_ratio(_), do: nil

  defp extract_distribution_type(%{"legalType" => type}) when is_binary(type) do
    type_lower = String.downcase(type)
    
    cond do
      String.contains?(type_lower, "accumulating") -> "accumulating"
      String.contains?(type_lower, "distributing") -> "distributing"
      true -> nil
    end
  end
  defp extract_distribution_type(_), do: nil

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
