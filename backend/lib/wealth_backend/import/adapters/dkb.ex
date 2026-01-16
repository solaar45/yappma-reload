defmodule WealthBackend.Import.Adapters.DKB do
  @moduledoc """
  Adapter for importing DKB CSV files (Girokonto).
  Calculates historical balances based on current balance and transactions.
  """
  
  require Logger

  @behaviour WealthBackend.Import.AdapterBehavior

  @impl true
  def name, do: "DKB Girokonto"

  # Define separator for German CSV
  def separator, do: ";"

  @impl true
  def matches?(content) do
    # Check for typical DKB header lines
    # DKB exports can be slightly different, so we check loosely
    String.contains?(content, "Kontostand vom") && 
    String.contains?(content, "Buchungsdatum") && 
    String.contains?(content, "Wertstellung")
  end

  @impl true
  def parse_rows(rows) do
    # 1. Extract current balance and date from metadata (first few rows)
    {current_balance, balance_date} = extract_balance_info(rows)

    # 2. Extract transactions (skip header rows)
    transactions = extract_transactions(rows)

    # 3. Calculate daily balances
    calculate_daily_snapshots(current_balance, balance_date, transactions)
  end

  defp extract_balance_info(rows) do
    # Find row with "Kontostand vom"
    # Expected format: ["Kontostand vom 16.01.2026:", "50.934,67 €", ...]
    # Or in GermanCSV parsed format, it should be in columns
    
    balance_row = Enum.find(rows, fn row -> 
      List.first(row) |> to_string() |> String.contains?("Kontostand vom") 
    end)

    if balance_row do
      # Parse date from first column "Kontostand vom DD.MM.YYYY:"
      date_str = List.first(balance_row) 
                 |> String.replace("Kontostand vom ", "") 
                 |> String.replace(":", "")
                 |> String.trim()
      
      # Parse amount from second column "50.934,67 €"
      # If NimbleCSV parsed with semicolon, amount should be in index 1
      amount_str = Enum.at(balance_row, 1)

      {parse_amount(amount_str), parse_date(date_str)}
    else
      {0.0, Date.utc_today()}
    end
  end

  defp extract_transactions(rows) do
    # Filter for transaction rows (usually start with a date DD.MM.YYYY)
    rows
    |> Enum.filter(fn row -> 
      # Check if first column matches date format
      Regex.match?(~r/^\d{2}\.\d{2}\.\d{4}$/, List.first(row))
    end)
    |> Enum.map(fn row ->
      date = parse_date(List.first(row)) # Buchungsdatum
      # Betrag (€) is usually at index 8 in DKB CSV (0-based)
      # Columns: Buchungsdatum;Wertstellung;Status;Zahlungspflichtige*r;Zahlungsempfänger*in;Verwendungszweck;Umsatztyp;IBAN;Betrag (€);...
      # Index: 0;1;2;3;4;5;6;7;8
      amount = parse_amount(Enum.at(row, 8)) 
      %{date: date, amount: amount}
    end)
    |> Enum.sort_by(& &1.date, {:desc, Date}) # Ensure sorted descending (newest first)
  end

  defp calculate_daily_snapshots(current_balance, balance_date, transactions) do
    # Group transactions by date
    transactions_by_date = Enum.group_by(transactions, & &1.date)

    # We start from the balance date and go backwards
    # First snapshot is the current balance
    initial_snapshot = %{
      date: balance_date,
      balance: current_balance,
      currency: "EUR",
      type: :account
    }

    all_dates = Map.keys(transactions_by_date) |> Enum.sort({:desc, Date})
    dates_to_process = Enum.reject(all_dates, &Date.compare(&1, balance_date) == :gt)

    {snapshots, _final_balance} = 
      Enum.reduce(dates_to_process, {[initial_snapshot], current_balance}, fn date, {acc_snapshots, running_balance} ->
        # Transactions on this day
        txs = Map.get(transactions_by_date, date, [])
        
        # Sum of transactions on this day
        daily_change = Enum.reduce(txs, 0.0, fn tx, acc -> acc + tx.amount end)

        # The balance BEFORE this day's transactions (End-of-Day of previous day)
        prev_balance = running_balance - daily_change

        if date == balance_date do
           {acc_snapshots, prev_balance}
        else
           snapshot = %{
             date: date,
             balance: running_balance,
             currency: "EUR",
             type: :account
           }
           {[snapshot | acc_snapshots], prev_balance}
        end
      end)
    
    # Fill gaps logic removed for simplicity, but we ensure at least one snapshot exists
    if Enum.any?(snapshots, & &1.date == balance_date) do
      snapshots
    else
      [%{
        date: balance_date,
        balance: current_balance,
        currency: "EUR",
        type: :account
      } | snapshots]
    end
  end

  defp parse_amount(nil), do: 0.0
  defp parse_amount(str) do
    # Format: "50.934,67 €" or "-200,53"
    str
    |> String.replace(".", "")      # Remove thousands separator
    |> String.replace(",", ".")     # Replace decimal separator
    |> String.replace("€", "")      # Remove currency symbol
    |> String.trim()
    |> Float.parse()
    |> case do
      {val, _} -> val
      :error -> 0.0
    end
  end

  defp parse_date(str) do
    # Format: "16.01.2026"
    case String.split(str, ".") do
      [day, month, year] ->
        Date.new!(String.to_integer(year), String.to_integer(month), String.to_integer(day))
      _ -> Date.utc_today()
    end
  rescue
    _ -> Date.utc_today()
  end
end
