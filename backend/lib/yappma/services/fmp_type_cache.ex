defmodule Yappma.Services.FMPTypeCache do
  @moduledoc """
  Caches security types from FMP API lists in ETS for fast lookups.
  
  Loads the following lists at startup and refreshes weekly:
  - Cryptocurrency list (~5000 symbols)
  - Forex list (~1000 symbols)
  - Commodities list (~200 symbols)
  - Index list (~500 symbols)
  
  For other types (ETF, ETN, ETC, bonds, etc.), falls back to name-based heuristics.
  """
  
  use GenServer
  require Logger
  
  @base_url "https://financialmodelingprep.com/stable"
  @timeout 30_000
  @table_name :fmp_security_types
  
  # Client API
  
  def start_link(_opts) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end
  
  @doc """
  Looks up the security type for a given symbol.
  Returns {:ok, type} if found in cache, {:error, :not_found} otherwise.
  """
  def lookup_type(symbol) when is_binary(symbol) do
    case :ets.lookup(@table_name, symbol) do
      [{^symbol, type}] -> {:ok, type}
      [] -> {:error, :not_found}
    end
  end
  
  @doc """
  Manually triggers a refresh of the type cache.
  """
  def refresh do
    GenServer.cast(__MODULE__, :refresh)
  end
  
  @doc """
  Returns statistics about the cache.
  """
  def stats do
    GenServer.call(__MODULE__, :stats)
  end
  
  # Server Callbacks
  
  @impl true
  def init(_) do
    # Create ETS table
    :ets.new(@table_name, [:named_table, :public, :set, read_concurrency: true])
    
    # Load lists asynchronously to not block startup
    Task.start(fn -> load_all_lists() end)
    
    Logger.info("FMP Type Cache started")
    {:ok, %{last_refresh: nil, counts: %{}}}
  end
  
  @impl true
  def handle_cast(:refresh, state) do
    Logger.info("FMP Type Cache: Manual refresh triggered")
    load_all_lists()
    {:noreply, %{state | last_refresh: DateTime.utc_now()}}
  end
  
  @impl true
  def handle_call(:stats, _from, state) do
    crypto_count = count_by_type("crypto")
    forex_count = count_by_type("forex")
    commodity_count = count_by_type("commodity")
    index_count = count_by_type("index")
    total_count = :ets.info(@table_name, :size)
    
    stats = %{
      total: total_count,
      crypto: crypto_count,
      forex: forex_count,
      commodity: commodity_count,
      index: index_count,
      last_refresh: state.last_refresh
    }
    
    {:reply, stats, state}
  end
  
  # Private Functions
  
  defp load_all_lists do
    Logger.info("FMP Type Cache: Loading security type lists...")
    start_time = System.monotonic_time(:millisecond)
    
    results = [
      load_list("/cryptocurrency-list", "crypto"),
      load_list("/forex-list", "forex"),
      load_list("/commodities-list", "commodity"),
      load_list("/index-list", "index")
    ]
    
    duration = System.monotonic_time(:millisecond) - start_time
    
    success_count = Enum.count(results, fn {status, _} -> status == :ok end)
    total_symbols = Enum.reduce(results, 0, fn
      {:ok, count}, acc -> acc + count
      {:error, _}, acc -> acc
    end)
    
    Logger.info("FMP Type Cache: Loaded #{total_symbols} symbols from #{success_count}/4 lists in #{duration}ms")
  end
  
  defp load_list(path, type) do
    url = "#{@base_url}#{path}?apikey=#{api_key()}"
    
    Logger.debug("FMP Type Cache: Loading #{type} list from #{path}")
    
    case HTTPoison.get(url, [], timeout: @timeout, recv_timeout: @timeout) do
      {:ok, %{status_code: 200, body: body}} ->
        case Jason.decode(body) do
          {:ok, list} when is_list(list) ->
            count = insert_list(list, type)
            Logger.info("FMP Type Cache: Loaded #{count} #{type} symbols")
            {:ok, count}
          
          {:ok, _} ->
            Logger.warning("FMP Type Cache: Unexpected response format for #{type}")
            {:error, :invalid_format}
          
          {:error, reason} ->
            Logger.error("FMP Type Cache: Failed to decode #{type} list: #{inspect(reason)}")
            {:error, :decode_error}
        end
      
      {:ok, %{status_code: status}} ->
        Logger.error("FMP Type Cache: HTTP #{status} when loading #{type} list")
        {:error, {:http_error, status}}
      
      {:error, reason} ->
        Logger.error("FMP Type Cache: Request failed for #{type}: #{inspect(reason)}")
        {:error, :request_failed}
    end
  rescue
    e ->
      Logger.error("FMP Type Cache: Exception loading #{type}: #{Exception.message(e)}")
      {:error, :exception}
  end
  
  defp insert_list(items, type) do
    items
    |> Enum.filter(fn item -> is_map(item) and Map.has_key?(item, "symbol") end)
    |> Enum.each(fn item ->
      symbol = Map.get(item, "symbol")
      :ets.insert(@table_name, {symbol, type})
    end)
    |> length()
  end
  
  defp count_by_type(type) do
    :ets.select_count(@table_name, [{{:_, type}, [], [true]}])
  end
  
  defp api_key do
    System.get_env("FMP_API_KEY") ||
      Application.get_env(:wealth_backend, :fmp_api)[:api_key] ||
      raise "FMP_API_KEY not configured"
  end
end
