defmodule WealthBackend.FinTS.BankAccount do
  use Ecto.Schema
  import Ecto.Changeset

  schema "bank_accounts" do
    field :iban, :string
    field :account_number, :string
    field :account_name, :string
    field :bic, :string
    field :bank_name, :string
    field :currency, :string, default: "EUR"
    field :type, :string

    belongs_to :bank_connection, WealthBackend.FinTS.BankConnection
    belongs_to :account, WealthBackend.Accounts.Account

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(bank_account, attrs) do
    bank_account
    |> cast(attrs, [
      :iban,
      :account_number,
      :account_name,
      :bic,
      :bank_name,
      :currency,
      :type,
      :bank_connection_id,
      :account_id
    ])
    |> validate_required([:iban, :account_name, :bank_connection_id])
    |> validate_length(:iban, min: 15, max: 34)
    |> validate_length(:currency, is: 3)
    |> unique_constraint([:bank_connection_id, :iban],
      name: :bank_accounts_unique_iban_per_connection,
      message: "IBAN already exists for this connection"
    )
    |> foreign_key_constraint(:bank_connection_id)
    |> foreign_key_constraint(:account_id)
  end
end
