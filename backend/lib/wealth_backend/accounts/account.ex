defmodule WealthBackend.Accounts.Account do
  use Ecto.Schema
  import Ecto.Changeset

  schema "accounts" do
    field :name, :string
    field :type, Ecto.Enum,
      values: [:checking, :savings, :credit_card, :brokerage, :insurance, :cash, :other]
    field :currency, :string
    field :is_active, :boolean, default: true
    field :opened_at, :date
    field :closed_at, :date
    field :iban, :string

    belongs_to :user, WealthBackend.Accounts.User
    belongs_to :institution, WealthBackend.Accounts.Institution
    belongs_to :account_type, WealthBackend.Accounts.AccountType
    has_many :snapshots, WealthBackend.Analytics.AccountSnapshot

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(account, attrs) do
    account
    |> cast(attrs, [:name, :type, :currency, :is_active, :opened_at, :closed_at, :iban, :user_id, :institution_id, :account_type_id])
    |> validate_required([:name, :user_id])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:institution_id)
    |> foreign_key_constraint(:account_type_id)
  end
end
