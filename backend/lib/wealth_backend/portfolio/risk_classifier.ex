defmodule WealthBackend.Portfolio.RiskClassifier do
  @moduledoc """
  Automatically determines risk class for assets based on:
  - Level 1: API data (ISIN/Ticker lookup for volatility)
  - Level 2: Asset type mapping
  """

  require Logger

  @type_risk_mapping %{
    "cash" => 1,
    "insurance" => 2,
    "security" => 3,
    "real_estate" => 3,
    "collectible" => 3,
    "commodity" => 4,
    "crypto" => 5,
    "other" => 3
  }

  @doc """
  Determines risk class for an asset.
  Returns {risk_class, source} tuple.
  """
  def determine_risk_class(asset_type_code, isin_or_symbol \\ nil) do
    # Level 1: Try API lookup if ISIN/symbol provided
    case fetch_risk_from_api(isin_or_symbol) do
      {:ok, risk_class} ->
        {risk_class, "auto_api"}

      {:error, _reason} ->
        # Level 2: Fallback to type mapping
        risk_class = Map.get(@type_risk_mapping, asset_type_code, 3)
        {risk_class, "auto_type"}
    end
  end

  # Fetches risk class from Yahoo Finance API based on volatility.
  # Maps volatility to 1-5 scale.
  defp fetch_risk_from_api(nil), do: {:error, :no_identifier}
  defp fetch_risk_from_api(""), do: {:error, :no_identifier}

  defp fetch_risk_from_api(identifier) do
    url = "https://query1.finance.yahoo.com/v8/finance/chart/#{identifier}?range=1y&interval=1d"

    case HTTPoison.get(url, [], timeout: 5000, recv_timeout: 5000) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        parse_yahoo_response(body)

      {:ok, %HTTPoison.Response{status_code: status}} ->
        Logger.debug("Yahoo Finance API returned status #{status} for #{identifier}")
        {:error, :api_error}

      {:error, %HTTPoison.Error{reason: reason}} ->
        Logger.debug("Yahoo Finance API error for #{identifier}: #{inspect(reason)}")
        {:error, :network_error}
    end
  end

  defp parse_yahoo_response(body) do
    case Jason.decode(body) do
      {:ok, %{"chart" => %{"result" => [result | _]}}} ->
        calculate_risk_from_volatility(result)

      _ ->
        {:error, :parse_error}
    end
  end

  defp calculate_risk_from_volatility(%{"indicators" => %{"quote" => [%{"close" => closes}]}}) when is_list(closes) do
    # Filter out nil values
    valid_closes = Enum.reject(closes, &is_nil/1)

    if length(valid_closes) < 20 do
      {:error, :insufficient_data}
    else
      # Calculate daily returns
      returns = Enum.zip(valid_closes, tl(valid_closes))
                |> Enum.map(fn {prev, curr} -> (curr - prev) / prev end)

      # Calculate standard deviation (volatility)
      mean = Enum.sum(returns) / length(returns)
      variance = Enum.map(returns, fn r -> :math.pow(r - mean, 2) end)
                 |> Enum.sum()
                 |> Kernel./(length(returns))
      volatility = :math.sqrt(variance)

      # Annualized volatility (approx 252 trading days)
      annualized_vol = volatility * :math.sqrt(252) * 100

      # Map volatility to risk class (1-5)
      risk_class = cond do
        annualized_vol < 5.0 -> 1   # Very low (e.g., money market)
        annualized_vol < 10.0 -> 2  # Low (e.g., bonds)
        annualized_vol < 20.0 -> 3  # Medium (e.g., diversified equity)
        annualized_vol < 35.0 -> 4  # High (e.g., single stocks)
        true -> 5                    # Very high (e.g., crypto, leveraged)
      end

      Logger.debug("Calculated annualized volatility: #{Float.round(annualized_vol, 2)}% -> Risk Class #{risk_class}")
      {:ok, risk_class}
    end
  end

  defp calculate_risk_from_volatility(_), do: {:error, :invalid_data}
end
