defmodule WealthBackend.BankConnections.BankAccount do
  use Ecto.Schema
  import Ecto.Changeset

  schema "bank_accounts" do
    field :iban, :string
    field :account_number, :string
    field :bic, :string
    field :external_id, :string
    field :account_name, :string
    field :auto_import_enabled, :boolean, default: true

    belongs_to :bank_connection, WealthBackend.BankConnections.BankConnection
    belongs_to :account, WealthBackend.Accounts.Account

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(bank_account, attrs) do
    bank_account
    |> cast(attrs, [
      :iban,
      :account_number,
      :bic,
      :external_id,
      :account_name,
      :auto_import_enabled,
      :bank_connection_id,
      :account_id
    ])
    |> validate_required([:bank_connection_id])
    |> validate_iban()
    |> foreign_key_constraint(:bank_connection_id)
    |> foreign_key_constraint(:account_id)
    |> unique_constraint([:iban, :bank_connection_id],
      name: :bank_accounts_iban_connection_index
    )
  end

  defp validate_iban(changeset) do
    case get_change(changeset, :iban) do
      nil ->
        changeset

      iban ->
        # Basic IBAN validation (starts with 2 letters, 2 digits)
        if String.match?(iban, ~r/^[A-Z]{2}[0-9]{2}/) do
          changeset
        else
          add_error(changeset, :iban, "invalid IBAN format")
        end
    end
  end
end
