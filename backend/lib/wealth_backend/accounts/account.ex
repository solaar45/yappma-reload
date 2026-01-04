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

    # PSD2/Bank-specific fields
    field :iban, :string
    field :external_id, :string  # PSD2 account resource_id from bank
    
    # Sync status fields
    field :is_synced, :boolean, default: false
    field :last_synced_at, :utc_datetime
    field :sync_enabled, :boolean, default: false
    
    # Metadata for additional PSD2 data
    field :metadata, :map

    belongs_to :user, WealthBackend.Accounts.User
    belongs_to :institution, WealthBackend.Institutions.Institution
    belongs_to :bank_consent, WealthBackend.Accounts.BankConsent
    has_many :snapshots, WealthBackend.Analytics.AccountSnapshot

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(account, attrs) do
    account
    |> cast(attrs, [
      :name, :type, :currency, :is_active, :opened_at, :closed_at,
      :user_id, :institution_id, :bank_consent_id,
      :iban, :external_id, :is_synced, :last_synced_at, :sync_enabled,
      :metadata
    ])
    |> validate_required([:name, :user_id])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:institution_id)
    |> foreign_key_constraint(:bank_consent_id)
    |> unique_constraint([:external_id, :bank_consent_id],
      name: :accounts_external_id_consent_id_index
    )
  end

  @doc """
  Changeset for syncing accounts from PSD2.
  Includes all PSD2-specific fields.
  """
  def sync_changeset(account, attrs) do
    account
    |> changeset(attrs)
    |> put_change(:is_synced, true)
    |> put_change(:last_synced_at, DateTime.utc_now())
  end

  @doc """
  Checks if an account is a synced bank account.
  """
  def synced?(account) do
    account.is_synced && account.bank_consent_id != nil
  end
end
