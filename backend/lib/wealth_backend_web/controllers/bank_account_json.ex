defmodule WealthBackendWeb.BankAccountJSON do
  alias WealthBackend.FinTS.BankAccount

  @doc """
  Renders a list of bank accounts.
  """
  def index(%{bank_accounts: bank_accounts}) do
    %{data: for(bank_account <- bank_accounts, do: data(bank_account))}
  end

  @doc """
  Renders a single bank account.
  """
  def show(%{bank_account: bank_account}) do
    %{data: data(bank_account)}
  end

  defp data(%BankAccount{} = bank_account) do
    %{
      id: bank_account.id,
      iban: bank_account.iban,
      account_number: bank_account.account_number,
      account_name: bank_account.account_name,
      bic: bank_account.bic,
      bank_name: bank_account.bank_name,
      currency: bank_account.currency,
      type: bank_account.type,
      bank_connection_id: bank_account.bank_connection_id,
      account_id: bank_account.account_id,
      account: render_account(bank_account.account),
      inserted_at: bank_account.inserted_at,
      updated_at: bank_account.updated_at
    }
  end

  defp render_account(nil), do: nil
  defp render_account(%Ecto.Association.NotLoaded{}), do: nil
  defp render_account(account) do
    %{
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency
    }
  end
end
