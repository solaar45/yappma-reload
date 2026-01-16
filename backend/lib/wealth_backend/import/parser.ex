defmodule WealthBackend.Import.Parser do
  @moduledoc """
  Handles parsing of CSV files for portfolio import.
  Automatically detects the format based on headers and delegates to specific adapters.
  """

  require Logger
  alias NimbleCSV.RFC4180, as: CSV

  # Define supported adapters
  @adapters [
    WealthBackend.Import.Adapters.ScalableCapital,
    WealthBackend.Import.Adapters.DKB
  ]

  @doc """
  Parses a CSV string and returns a list of standardized snapshot maps.
  
  Returns `{:ok, snapshots}` or `{:error, reason}`.
  """
  def parse(csv_content) when is_binary(csv_content) do
    # 1. Detect format
    case detect_adapter(csv_content) do
      {:ok, adapter} ->
        Logger.info("Detected import format: #{adapter.name()}")
        
        # 2. Parse using adapter
        try do
          # Special handling for DKB which has metadata lines before header
          # The adapter should ideally handle this, but NimbleCSV expects consistent columns
          # For DKB, we pass the raw content to the adapter's custom parser if it implements one,
          # or we clean it up here.
          
          # Since DKB adapter expects raw rows to extract metadata from first lines, 
          # we parse it without skipping headers initially.
          
          rows = 
            csv_content
            |> CSV.parse_string(skip_headers: false)
          
          # Skip empty lines if any
          rows = Enum.reject(rows, fn row -> row == [] end)

          # Delegate to adapter
          results = adapter.parse_rows(rows)
          {:ok, results}
        rescue
          e -> 
            Logger.error("CSV parsing failed: #{inspect(e)}")
            {:error, :parsing_failed}
        end

      {:error, reason} ->
        Logger.warning("Could not detect CSV format: #{inspect(reason)}")
        {:error, :unknown_format}
    end
  end

  defp detect_adapter(content) do
    # Get first few lines to check headers
    preview = String.split(content, "\n") |> Enum.take(15) |> Enum.join("\n")
    
    found = Enum.find(@adapters, fn adapter -> 
      adapter.matches?(preview)
    end)

    if found do
      {:ok, found}
    else
      {:error, :no_matching_adapter}
    end
  end
end
