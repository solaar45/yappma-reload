defmodule WealthBackend.Portfolio.RiskClassifier do
  @moduledoc """
  Determines risk class for assets based on various data sources.
  
  Risk Classes:
  1 - Very Low Risk (cash, money market)
  2 - Low Risk (bonds, real estate)
  3 - Medium Risk (diversified stocks/ETFs)
  4 - High Risk (individual stocks, sector ETFs)
  5 - Very High Risk (crypto, commodities, derivatives)
  """

  require Logger

  @type_risk_mapping %{
    "cash" => 1,
    "security" => 3,
    "insurance" => 2,
    "real_estate" => 2,
    "loan" => 2,
    "crypto" => 5,
    "commodity" => 4,
    "collectible" => 4,
    "other" => 3
  }

  @doc """
  Determines risk class and source for an asset.
  Returns {risk_class, source} tuple.
  
  Sources:
  - "auto_api" - from Yahoo Finance volatility
  - "auto_type" - from asset type mapping
  - "manual" - manually set by user
  """
  def determine_risk_class(asset_type_code, identifier) when is_binary(identifier) do
    case fetch_volatility_based_risk(identifier) do
      {:ok, risk_class} -> 
        {risk_class, "auto_api"}
      {:error, _reason} -> 
        # Fall back to type-based classification
        {Map.get(@type_risk_mapping, asset_type_code, 3), "auto_type"}
    end
  end

  def determine_risk_class(asset_type_code, _identifier) do
    # No identifier provided, use type-based classification
    {Map.get(@type_risk_mapping, asset_type_code, 3), "auto_type"}
  end

  defp fetch_volatility_based_risk(identifier) do
    case fetch_yahoo_data(identifier) do
      {:ok, prices} when is_list(prices) and length(prices) > 1 ->
        volatility = calculate_annualized_volatility(prices)
        risk_class = volatility_to_risk_class(volatility)
        
        Logger.debug("Calculated annualized volatility: #{Float.round(volatility * 100, 2)}% -> Risk Class #{risk_class}")
        
        {:ok, risk_class}
        
      {:error, reason} ->
        Logger.debug("Failed to fetch volatility data: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp fetch_yahoo_data(identifier) do
    # Try to fetch 1 year of historical data
    end_date = Date.utc_today()
    start_date = Date.add(end_date, -365)
    
    url = "https://query1.finance.yahoo.com/v8/finance/chart/#{identifier}?period1=#{DateTime.to_unix(DateTime.new!(start_date, ~T[00:00:00]))}&period2=#{DateTime.to_unix(DateTime.new!(end_date, ~T[23:59:59]))}&interval=1d"
    
    case HTTPoison.get(url) do
      {:ok, %{status_code: 200, body: body}} ->
        parse_yahoo_response(body)
        
      {:ok, %{status_code: status}} ->
        {:error, "HTTP #{status}"}
        
      {:error, reason} ->
        {:error, reason}
    end
  end

  defp parse_yahoo_response(body) do
    case Jason.decode(body) do
      {:ok, %{"chart" => %{"result" => [result | _]}}} ->
        case get_in(result, ["indicators", "quote", Access.at(0), "close"]) do
          prices when is_list(prices) ->
            # Filter out nil values
            valid_prices = Enum.reject(prices, &is_nil/1)
            {:ok, valid_prices}
            
          _ ->
            {:error, "No price data found"}
        end
        
      {:ok, _} ->
        {:error, "Invalid response structure"}
        
      {:error, reason} ->
        {:error, reason}
    end
  end

  defp calculate_annualized_volatility(prices) do
    # Calculate daily returns
    returns = prices
    |> Enum.chunk_every(2, 1, :discard)
    |> Enum.map(fn [prev, curr] -> (curr - prev) / prev end)
    
    # Calculate standard deviation of returns
    mean = Enum.sum(returns) / length(returns)
    variance = returns
    |> Enum.map(fn r -> :math.pow(r - mean, 2) end)
    |> Enum.sum()
    |> Kernel./(length(returns))
    
    daily_volatility = :math.sqrt(variance)
    
    # Annualize volatility (assuming ~252 trading days per year)
    daily_volatility * :math.sqrt(252)
  end

  defp volatility_to_risk_class(volatility) do
    cond do
      volatility < 0.05 -> 1  # < 5% very low risk
      volatility < 0.10 -> 2  # 5-10% low risk
      volatility < 0.20 -> 3  # 10-20% medium risk
      volatility < 0.30 -> 4  # 20-30% high risk
      true -> 5               # > 30% very high risk
    end
  end
end
