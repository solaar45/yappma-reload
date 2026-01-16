defmodule Yappma.Services.FMPTypeCacheScheduler do
  @moduledoc """
  Scheduler for periodic FMP Type Cache refresh.
  Refreshes the security type cache every 7 days.
  
  Manual refresh in IEx:
  ```
  Yappma.Services.FMPTypeCache.refresh()
  ```
  """
  
  use GenServer
  require Logger
  
  alias Yappma.Services.FMPTypeCache
  
  # Refresh every 7 days (in milliseconds)
  @refresh_interval :timer.hours(24 * 7)
  
  # Client API
  
  def start_link(_opts) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end
  
  # Server Callbacks
  
  @impl true
  def init(_) do
    # Schedule first refresh
    schedule_refresh()
    
    Logger.info("FMP Type Cache Scheduler started (refresh every 7 days)")
    {:ok, %{}}
  end
  
  @impl true
  def handle_info(:refresh, state) do
    Logger.info("FMP Type Cache Scheduler: Triggering weekly refresh")
    
    # Trigger cache refresh
    FMPTypeCache.refresh()
    
    # Schedule next refresh
    schedule_refresh()
    
    {:noreply, state}
  end
  
  # Private Functions
  
  defp schedule_refresh do
    Process.send_after(self(), :refresh, @refresh_interval)
  end
end
