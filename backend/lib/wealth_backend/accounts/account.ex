defmodule WealthBackend.Accounts.Account do
  use Ecto.Schema
  import Ecto.Changeset

  schema "accounts" do
    field :name, :string
    field :type, Ecto.Enum,
      values: [
        :checking, 
        :savings,            # Tagesgeld
        :savings_account,    # Klassisches Sparkonto
        :fixed_deposit,      # Festgeld
        :brokerage, 
        :wallet,             # Digital Wallet
        :credit_card, 
        :loan,               # Kredit
        :insurance, 
        :cash, 
        :other
      ]
    field :currency, :string
    field :is_active, :boolean, default: true
    field :opened_at, :date
    field :closed_at, :date
    field :savings_plan_amount, :decimal, default: 0

    belongs_to :user, WealthBackend.Accounts.User
    belongs_to :institution, WealthBackend.Institutions.Institution
    has_many :snapshots, WealthBackend.Analytics.AccountSnapshot

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(account, attrs) do
    account
    |> cast(attrs, [:name, :type, :currency, :is_active, :opened_at, :closed_at, :user_id, :institution_id, :savings_plan_amount])
    |> validate_required([:name, :user_id])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:institution_id)
  end
end
