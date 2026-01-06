defmodule WealthBackend.Analytics do
  @moduledoc """
  The Analytics context for snapshots and aggregations.
  """

  import Ecto.Query, warn: false
  alias WealthBackend.Repo
  alias WealthBackend.Analytics.{AccountSnapshot, AssetSnapshot}
  alias WealthBackend.Accounts.Account
  alias WealthBackend.Portfolio.Asset

  ## Account Snapshots

  def list_account_snapshots(account_id, user_id) do
    AccountSnapshot
    |> where([s], s.account_id == ^account_id and s.user_id == ^user_id)
    |> order_by([s], desc: s.snapshot_date)
    |> Repo.all()
  end

  def get_account_snapshot!(id, user_id) do
    AccountSnapshot
    |> where([s], s.id == ^id and s.user_id == ^user_id)
    |> Repo.one!()
  end

  def create_account_snapshot(user_id, attrs \\ %{}) do
    attrs = normalize_keys_to_strings(attrs)
    |> Map.put("user_id", user_id)

    # Try to find an existing snapshot for the same account/date/user and update it instead
    account_id = to_int(Map.get(attrs, "account_id"))

    existing_snapshot =
      case Map.get(attrs, "snapshot_date") do
        nil -> nil
        date_str ->
          case Date.from_iso8601(to_string(date_str)) do
            {:ok, date} when is_integer(account_id) ->
              Repo.get_by(AccountSnapshot,
                account_id: account_id,
                snapshot_date: date,
                user_id: user_id
              )

            _ ->
              nil
          end
      end

    if existing_snapshot do
      update_account_snapshot(existing_snapshot, attrs)
    else
      %AccountSnapshot{}
      |> AccountSnapshot.changeset(attrs)
      |> Repo.insert()
    end
  end

  def update_account_snapshot(%AccountSnapshot{} = snapshot, attrs) do
    snapshot
    |> AccountSnapshot.changeset(attrs)
    |> Repo.update()
  end

  def delete_account_snapshot(%AccountSnapshot{} = snapshot) do
    Repo.delete(snapshot)
  end

  ## Asset Snapshots

  def list_asset_snapshots(asset_id, user_id) do
    AssetSnapshot
    |> where([s], s.asset_id == ^asset_id and s.user_id == ^user_id)
    |> order_by([s], desc: s.snapshot_date)
    |> Repo.all()
  end

  def get_asset_snapshot!(id, user_id) do
    AssetSnapshot
    |> where([s], s.id == ^id and s.user_id == ^user_id)
    |> Repo.one!()
  end

  def create_asset_snapshot(user_id, attrs \\ %{}) do
    attrs = normalize_keys_to_strings(attrs)
    |> Map.put("user_id", user_id)

    %AssetSnapshot{}
    |> AssetSnapshot.changeset(attrs)
    |> Repo.insert()
  end

  defp normalize_keys_to_strings(attrs) when is_map(attrs) do
    attrs
    |> Enum.into(%{}, fn
      {k, v} when is_atom(k) -> {to_string(k), v}
      {k, v} -> {k, v}
    end)
  end

  defp normalize_keys_to_strings(other), do: other

  defp to_int(v) when is_integer(v), do: v
  defp to_int(v) when is_binary(v) do
    case Integer.parse(v) do
      {i, ""} -> i
      _ -> nil
    end
  end

  defp to_int(_), do: nil

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
  Get the latest snapshots for all accounts of a user up to a given date.
  Returns a list of {account, latest_snapshot} tuples.
  """
  def get_latest_account_snapshots(user_id, date \\ Date.utc_today()) do
    # Subquery to get the latest snapshot date per account
    latest_dates =
      from s in AccountSnapshot,
        join: a in Account,
        on: s.account_id == a.id,
        where: a.user_id == ^user_id and s.snapshot_date <= ^date,
        group_by: s.account_id,
        select: %{account_id: s.account_id, max_date: max(s.snapshot_date)}

    # Join back to get full snapshot data
    from(s in AccountSnapshot,
      join: ld in subquery(latest_dates),
      on: s.account_id == ld.account_id and s.snapshot_date == ld.max_date,
      preload: [account: :institution]
    )
    |> Repo.all()
  end

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
      preload: [asset: [:account, :asset_type]]
    )
    |> Repo.all()
  end

  @doc """
  Calculate total net worth for a user at a specific date.
  Returns %{total: decimal, accounts: decimal, assets: decimal}
  """
  def calculate_net_worth(user_id, date \\ Date.utc_today()) do
    account_snapshots = get_latest_account_snapshots(user_id, date)
    asset_snapshots = get_latest_asset_snapshots(user_id, date)

    accounts_total =
      account_snapshots
      |> Enum.map(& &1.balance)
      |> Enum.reduce(Decimal.new(0), &Decimal.add/2)

    assets_total =
      asset_snapshots
      |> Enum.map(& &1.value)
      |> Enum.reduce(Decimal.new(0), &Decimal.add/2)

    total = Decimal.add(accounts_total, assets_total)

    %{
      total: total,
      accounts: accounts_total,
      assets: assets_total
    }
  end
end
