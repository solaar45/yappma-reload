defmodule WealthBackend.Import.Adapters.DKB do
  @moduledoc """
  Adapter for importing DKB CSV files (Girokonto).
  Calculates historical balances based on current balance and transactions.
  """
  
  require Logger

  @behaviour WealthBackend.Import.Adapter

  @impl true
  def name, do: "DKB Girokonto"

  @impl true
  def matches?(content) do
    # Check for typical DKB header lines
    String.contains?(content, "Kontostand vom") && 
    String.contains?(content, "Buchungsdatum;Wertstellung;Status")
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
      amount = parse_amount(Enum.at(row, 8)) # Betrag (€) is usually at index 8 in DKB CSV
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

    # Iterate backwards through transactions to reconstruct history
    # Sort dates descending
    all_dates = Map.keys(transactions_by_date) |> Enum.sort({:desc, Date})
    
    # Remove future dates if any (shouldn't happen with valid exports)
    dates_to_process = Enum.reject(all_dates, &Date.compare(&1, balance_date) == :gt)

    {snapshots, _final_balance} = 
      Enum.reduce(dates_to_process, {[initial_snapshot], current_balance}, fn date, {acc_snapshots, running_balance} ->
        # Transactions on this day
        txs = Map.get(transactions_by_date, date, [])
        
        # Sum of transactions on this day
        daily_change = Enum.reduce(txs, 0.0, fn tx, acc -> acc + tx.amount end)

        # The balance BEFORE this day's transactions (which is the closing balance of the previous day)
        # Running balance is End-of-Day balance.
        # So: Previous_Day_Balance = End_of_Day_Balance - Daily_Change
        prev_balance = running_balance - daily_change

        # Add snapshot for this date (using the running balance we had at end of day)
        # Wait, if we have multiple days, we need to handle gaps?
        # For simplicity, we just create snapshots for days with transactions + the initial balance date
        
        # Logic check:
        # 16.01. Balance 1000. Tx: -200.
        # So 15.01. Balance was 1200.
        
        # Current logic:
        # Start: 16.01, 1000.
        # Loop date 16.01: Change -200. Prev (15.01) = 1000 - (-200) = 1200.
        # We need to store 16.01 snapshot (already stored as initial).
        
        # Actually, since we already have the End-of-Day balance for the latest date, 
        # we iterate to find previous days.
        
        # If the date is the same as balance_date, we just update the calculation for next iteration
        if date == balance_date do
           # We already have the snapshot for this date
           {acc_snapshots, prev_balance}
        else
           # For past dates, the "running_balance" passed into this iteration 
           # is actually the "prev_balance" calculated in the newer day's iteration.
           # So on this date, the closing balance is what was passed in.
           
           snapshot = %{
             date: date,
             balance: running_balance,
             currency: "EUR",
             type: :account
           }
           
           # Prepare for next older date
           new_prev_balance = running_balance - daily_change
           {[snapshot | acc_snapshots], new_prev_balance}
        end
      end)
    
    # If the CSV doesn't cover the balance_date in transactions (no tx on today), 
    # we need to make sure we connect the dots.
    # But above reduce logic works fine.
    
    # One edge case: If transactions are NOT on balance_date, we need to bridge the gap.
    # The reduce only iterates dates WITH transactions.
    # Correct approach: 
    # 1. Start with current balance at balance_date.
    # 2. Iterate descending through all transaction dates.
    # 3. For each transaction date, the balance valid at the END of that date is calculated by subtracting 
    #    sum of newer transactions? No.
    
    # Simpler: 
    # Balance at Date X = Balance_Start - Sum(Transactions > Date X)
    # This assumes Balance_Start is the latest known.
    
    snapshots = 
      all_dates
      |> Enum.map(fn date ->
         # Calculate sum of all transactions AFTER this date up to balance_date
         future_txs_sum = 
           transactions
           |> Enum.filter(fn tx -> Date.compare(tx.date, date) == :gt end)
           |> Enum.reduce(0.0, fn tx, acc -> acc + tx.amount end)
           
         historical_balance = current_balance - future_txs_sum
         
         %{
           date: date,
           balance: historical_balance,
           currency: "EUR",
           type: :account
         }
      end)

    # Include the reference snapshot if not present (e.g. no transactions on export day)
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
    [day, month, year] = String.split(str, ".")
    Date.new!(String.to_integer(year), String.to_integer(month), String.to_integer(day))
  end
end
