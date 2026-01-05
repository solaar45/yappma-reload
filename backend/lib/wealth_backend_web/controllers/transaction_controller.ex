defmodule WealthBackendWeb.TransactionController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Banking

  action_fallback WealthBackendWeb.FallbackController

  # TODO: Get user_id from authenticated session/JWT token
  @default_user_id 1

  @doc """
  List all transactions for the authenticated user.
  Supports query params: from_date, to_date, status, limit
  """
  def index(conn, params) do
    user_id = Map.get(params, "user_id", @default_user_id)

    opts =
      []
      |> maybe_add_opt(:from_date, params["from_date"], &parse_date/1)
      |> maybe_add_opt(:to_date, params["to_date"], &parse_date/1)
      |> maybe_add_opt(:status, params["status"])
      |> maybe_add_opt(:limit, params["limit"], &String.to_integer/1)

    transactions = Banking.list_user_transactions(user_id, opts)
    render(conn, :index, transactions: transactions)
  end

  @doc """
  Get transactions for a specific account.
  """
  def list_by_account(conn, %{"account_id" => account_id} = params) do
    opts =
      []
      |> maybe_add_opt(:from_date, params["from_date"], &parse_date/1)
      |> maybe_add_opt(:to_date, params["to_date"], &parse_date/1)
      |> maybe_add_opt(:status, params["status"])
      |> maybe_add_opt(:limit, params["limit"], &String.to_integer/1)

    transactions = Banking.list_transactions(String.to_integer(account_id), opts)
    render(conn, :index, transactions: transactions)
  end

  @doc """
  Get a single transaction by ID.
  """
  def show(conn, %{"id" => id}) do
    transaction = Banking.get_transaction!(id)
    render(conn, :show, transaction: transaction)
  end

  @doc """
  Sync transactions for a specific account.
  Requires consent_id and account_id.
  """
  def sync(conn, %{"account_id" => account_id, "consent_id" => consent_id} = params) do
    opts =
      []
      |> maybe_add_opt(:date_from, params["from_date"])
      |> maybe_add_opt(:date_to, params["to_date"])

    case Banking.sync_account_transactions(String.to_integer(account_id), consent_id, opts) do
      {:ok, count} ->
        conn
        |> put_status(:ok)
        |> json(%{success: true, transactions_synced: count})

      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{success: false, error: reason})
    end
  end

  defp maybe_add_opt(opts, _key, nil, _parser), do: opts
  defp maybe_add_opt(opts, key, value, parser) when is_function(parser, 1) do
    case parser.(value) do
      {:ok, parsed} -> Keyword.put(opts, key, parsed)
      parsed when not is_nil(parsed) -> Keyword.put(opts, key, parsed)
      _ -> opts
    end
  end

  defp maybe_add_opt(opts, key, value) when not is_nil(value) do
    Keyword.put(opts, key, value)
  end

  defp maybe_add_opt(opts, _key, _value), do: opts

  defp parse_date(date_string) do
    case Date.from_iso8601(date_string) do
      {:ok, date} -> {:ok, date}
      {:error, _} -> nil
    end
  end
end
