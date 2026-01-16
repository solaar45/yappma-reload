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

  defp process_imported_row(user_id, %{isin: isin, quantity: quantity, date: date}) do
    # 1. Find asset by ISIN
    # We might need to look up via Ticker if ISIN not stored, or store ISINs
    # For now, let's assume we can search by ISIN using the enrichment service logic or database
    # But wait, our Asset model might not have ISIN directly? 
    # Let's check Asset schema. It has security_asset -> isin.
    
    case find_asset_by_isin(user_id, isin) do
      {:ok, asset} ->
        # 2. Create snapshot
        # Using Analytics.create_asset_snapshot/2 which triggers price enrichment
        Analytics.create_asset_snapshot(user_id, %{
          "asset_id" => asset.id,
          "snapshot_date" => date,
          "quantity" => quantity
          # value and market_price will be fetched automatically by Analytics context
        })

      {:error, :not_found} ->
        {:error, "Asset with ISIN #{isin} not found. Please create it first."}
    end
  end

  defp find_asset_by_isin(user_id, isin) do
    # This is a naive implementation. Ideally we have a helper in Portfolio context.
    # We need to join assets -> security_assets
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
end
