defmodule WealthBackend.Analytics do
  @moduledoc """
  The Analytics context for snapshots and aggregations.
  """

  import Ecto.Query, warn: false
  alias WealthBackend.Repo
  alias WealthBackend.Analytics.AssetSnapshot
  alias WealthBackend.Portfolio.Asset

  ## Asset Snapshots

  def list_asset_snapshots(asset_id) do
    AssetSnapshot
    |> where([s], s.asset_id == ^asset_id)
    |> order_by([s], desc: s.snapshot_date)
    |> Repo.all()
  end

  def get_asset_snapshot!(id), do: Repo.get!(AssetSnapshot, id)

  def create_asset_snapshot(attrs \\ %{}) do
    %AssetSnapshot{}
    |> AssetSnapshot.changeset(attrs)
    |> Repo.insert()
  end

  def update_asset_snapshot(%AssetSnapshot{} = snapshot, attrs) do
    snapshot
    |> AssetSnapshot.changeset(attrs)
    |> Repo.update()
  end

  def delete_asset_snapshot(%AssetSnapshot{} = snapshot) do
    Repo.delete(snapshot)
  end

  ## Aggregations

  @doc """
  Get the latest snapshots for all assets of a user up to a given date.
  """
  def get_latest_asset_snapshots(user_id, date \\ Date.utc_today()) do
    latest_dates =
      from s in AssetSnapshot,
        join: a in Asset,
        on: s.asset_id == a.id,
        where: a.user_id == ^user_id and s.snapshot_date <= ^date,
        group_by: s.asset_id,
        select: %{asset_id: s.asset_id, max_date: max(s.snapshot_date)}

    from(s in AssetSnapshot,
      join: ld in subquery(latest_dates),
      on: s.asset_id == ld.asset_id and s.snapshot_date == ld.max_date,
      preload: [asset: [:institution, :asset_type]]
    )
    |> Repo.all()
  end

  @doc """
  Calculate total net worth for a user at a specific date.
  Returns %{total: decimal, assets: decimal}
  """
  def calculate_net_worth(user_id, date \\ Date.utc_today()) do
    asset_snapshots = get_latest_asset_snapshots(user_id, date)

    assets_total =
      asset_snapshots
      |> Enum.map(& &1.value)
      |> Enum.reduce(Decimal.new(0), &Decimal.add/2)

    %{
      total: assets_total,
      assets: assets_total
    }
  end
end
