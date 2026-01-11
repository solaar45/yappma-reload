defmodule WealthBackend.Portfolio.MetadataEnricher do
  @moduledoc """
  Service for enriching security assets with metadata from Financial Modeling Prep API.
  Supports ISIN, WKN, and ticker symbol lookups.
  
  Provider:
  - Financial Modeling Prep (FMP) - requires API key from .env
  
  Configuration:
  Set FMP_API_KEY in your .env file or environment variables.
  Free tier: 250 API calls total
  Get your key at: https://site.financialmodelingprep.com/
  """

  require Logger

  alias Yappma.Services.FMPClient

  @doc """
  Enriches security metadata based on identifier (ISIN, WKN, or ticker).
  Returns {:ok, metadata_map} with enriched fields or {:error, reason}.
  
  ## Parameters
  - identifier: String - The security identifier (ISIN, WKN, or ticker)
  - type: Atom - :auto (default), :isin, :wkn, or :ticker
  
  ## Returns
  - {:ok, %{ticker: ..., name: ..., ...}} on success
  - {:error, :not_found} if security not found
  - {:error, :conversion_not_supported} for WKN (not yet implemented)
  - {:error, reason} for other errors
  
  ## Examples
      iex> MetadataEnricher.enrich("AAPL", :ticker)
      {:ok, %{ticker: "AAPL", name: "Apple Inc.", ...}}
      
      iex> MetadataEnricher.enrich("US0378331005", :isin)
      {:ok, %{ticker: "AAPL", isin: "US0378331005", ...}}
      
      iex> MetadataEnricher.enrich("VWCE")
      {:ok, %{ticker: "VWCE", name: "Vanguard FTSE All-World...", ...}}
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

  @doc """
  Enriches security by ISIN using FMP API.
  First converts ISIN to ticker, then fetches full profile.
  """
  def enrich_by_isin(isin) when is_binary(isin) do
    Logger.info("Enriching security by ISIN: #{isin}")
    
    case FMPClient.enrich_by_isin(isin) do
      {:ok, metadata} ->
        Logger.info("Successfully enriched ISIN #{isin}: ticker=#{metadata[:ticker]}")
        {:ok, metadata}
      
      {:error, :not_found} ->
        Logger.warning("ISIN #{isin} not found in FMP database")
        {:error, :not_found}
      
      {:error, reason} = error ->
        Logger.error("Failed to enrich ISIN #{isin}: #{inspect(reason)}")
        error
    end
  end

  @doc """
  Enriches security by WKN (German Securities Code).
  Currently not supported - WKN to ticker conversion not available in FMP.
  """
  def enrich_by_wkn(wkn) when is_binary(wkn) do
    Logger.info("Enriching security by WKN: #{wkn}")
    Logger.warning("WKN to ticker conversion not yet implemented")
    {:error, :conversion_not_supported}
  end

  @doc """
  Enriches security by ticker symbol using FMP API.
  Fetches comprehensive company/fund profile data.
  """
  def enrich_by_ticker(ticker) when is_binary(ticker) do
    Logger.info("Enriching security by ticker: #{ticker}")
    ticker = String.upcase(String.trim(ticker))
    
    case FMPClient.enrich_by_ticker(ticker) do
      {:ok, metadata} ->
        Logger.info("Successfully enriched ticker #{ticker}: #{metadata[:name]}")
        {:ok, metadata}
      
      {:error, :not_found} ->
        Logger.warning("Ticker #{ticker} not found in FMP database")
        {:error, :not_found}
      
      {:error, reason} = error ->
        Logger.error("Failed to enrich ticker #{ticker}: #{inspect(reason)}")
        error
    end
  end

  # ============================================================================
  # Private Helper Functions
  # ============================================================================

  # Check if string is a valid ISIN format
  # ISIN: 12 characters, starts with 2-letter country code, ends with check digit
  # Example: US0378331005 (Apple), IE00B4L5Y983 (iShares Core MSCI World)
  defp is_isin?(str) when is_binary(str) do
    str = String.trim(str)
    String.length(str) == 12 and String.match?(str, ~r/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/)
  end
  defp is_isin?(_), do: false

  # Check if string is a valid WKN format
  # WKN: 6 alphanumeric characters (German securities identification)
  # Example: 865985 (Apple), A0RPWH (iShares Core MSCI World)
  defp is_wkn?(str) when is_binary(str) do
    str = String.trim(str)
    String.length(str) == 6 and String.match?(str, ~r/^[A-Z0-9]{6}$/)
  end
  defp is_wkn?(_), do: false
end
