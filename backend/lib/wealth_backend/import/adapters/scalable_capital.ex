defmodule WealthBackend.Import.Adapters.ScalableCapital do
  @moduledoc """
  CSV Adapter for Scalable Capital (Baader Bank) exports.
  """
  
  @behaviour WealthBackend.Import.AdapterBehavior

  def name, do: "Scalable Capital (Baader Bank)"

  def matches?(content) do
    # Check for typical Baader Bank CSV headers
    String.contains?(content, "ISIN") and 
    (String.contains?(content, "Baader Bank") or String.contains?(content, "Stück"))
  end

  def parse_rows(rows) do
    # Find header row index
    header_idx = Enum.find_index(rows, fn row -> 
      Enum.member?(row, "ISIN") and Enum.member?(row, "Stück") 
    end)

    if header_idx == nil do
      []
    else
      # Process data rows (after header)
      headers = Enum.at(rows, header_idx)
      data_rows = Enum.slice(rows, header_idx + 1, length(rows))

      # Map column names to indices
      isin_idx = Enum.find_index(headers, &(&1 == "ISIN"))
      qty_idx = Enum.find_index(headers, &(&1 == "Stück"))
      # Date often not in portfolio export, default to today
      
      data_rows
      |> Enum.map(fn row -> 
        extract_data(row, isin_idx, qty_idx)
      end)
      |> Enum.reject(&is_nil/1)
    end
  end

  defp extract_data(row, isin_idx, qty_idx) do
    try do
      isin = Enum.at(row, isin_idx)
      qty_str = Enum.at(row, qty_idx)
      
      if isin && qty_str do
        %{
          isin: String.trim(isin),
          quantity: parse_quantity(qty_str),
          date: Date.utc_today() # CSV exports often don't have "snapshot date", assume "now"
        }
      else
        nil
      end
    rescue
      _ -> nil
    end
  end

  defp parse_quantity(str) do
    # German format: 1.000,00 -> 1000.00
    str
    |> String.replace(".", "")
    |> String.replace(",", ".")
    |> String.to_float()
    |> Decimal.from_float()
  rescue
    _ -> 
      case Integer.parse(str) do
        {i, _} -> Decimal.new(i)
        _ -> Decimal.new(0)
      end
  end
end
