defmodule WealthBackendWeb.BankAccountController do
  use WealthBackendWeb, :controller

  alias WealthBackend.BankConnections

  action_fallback WealthBackendWeb.FallbackController

  def create(conn, %{"bank_account" => bank_account_params}) do
    with {:ok, bank_account} <- BankConnections.create_bank_account(bank_account_params) do
      conn
      |> put_status(:created)
      |> json(%{success: true, data: bank_account})
    end
  end

  def link_account(conn, %{"id" => id, "account_id" => account_id}) do
    with {:ok, bank_account} <- BankConnections.link_bank_account(id, account_id) do
      json(conn, %{success: true, data: bank_account})
    end
  end
end
