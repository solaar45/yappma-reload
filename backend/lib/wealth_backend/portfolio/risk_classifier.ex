defmodule WealthBackend.Portfolio.RiskClassifier do
  @moduledoc """
  Determines risk class for assets based on various data sources.
  
  Risk Classes:
  1 - Very Low Risk (cash, money market)
  2 - Low Risk (bonds, real estate)
  3 - Medium Risk (diversified stocks/ETFs)
  4 - High Risk (individual stocks, sector ETFs)
  5 - Very High Risk (crypto, commodities, derivatives)
  
  ## Volatility Calculation
  
  Uses logarithmic returns (financial standard) and Bessel correction for unbiased variance.
  Annualized volatility is calculated based on trading days:
  - 252 days for traditional securities (stocks, ETFs, bonds)
  - 365 days for crypto assets (24/7 trading)
  
  Thresholds are aligned with EU SRRI (Synthetic Risk and Reward Indicator) standards.
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

  # Trading days per year for annualization
  @trading_days_traditional 252  # Stocks, bonds, ETFs
  @trading_days_crypto 365       # Crypto trades 24/7

  @doc """
  Determines risk class and source for an asset.
  Returns {risk_class, source} tuple.
  
  Sources:
  - "auto_api" - from Yahoo Finance volatility
  - "auto_type" - from asset type mapping
  - "manual" - manually set by user
  """
  def determine_risk_class(asset_type_code, identifier) when is_binary(identifier) do
    trading_days = get_trading_days(asset_type_code)
    
    case fetch_volatility_based_risk(identifier, trading_days) do
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

  defp get_trading_days("crypto"), do: @trading_days_crypto
  defp get_trading_days(_), do: @trading_days_traditional

  defp fetch_volatility_based_risk(identifier, trading_days) do
    case fetch_yahoo_data(identifier) do
      {:ok, prices} when is_list(prices) and length(prices) > 30 ->
        volatility = calculate_annualized_volatility(prices, trading_days)
        risk_class = volatility_to_risk_class(volatility)
        
        Logger.debug("Calculated annualized volatility for #{identifier}: #{Float.round(volatility * 100, 2)}% -> Risk Class #{risk_class}")
        
        {:ok, risk_class}
        
      {:ok, prices} when is_list(prices) ->
        {:error, "Insufficient data points: #{length(prices)} (minimum 30 required)"}
        
      {:error, reason} ->
        Logger.debug("Failed to fetch volatility data for #{identifier}: #{inspect(reason)}")
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
            # Filter out nil values and ensure we have numbers
            valid_prices = prices
            |> Enum.reject(&is_nil/1)
            |> Enum.filter(fn price -> is_number(price) and price > 0 end)
            
            if length(valid_prices) > 0 do
              {:ok, valid_prices}
            else
              {:error, "No valid price data found"}
            end
            
          _ ->
            {:error, "No price data found"}
        end
        
      {:ok, _} ->
        {:error, "Invalid response structure"}
        
      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Calculates annualized volatility using financial best practices:
  
  1. Logarithmic returns (log-normal distribution assumption)
  2. Bessel correction (n-1) for unbiased sample variance
  3. Annualization via square root of time scaling
  
  ## Parameters
  
  - `prices`: List of historical closing prices
  - `trading_days`: Number of trading days per year (252 for stocks, 365 for crypto)
  
  ## Returns
  
  Annualized volatility as a decimal (e.g., 0.18 = 18% annual volatility)
  """
  def calculate_annualized_volatility(prices, trading_days \\ @trading_days_traditional) do
    # 1. Calculate logarithmic returns (financial standard)
    # Log-returns are time-additive and handle asymmetric price movements correctly
    returns = prices
    |> Enum.chunk_every(2, 1, :discard)
    |> Enum.map(fn [prev, curr] -> 
      if prev > 0 and curr > 0 do
        :math.log(curr / prev)
      else
        0.0
      end
    end)
    |> Enum.reject(&(&1 == 0.0))  # Remove invalid returns

    count = length(returns)
    
    if count < 2 do
      # Not enough data points
      0.0
    else
      # 2. Calculate mean return
      mean = Enum.sum(returns) / count
      
      # 3. Calculate variance with Bessel correction (n-1)
      # Unbiased estimator for sample variance
      variance = returns
      |> Enum.map(fn r -> :math.pow(r - mean, 2) end)
      |> Enum.sum()
      |> Kernel./(count - 1)  # Bessel correction: divide by (n-1) instead of n
      
      # 4. Daily volatility (standard deviation)
      daily_volatility = :math.sqrt(variance)

      # 5. Annualization: volatility scales with square root of time
      # √252 for stocks (~15.87), √365 for crypto (~19.10)
      daily_volatility * :math.sqrt(trading_days)
    end
  end

  @doc """
  Maps annualized volatility to risk classes aligned with EU SRRI standards.
  
  Risk Class 1: < 5%  (Money market funds, very stable bonds)
  Risk Class 2: < 12% (Government bonds, defensive equity funds)
  Risk Class 3: < 20% (Balanced funds, global equity ETFs like MSCI World)
  Risk Class 4: < 35% (Individual stocks, sector funds, emerging markets)
  Risk Class 5: ≥ 35% (Crypto, leveraged products, highly volatile assets)
  
  Note: MSCI World ETFs typically show 12-18% annualized volatility → Risk Class 3
  """
  defp volatility_to_risk_class(volatility) do
    cond do
      volatility < 0.05 -> 1  # < 5% - Very low risk
      volatility < 0.12 -> 2  # 5-12% - Low risk
      volatility < 0.20 -> 3  # 12-20% - Medium risk (typical for diversified equity)
      volatility < 0.35 -> 4  # 20-35% - High risk
      true -> 5               # ≥ 35% - Very high risk
    end
  end
end
