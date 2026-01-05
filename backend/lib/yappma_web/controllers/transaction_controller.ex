defmodule YappmaWeb.TransactionController do
  use YappmaWeb, :controller

  alias Yappma.Banking

  # List all transactions for current user
  def index(conn, params) do
    user_id = get_user_id(conn)
    
    opts = build_filter_opts(params)
    
    transactions = Banking.list_user_transactions(user_id, opts)
    
    render(conn, :index, transactions: transactions)
  end

  # Get single transaction
  def show(conn, %{"id" => id}) do
    transaction = Banking.get_transaction!(id)
    
    # Verify ownership
    if transaction.account.user_id == get_user_id(conn) do
      render(conn, :show, transaction: transaction)
    else
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Access denied"})
    end
  end

  # Update transaction (category, notes)
  def update(conn, %{"id" => id} = params) do
    transaction = Banking.get_transaction!(id)
    
    # Verify ownership
    if transaction.account.user_id != get_user_id(conn) do
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Access denied"})
    else
      update_attrs = Map.take(params, ["category_id", "notes"])
      
      case Banking.update_transaction(transaction, update_attrs) do
        {:ok, updated_transaction} ->
          updated_transaction = Banking.get_transaction!(updated_transaction.id)
          render(conn, :show, transaction: updated_transaction)
        
        {:error, changeset} ->
          conn
          |> put_status(:unprocessable_entity)
          |> json(%{errors: translate_errors(changeset)})
      end
    end
  end

  # List transactions for specific account
  def list_by_account(conn, %{"account_id" => account_id} = params) do
    opts = build_filter_opts(params)
    
    transactions = Banking.list_transactions(String.to_integer(account_id), opts)
    
    render(conn, :index, transactions: transactions)
  end

  # List transaction categories
  def list_categories(conn, _params) do
    categories = Banking.list_categories()
    
    json(conn, %{
      categories: Enum.map(categories, fn cat ->
        %{
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: cat.type
        }
      end)
    })
  end

  # Build filter options from params
  defp build_filter_opts(params) do
    []
    |> maybe_add_opt(:from_date, parse_date(params["from_date"]))
    |> maybe_add_opt(:to_date, parse_date(params["to_date"]))
    |> maybe_add_opt(:status, params["status"])
    |> maybe_add_opt(:category_id, parse_int(params["category_id"]))
    |> maybe_add_opt(:search, params["search"])
    |> maybe_add_opt(:limit, parse_int(params["limit"]))
  end

  defp maybe_add_opt(opts, _key, nil), do: opts
  defp maybe_add_opt(opts, key, value), do: Keyword.put(opts, key, value)

  defp parse_date(nil), do: nil
  defp parse_date(date_string) when is_binary(date_string) do
    case Date.from_iso8601(date_string) do
      {:ok, date} -> date
      _ -> nil
    end
  end

  defp parse_int(nil), do: nil
  defp parse_int(string) when is_binary(string) do
    case Integer.parse(string) do
      {int, _} -> int
      :error -> nil
    end
  end
  defp parse_int(int) when is_integer(int), do: int

  defp get_user_id(conn) do
    # Get user ID from assigns (set by authentication plug)
    conn.assigns[:current_user].id
  end

  defp translate_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end
