defmodule Yappma.Services.FMPClient do
  @moduledoc """
  Client for Financial Modeling Prep API integration.
  Validates securities by ticker symbol or ISIN.
  """

  require Logger

  @base_url "https://financialmodelingprep.com/stable"

  @doc """
  Validates a ticker symbol against FMP API.
  Returns {:ok, security_data} if found, {:error, :not_found} otherwise.
  """
  def validate_ticker(ticker) when is_binary(ticker) do
    ticker = String.trim(ticker) |> String.upcase()
    url = "#{@base_url}/search-symbol?query=#{URI.encode(ticker)}&apikey=#{api_key()}"

    Logger.debug("FMP API: Validating ticker #{ticker}")

    case HTTPoison.get(url, [], timeout: 10_000, recv_timeout: 10_000) do
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
  Returns {:ok, security_data} if found, {:error, :not_found} otherwise.
  """
  def validate_isin(isin) when is_binary(isin) do
    isin = String.trim(isin) |> String.upcase()
    url = "#{@base_url}/search-isin?isin=#{URI.encode(isin)}&apikey=#{api_key()}"

    Logger.debug("FMP API: Validating ISIN #{isin}")

    case HTTPoison.get(url, [], timeout: 10_000, recv_timeout: 10_000) do
      {:ok, %{status_code: 200, body: body}} ->
        case Jason.decode(body) do
          {:ok, result} when is_map(result) and map_size(result) > 0 ->
            Logger.info("FMP API: ISIN #{isin} found")
            {:ok, format_isin_result(result)}

          {:ok, result} when is_map(result) ->
            Logger.info("FMP API: ISIN #{isin} not found (empty result)")
            {:error, :not_found}

          {:ok, _} ->
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
      name: Map.get(result, "companyName"),
      isin: Map.get(result, "isin"),
      type: "isin"
    }
  end

  # Get API key from application config
  defp api_key do
    Application.get_env(:wealth_backend, :fmp_api)[:api_key] ||
      System.get_env("FMP_API_KEY") ||
      raise "FMP_API_KEY not configured"
  end
end
