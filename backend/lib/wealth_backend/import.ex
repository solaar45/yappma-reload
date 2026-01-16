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
  
  Options:
  - :target_account_id - ID of the account to import into (for banking exports)
  
  Returns `{:ok, %{success_count: int, failures: list}}` or `{:error, reason}`.
  """
  def import_csv(user_id, csv_content, opts \\ []) do
    target_account_id = Keyword.get(opts, :target_account_id)

    with {:ok, rows} <- Parser.parse(csv_content) do
      # Validate target_account_id if the import contains account data
      # Check first row type
      first_row = List.first(rows)
      
      if first_row && first_row.type == :account && is_nil(target_account_id) do
        {:error, "Please select a target account for this import."}
      else
        results = 
          rows
          |> Enum.map(fn row -> process_imported_row(user_id, row, target_account_id) end)
        
        success_count = Enum.count(results, &match?({:ok, _}, &1))
        failures = 
          results 
          |> Enum.filter(&match?({:error, _}, &1))
          |> Enum.map(fn {:error, reason} -> reason end)

        {:ok, %{success_count: success_count, failures: failures}}
      end
    end
  end

  # Process Account Snapshots (DKB, Comdirect Giro, etc.)
  defp process_imported_row(user_id, %{type: :account, balance: balance, date: date, currency: currency}, target_account_id) do
    if target_account_id do
       Analytics.create_account_snapshot(user_id, %{
          "account_id" => target_account_id,
          "snapshot_date" => date,
          "balance" => balance,
          "currency" => currency
        })
    else
       {:error, "Missing target account ID"}
    end
  end

  # Process Asset Snapshots (Scalable, etc.) - target_account_id is ignored/optional
  defp process_imported_row(user_id, %{isin: isin, quantity: quantity, date: date}, _target_account_id) do
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
end
