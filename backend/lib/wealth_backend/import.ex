defmodule WealthBackend.Import do
  @moduledoc """
  The Import context.
  """

  alias WealthBackend.Import.Parser
  alias WealthBackend.Analytics
  alias WealthBackend.Portfolio
  require Logger

  @doc """
  Imports snapshots from a CSV string.
  
  Returns `{:ok, %{success_count: int, failures: list}}` or `{:error, reason}`.
  """
  def import_csv(user_id, csv_content) do
    with {:ok, rows} <- Parser.parse(csv_content) do
      results = 
        rows
        |> Enum.map(fn row -> process_imported_row(user_id, row) end)
      
      success_count = Enum.count(results, &match?({:ok, _}, &1))
      failures = 
        results 
        |> Enum.filter(&match?({:error, _}, &1))
        |> Enum.map(fn {:error, reason} -> reason end)

      {:ok, %{success_count: success_count, failures: failures}}
    end
  end

  # Process Account Snapshots (DKB, Comdirect Giro, etc.)
  defp process_imported_row(user_id, %{type: :account, balance: balance, date: date, currency: currency}) do
    # 1. Find or create default account
    # Ideally, we should match the IBAN from the CSV if available.
    # For now, we look for a "Girokonto" or just the first account.
    
    account = find_or_create_default_account(user_id)
    
    case account do
      {:ok, acc} ->
        Analytics.create_account_snapshot(user_id, %{
          "account_id" => acc.id,
          "snapshot_date" => date,
          "balance" => balance,
          "currency" => currency
        })
        
      {:error, reason} -> {:error, reason}
    end
  end

  # Process Asset Snapshots (Scalable, etc.)
  defp process_imported_row(user_id, %{isin: isin, quantity: quantity, date: date}) do
    case find_asset_by_isin(user_id, isin) do
      {:ok, asset} ->
        Analytics.create_asset_snapshot(user_id, %{
          "asset_id" => asset.id,
          "snapshot_date" => date,
          "quantity" => quantity
          # value/price fetched automatically
        })

      {:error, :not_found} ->
        {:error, "Asset with ISIN #{isin} not found. Please create it first."}
    end
  end

  defp find_asset_by_isin(user_id, isin) do
    import Ecto.Query
    
    query = from a in WealthBackend.Portfolio.Asset,
      join: s in WealthBackend.Portfolio.SecurityAsset, on: s.asset_id == a.id,
      where: a.user_id == ^user_id and s.isin == ^isin,
      limit: 1

    case WealthBackend.Repo.one(query) do
      nil -> {:error, :not_found}
      asset -> {:ok, asset}
    end
  end

  defp find_or_create_default_account(user_id) do
    import Ecto.Query
    alias WealthBackend.Portfolio.Account

    # Try to find an account named "Girokonto" or just the first one
    query = from a in Account,
      where: a.user_id == ^user_id,
      order_by: [asc: a.inserted_at],
      limit: 1

    case WealthBackend.Repo.one(query) do
      nil -> 
        # Create a default account if none exists
        # We need an Institution first? Assuming one exists or we create a placeholder.
        # This is tricky without more context.
        {:error, "No account found. Please create a bank account first."}
      
      account -> {:ok, account}
    end
  end
end
