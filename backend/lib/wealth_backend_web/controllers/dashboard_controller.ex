defmodule WealthBackendWeb.DashboardController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Analytics

  action_fallback WealthBackendWeb.FallbackController

  @doc """
  Returns net worth calculation for a user.
  Query params: user_id (required), date (optional, defaults to today)
  """
  def net_worth(conn, %{"user_id" => user_id} = params) do
    date = parse_date(params["date"])
    net_worth = Analytics.calculate_net_worth(user_id, date)
    
    render(conn, :net_worth, net_worth: net_worth, date: date)
  end

  @doc """
  Returns latest snapshots for all accounts of a user.
  Query params: user_id (required), date (optional)
  """
  def account_snapshots(conn, %{"user_id" => user_id} = params) do
    date = parse_date(params["date"])
    snapshots = Analytics.get_latest_account_snapshots(user_id, date)
    
    render(conn, :account_snapshots, snapshots: snapshots, date: date)
  end

  @doc """
  Returns latest snapshots for all assets of a user.
  Query params: user_id (required), date (optional)
  """
  def asset_snapshots(conn, %{"user_id" => user_id} = params) do
    date = parse_date(params["date"])
    snapshots = Analytics.get_latest_asset_snapshots(user_id, date)
    
    render(conn, :asset_snapshots, snapshots: snapshots, date: date)
  end

  defp parse_date(nil), do: Date.utc_today()
  defp parse_date(date_string) when is_binary(date_string) do
    case Date.from_iso8601(date_string) do
      {:ok, date} -> date
      {:error, _} -> Date.utc_today()
    end
  end
  defp parse_date(_), do: Date.utc_today()
end
