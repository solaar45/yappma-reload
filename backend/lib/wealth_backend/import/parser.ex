defmodule WealthBackend.Import.Parser do
  @moduledoc """
  Handles parsing of CSV files for portfolio import.
  Automatically detects the format based on headers and delegates to specific adapters.
  """

  require Logger
  # Define standard CSV parser
  alias NimbleCSV.RFC4180, as: StandardCSV
  
  # Define Semicolon CSV parser for German formats (DKB, etc.)
  NimbleCSV.define(WealthBackend.Import.GermanCSV, separator: ";", escape: "\"")
  alias WealthBackend.Import.GermanCSV

  # Define supported adapters
  @adapters [
    WealthBackend.Import.Adapters.ScalableCapital,
    WealthBackend.Import.Adapters.DKB
  ]

  @doc """
  Parses a CSV string and returns a list of standardized snapshot maps.
  
  Returns `{:ok, snapshots}` or `{:error, reason}`.
  """
  def parse(raw_content) when is_binary(raw_content) do
    # 1. Ensure UTF-8 encoding (handle Windows-1252/ISO-8859-1 and BOMs)
    csv_content = ensure_utf8(raw_content)

    # 2. Detect format
    case detect_adapter(csv_content) do
      {:ok, adapter} ->
        Logger.info("Detected import format: #{adapter.name()}")
        
        # 3. Choose parser based on adapter preference
        parser = get_parser_for_adapter(adapter)
        
        try do
          # 4. Parse rows
          rows = 
            csv_content
            |> parser.parse_string(skip_headers: false)
          
          # Skip empty lines if any
          rows = Enum.reject(rows, fn row -> row == [] end)

          # 5. Delegate to adapter
          results = adapter.parse_rows(rows)
          {:ok, results}
        rescue
          e -> 
            Logger.error("CSV parsing failed: #{inspect(e)}")
            {:error, :parsing_failed}
        end

      {:error, reason} ->
        Logger.warning("Could not detect CSV format: #{inspect(reason)}")
        {:error, :no_matching_adapter}
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

  defp get_parser_for_adapter(adapter) do
    separator = 
      if function_exported?(adapter, :separator, 0) do
        adapter.separator()
      else
        ","
      end

    case separator do
      ";" -> GermanCSV
      _ -> StandardCSV
    end
  end

  # -- Encoding Helpers --

  defp ensure_utf8(<<0xFF, 0xFE, rest::binary>>) do
    # UTF-16 LE BOM
    :unicode.characters_to_binary(rest, {:utf16, :little}, :utf8)
  end

  defp ensure_utf8(<<0xFE, 0xFF, rest::binary>>) do
    # UTF-16 BE BOM
    :unicode.characters_to_binary(rest, {:utf16, :big}, :utf8)
  end

  defp ensure_utf8(<<0xEF, 0xBB, 0xBF, rest::binary>>) do
    # UTF-8 BOM - just strip it
    ensure_utf8(rest)
  end

  defp ensure_utf8(binary) do
    if String.valid?(binary) do
      binary
    else
      # Assume Windows-1252 (superset of ISO-8859-1) and convert to UTF-8 manually
      binary
      |> :binary.bin_to_list()
      |> Enum.map(&win1252_to_utf8/1)
      |> IO.iodata_to_binary()
    end
  end

  # Map common Windows-1252 bytes to UTF-8
  defp win1252_to_utf8(byte) when byte < 0x80, do: byte
  
  # Euro sign (0x80 in Win1252) -> U+20AC
  defp win1252_to_utf8(0x80), do: <<0xE2, 0x82, 0xAC>>
  
  # Quotes and other common Win1252 chars 0x80-0x9F (simplified)
  # Map 0x82 (‚) -> U+201A
  defp win1252_to_utf8(0x82), do: <<0xE2, 0x80, 0x9A>>
  # Map 0x84 („) -> U+201E
  defp win1252_to_utf8(0x84), do: <<0xE2, 0x80, 0x9E>>
  # Map 0x91 (‘) -> U+2018
  defp win1252_to_utf8(0x91), do: <<0xE2, 0x80, 0x98>>
  # Map 0x92 (’) -> U+2019
  defp win1252_to_utf8(0x92), do: <<0xE2, 0x80, 0x99>>
  # Map 0x93 (“) -> U+201C
  defp win1252_to_utf8(0x93), do: <<0xE2, 0x80, 0x9C>>
  # Map 0x94 (”) -> U+201D
  defp win1252_to_utf8(0x94), do: <<0xE2, 0x80, 0x9D>>

  # For 0xA0..0xFF, Windows-1252 maps directly to Unicode U+00A0..U+00FF
  # In UTF-8, these are 2-byte sequences: 0xC2/0xC3 + byte
  defp win1252_to_utf8(byte) when byte >= 0xA0 do
    <<byte::utf8>>
  end

  # Fallback for unhandled chars in 0x80-0x9F range -> Replace with ? or ignore
  defp win1252_to_utf8(_), do: "?"
end
