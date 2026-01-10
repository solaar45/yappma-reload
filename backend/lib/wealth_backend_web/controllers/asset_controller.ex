defmodule WealthBackendWeb.AssetController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Portfolio
  alias WealthBackend.Portfolio.Asset

  action_fallback WealthBackendWeb.FallbackController

  def index(conn, _params) do
    user = conn.assigns.current_user
    assets = Portfolio.list_assets(user.id)
    render(conn, :index, assets: assets)
  end

  def create(conn, %{"asset" => asset_params}) do
    user = conn.assigns.current_user
    # Ensure params use string keys (Ecto expects either all string keys or all atom keys)
    safe_params = asset_params |> stringify_keys() |> Map.put("user_id", user.id)

    with {:ok, %Asset{} = asset} <- Portfolio.create_full_asset(user.id, safe_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/assets/#{asset}")
      |> render(:show, asset: asset)
    end
  end

  def show(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    asset = Portfolio.get_asset!(id, user.id)
    render(conn, :show, asset: asset)
  end

  def update(conn, %{"id" => id, "asset" => asset_params}) do
    user = conn.assigns.current_user
    asset = Portfolio.get_asset!(id, user.id)

    safe_params = asset_params |> stringify_keys()

    with {:ok, %Asset{} = asset} <- Portfolio.update_asset(asset, safe_params) do
      render(conn, :show, asset: asset)
    end
  end

  # Recursively convert atom keys to strings to avoid mixed-key maps for Ecto casts
  defp stringify_keys(%{} = map) do
    map
    |> Enum.map(fn {k, v} ->
      key = if is_atom(k), do: Atom.to_string(k), else: k
      value = case v do
        %{} -> stringify_keys(v)
        list when is_list(list) -> Enum.map(list, fn
          elem when is_map(elem) -> stringify_keys(elem)
          elem -> elem
        end)
        other -> other
      end
      {key, value}
    end)
    |> Enum.into(%{})
  end

  defp stringify_keys(other), do: other

  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    asset = Portfolio.get_asset!(id, user.id)

    with {:ok, %Asset{}} <- Portfolio.delete_asset(asset) do
      send_resp(conn, :no_content, "")
    end
  end
end
