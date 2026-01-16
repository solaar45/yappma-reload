defmodule WealthBackend.Import.Parser do
  @moduledoc """
  Handles parsing of CSV files for portfolio import.
  Automatically detects the format based on headers and delegates to specific adapters.
  """

  require Logger
  alias NimbleCSV.RFC4180, as: CSV

  # Define supported adapters
  @adapters [
    WealthBackend.Import.Adapters.ScalableCapital
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
    preview = String.split(content, "\n") |> Enum.take(5) |> Enum.join("\n")
    
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
