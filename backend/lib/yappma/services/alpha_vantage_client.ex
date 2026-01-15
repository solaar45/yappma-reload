defmodule Yappma.Services.AlphaVantageClient do
  @moduledoc """
  Client for Alpha Vantage API integration.
  Used for fetching market prices (Global Quote and Time Series).
  """

  require Logger

  @base_url "https://www.alphavantage.co/query"
  @timeout 10_000

  @doc """
  Fetches the global quote (current price info) for a given symbol.
  
  ## Parameters
  - symbol: The stock symbol (e.g., "AAPL", "IBM")
  
  ## Returns
  - `{:ok, price}` where price is a Decimal or float string
  - `{:error, reason}`
  """
  def get_quote(symbol) when is_binary(symbol) do
    symbol = String.trim(symbol) |> String.upcase()
    api_key = get_api_key()

    if is_nil(api_key) or api_key == "" do
      Logger.warning("Alpha Vantage API key not configured.")
      {:error, :api_key_missing}
    else
      url = "#{@base_url}?function=GLOBAL_QUOTE&symbol=#{URI.encode(symbol)}&apikey=#{api_key}"
      
      case HTTPoison.get(url, [], timeout: @timeout) do
        {:ok, %{status_code: 200, body: body}} ->
          decode_quote_response(body, symbol)
          
        {:ok, %{status_code: status}} ->
          Logger.error("Alpha Vantage API error: Status #{status}")
          {:error, :api_error}
          
        {:error, reason} ->
          Logger.error("Alpha Vantage network error: #{inspect(reason)}")
          {:error, :network_error}
      end
    end
  end

  @doc """
  Fetches the closing price for a specific date (or the most recent previous trading day).
  
  ## Parameters
  - symbol: The stock symbol (e.g. "AAPL")
  - date: The target date (Date struct or ISO string "YYYY-MM-DD")

  ## Returns
  - `{:ok, price}`
  - `{:error, reason}`
  """
  def get_historical_close(symbol, date) do
    symbol = String.trim(symbol) |> String.upcase()
    api_key = get_api_key()

    if is_nil(api_key) or api_key == "" do
      Logger.warning("Alpha Vantage API key not configured.")
      {:error, :api_key_missing}
    else
      # TIME_SERIES_DAILY returns the last 100 data points by default (compact)
      url = "#{@base_url}?function=TIME_SERIES_DAILY&symbol=#{URI.encode(symbol)}&apikey=#{api_key}"

      case HTTPoison.get(url, [], timeout: @timeout) do
        {:ok, %{status_code: 200, body: body}} ->
          decode_historical_response(body, symbol, date)

        {:ok, %{status_code: status}} ->
          Logger.error("Alpha Vantage API error: Status #{status}")
          {:error, :api_error}

        {:error, reason} ->
          Logger.error("Alpha Vantage network error: #{inspect(reason)}")
          {:error, :network_error}
      end
    end
  end

  # Helpers

  defp decode_quote_response(body, symbol) do
    case Jason.decode(body) do
      {:ok, %{"Global Quote" => quote_data}} when map_size(quote_data) > 0 ->
        price = quote_data["05. price"]
        if price, do: {:ok, price}, else: {:error, :no_price_data}
        
      {:ok, %{"Note" => note}} ->
        Logger.warning("Alpha Vantage rate limit: #{note}")
        {:error, :rate_limit}
        
      {:ok, %{"Error Message" => msg}} ->
        Logger.error("Alpha Vantage error for #{symbol}: #{msg}")
        {:error, :invalid_symbol}
        
      _ -> {:error, :not_found}
    end
  end

  defp decode_historical_response(body, symbol, target_date) do
    case Jason.decode(body) do
      {:ok, %{"Time Series (Daily)" => time_series}} ->
        find_price_for_date(time_series, target_date)

      {:ok, %{"Note" => note}} ->
        Logger.warning("Alpha Vantage rate limit: #{note}")
        {:error, :rate_limit}

      {:ok, %{"Error Message" => msg}} ->
        Logger.error("Alpha Vantage error for #{symbol}: #{msg}")
        {:error, :invalid_symbol}

      _ ->
        {:error, :not_found}
    end
  end

  defp find_price_for_date(time_series, target_date) do
    target_date_str = to_string(target_date)
    
    # Get all available dates, sorted descending (newest first)
    available_dates = Map.keys(time_series) |> Enum.sort(&(&1 >= &2))
    
    # Find the first date that is <= target_date
    match = Enum.find(available_dates, fn date_str -> 
      date_str <= target_date_str 
    end)

    case match do
      nil -> 
        Logger.warning("No historical data found for date #{target_date_str}")
        {:error, :no_data_for_date}
        
      found_date ->
        data = time_series[found_date]
        price = data["4. close"]
        {:ok, price}
    end
  end

  defp get_api_key do
    key = Application.get_env(:wealth_backend, :alpha_vantage_api_key) || System.get_env("ALPHA_VANTAGE_API_KEY")

    if (is_nil(key) or key == "") and Mix.env() == :dev do
      read_env_file("ALPHA_VANTAGE_API_KEY")
    else
      key
    end
  end

  defp read_env_file(target_key) do
    if File.exists?(".env") do
      File.stream!(".env")
      |> Stream.map(&String.trim/1)
      |> Enum.find_value(fn line ->
        case String.split(line, "=", parts: 2) do
          [key, val] ->
            clean_key = String.replace_prefix(key, "export ", "") |> String.trim()
            if clean_key == target_key do
               String.trim(val) |> String.replace(~r/^["']|["']$/, "")
            else
              nil
            end
          _ -> nil
        end
      end)
    end
  end
end
