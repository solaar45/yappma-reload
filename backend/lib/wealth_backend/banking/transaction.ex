defmodule WealthBackend.Banking.Transaction do
  use Ecto.Schema
  import Ecto.Changeset

  alias WealthBackend.Accounts.Account
  alias WealthBackend.Banking.BankConsent

  @type t :: %__MODULE__{
          id: integer(),
          account_id: integer(),
          consent_id: integer() | nil,
          external_id: String.t(),
          end_to_end_id: String.t() | nil,
          booking_date: Date.t(),
          value_date: Date.t() | nil,
          transaction_amount: Decimal.t(),
          transaction_currency: String.t(),
          status: String.t(),
          remittance_information: String.t() | nil,
          additional_information: String.t() | nil,
          creditor_name: String.t() | nil,
          creditor_account_iban: String.t() | nil,
          debtor_name: String.t() | nil,
          debtor_account_iban: String.t() | nil,
          bank_transaction_code: String.t() | nil,
          proprietary_bank_transaction_code: String.t() | nil,
          raw_data: map() | nil,
          account: Account.t() | Ecto.Association.NotLoaded.t(),
          consent: BankConsent.t() | Ecto.Association.NotLoaded.t() | nil,
          inserted_at: NaiveDateTime.t(),
          updated_at: NaiveDateTime.t()
        }

  schema "transactions" do
    field :external_id, :string
    field :end_to_end_id, :string
    field :booking_date, :date
    field :value_date, :date
    field :transaction_amount, :decimal
    field :transaction_currency, :string
    field :status, :string
    field :remittance_information, :string
    field :additional_information, :string
    field :creditor_name, :string
    field :creditor_account_iban, :string
    field :debtor_name, :string
    field :debtor_account_iban, :string
    field :bank_transaction_code, :string
    field :proprietary_bank_transaction_code, :string
    field :raw_data, :map

    belongs_to :account, Account
    belongs_to :consent, BankConsent

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(account_id external_id booking_date transaction_amount transaction_currency status)a
  @optional_fields ~w(consent_id end_to_end_id value_date remittance_information additional_information
                      creditor_name creditor_account_iban debtor_name debtor_account_iban
                      bank_transaction_code proprietary_bank_transaction_code raw_data)a

  @doc false
  def changeset(transaction, attrs) do
    transaction
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:status, ["booked", "pending"])
    |> validate_inclusion(:transaction_currency, ["EUR", "USD", "GBP", "CHF"])
    |> foreign_key_constraint(:account_id)
    |> foreign_key_constraint(:consent_id)
    |> unique_constraint([:account_id, :external_id], name: :transactions_account_external_id_index)
  end
end
