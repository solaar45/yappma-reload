defmodule WealthBackendWeb.AssetTypeJSON do
  alias WealthBackend.Portfolio.AssetType

  def index(%{asset_types: asset_types}) do
    %{data: for(asset_type <- asset_types, do: data(asset_type))}
  end

  def show(%{asset_type: asset_type}) do
    %{data: data(asset_type)}
  end

  defp data(%AssetType{} = asset_type) do
    %{
      id: asset_type.id,
      code: asset_type.code,
      description: asset_type.description
    }
  end
end
