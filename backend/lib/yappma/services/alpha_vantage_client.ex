defmodule Yappma.Services.AlphaVantageClient do
  @moduledoc """
  Client for Alpha Vantage API integration.
  Used specifically for fetching current market prices (Global Quote).
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

    # If no API key is configured, return error or mock?
    # For now, we'll log warning and error out, unless we want a dev fallback.
    if is_nil(api_key) or api_key == "" do
      Logger.warning("Alpha Vantage API key not configured.")
      {:error, :api_key_missing}
    else
      url = "#{@base_url}?function=GLOBAL_QUOTE&symbol=#{URI.encode(symbol)}&apikey=#{api_key}"
      
      case HTTPoison.get(url, [], timeout: @timeout) do
        {:ok, %{status_code: 200, body: body}} ->
          decode_response(body, symbol)
          
        {:ok, %{status_code: status}} ->
          Logger.error("Alpha Vantage API error: Status #{status}")
          {:error, :api_error}
          
        {:error, reason} ->
          Logger.error("Alpha Vantage network error: #{inspect(reason)}")
          {:error, :network_error}
      end
    end
  end

  defp decode_response(body, symbol) do
    case Jason.decode(body) do
      {:ok, %{"Global Quote" => quote_data}} when map_size(quote_data) > 0 ->
        # The key for price is "05. price"
        price = quote_data["05. price"]
        
        if price do
          {:ok, price}
        else
          Logger.warning("Alpha Vantage: No price found for #{symbol}")
          {:error, :no_price_data}
        end
        
      {:ok, %{"Note" => note}} ->
        # Usually rate limit message
        Logger.warning("Alpha Vantage rate limit: #{note}")
        {:error, :rate_limit}
        
      {:ok, %{"Error Message" => msg}} ->
        Logger.error("Alpha Vantage error for #{symbol}: #{msg}")
        {:error, :invalid_symbol}
        
      {:ok, _} ->
        # Empty Global Quote or other format
        Logger.warning("Alpha Vantage: Empty response for #{symbol}")
        {:error, :not_found}
        
      {:error, reason} ->
        Logger.error("Failed to decode Alpha Vantage response: #{inspect(reason)}")
        {:error, :decoding_error}
    end
  end

  defp get_api_key do
    key = Application.get_env(:wealth_backend, :alpha_vantage_api_key) || System.get_env("ALPHA_VANTAGE_API_KEY")

    if (is_nil(key) or key == "") and Mix.env() == :dev do
      # Fallback: try to read .env file directly (helper for hot reload)
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
