defmodule YappmaWeb.TransactionCategoryController do
  use YappmaWeb, :controller

  alias Yappma.Banking
  alias Yappma.Banking.TransactionCategory

  action_fallback YappmaWeb.FallbackController

  def index(conn, _params) do
    user_id = get_user_id(conn)
    categories = Banking.list_categories(user_id: user_id)
    render(conn, :index, categories: categories)
  end

  def create(conn, %{"category" => category_params}) do
    user_id = get_user_id(conn)
    
    category_params =
      category_params
      |> Map.put("user_id", user_id)
      |> Map.put("is_system", false)

    with {:ok, %TransactionCategory{} = category} <- Banking.create_category(category_params) do
      conn
      |> put_status(:created)
      |> render(:show, category: category)
    end
  end

  def update(conn, %{"id" => id, "category" => category_params}) do
    category = Banking.get_category!(id)

    with {:ok, %TransactionCategory{} = category} <- Banking.update_category(category, category_params) do
      render(conn, :show, category: category)
    end
  end

  def delete(conn, %{"id" => id}) do
    category = Banking.get_category!(id)

    with {:ok, %TransactionCategory{}} <- Banking.delete_category(category) do
      send_resp(conn, :no_content, "")
    end
  end

  defp get_user_id(conn) do
    # Get user_id from conn.assigns (set by authentication plug)
    conn.assigns[:current_user].id
  end
end
