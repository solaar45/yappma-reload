defmodule Yappma.Accounts.Account do
  use Ecto.Schema
  import Ecto.Changeset

  schema "accounts" do
    field :name, :string
    field :type, :string
    field :currency, :string
    field :is_active, :boolean, default: true
    field :opened_at, :date
    field :closed_at, :date

    # PSD2 Integration Fields
    field :external_id, :string
    field :iban, :string
    field :bic, :string
    field :bank_name, :string
    field :account_product, :string

    # Sync metadata
    field :last_synced_at, :utc_datetime
    field :sync_enabled, :boolean, default: true

    # Relationships
    belongs_to :user, Yappma.Accounts.User
    belongs_to :institution, Yappma.Accounts.Institution
    belongs_to :bank_consent, Yappma.Accounts.BankConsent

    has_many :account_snapshots, Yappma.Accounts.AccountSnapshot

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(account, attrs) do
    account
    |> cast(attrs, [
      :name,
      :type,
      :currency,
      :is_active,
      :opened_at,
      :closed_at,
      :external_id,
      :iban,
      :bic,
      :bank_name,
      :account_product,
      :last_synced_at,
      :sync_enabled,
      :user_id,
      :institution_id,
      :bank_consent_id
    ])
    |> validate_required([:name, :type, :currency, :user_id])
    |> validate_inclusion(:type, ["checking", "savings", "credit_card", "investment", "loan", "other"])
    |> validate_length(:name, min: 1, max: 255)
    |> validate_length(:currency, is: 3)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:institution_id)
    |> foreign_key_constraint(:bank_consent_id)
    |> unique_constraint([:external_id, :bank_consent_id],
      name: :accounts_external_id_bank_consent_id_index
    )
  end
end
