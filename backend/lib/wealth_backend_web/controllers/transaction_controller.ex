defmodule WealthBackendWeb.TransactionController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Banking
  alias WealthBackend.Banking.Transaction

  action_fallback WealthBackendWeb.FallbackController

  @doc """
  List all transactions for the authenticated user.
  Query params:
    - from_date: ISO8601 date string
    - to_date: ISO8601 date string
    - status: "booked" or "pending"
    - limit: integer
  """
  def index(conn, params) do
    user_id = get_user_id(conn)

    opts = build_filter_opts(params)
    transactions = Banking.list_user_transactions(user_id, opts)

    render(conn, :index, transactions: transactions)
  end

  @doc """
  Get a single transaction by ID.
  """
  def show(conn, %{"id" => id}) do
    transaction = Banking.get_transaction!(id)

    # TODO: Verify transaction belongs to user
    render(conn, :show, transaction: transaction)
  end

  @doc """
  List transactions for a specific account.
  """
  def list_by_account(conn, %{"account_id" => account_id} = params) do
    opts = build_filter_opts(params)
    transactions = Banking.list_transactions(account_id, opts)

    render(conn, :index, transactions: transactions)
  end

  @doc """
  Trigger transaction sync for an account.
  Body params:
    - account_id: integer
    - consent_external_id: string
    - date_from: ISO8601 date string (optional)
    - date_to: ISO8601 date string (optional)
  """
  def sync(conn, %{"account_id" => account_id, "consent_external_id" => consent_id} = params) do
    sync_opts =
      params
      |> Map.take(["date_from", "date_to"])
      |> Enum.map(fn {k, v} -> {String.to_atom(k), v} end)

    case Banking.sync_account_transactions(account_id, consent_id, sync_opts) do
      {:ok, count} ->
        json(conn, %{success: true, synced_count: count})

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: reason})
    end
  end

  # Private helpers

  defp get_user_id(conn) do
    # TODO: Extract from authentication token/session
    # For now, hardcode user_id = 1
    1
  end

  defp build_filter_opts(params) do
    params
    |> Map.take(["from_date", "to_date", "status", "limit"])
    |> Enum.reduce([], fn
      {"from_date", date_str}, acc when is_binary(date_str) ->
        case Date.from_iso8601(date_str) do
          {:ok, date} -> [{:from_date, date} | acc]
          _ -> acc
        end

      {"to_date", date_str}, acc when is_binary(date_str) ->
        case Date.from_iso8601(date_str) do
          {:ok, date} -> [{:to_date, date} | acc]
          _ -> acc
        end

      {"status", status}, acc when status in ["booked", "pending"] ->
        [{:status, status} | acc]

      {"limit", limit_str}, acc when is_binary(limit_str) ->
        case Integer.parse(limit_str) do
          {limit, _} -> [{:limit, limit} | acc]
          _ -> acc
        end

      {"limit", limit}, acc when is_integer(limit) ->
        [{:limit, limit} | acc]

      _, acc ->
        acc
    end)
  end
end
