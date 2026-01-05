defmodule WealthBackendWeb.TransactionCategoryJSON do
  alias WealthBackend.Banking.TransactionCategory

  def index(%{categories: categories}) do
    %{data: for(category <- categories, do: data(category))}
  end

  def show(%{category: category}) do
    %{data: data(category)}
  end

  defp data(%TransactionCategory{} = category) do
    %{
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      type: category.type,
      is_system: category.is_system,
      user_id: category.user_id
    }
  end
end
