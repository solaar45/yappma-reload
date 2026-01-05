defmodule WealthBackend.Banking.BankConsent do
  use Ecto.Schema
  import Ecto.Changeset

  alias WealthBackend.Accounts.User

  @type t :: %__MODULE__{
          id: integer(),
          user_id: integer(),
          external_id: String.t(),
          aspsp_id: String.t(),
          aspsp_name: String.t() | nil,
          aspsp_bic: String.t() | nil,
          status: String.t(),
          valid_until: NaiveDateTime.t() | nil,
          last_used_at: NaiveDateTime.t() | nil,
          redirect_url: String.t() | nil,
          user: User.t() | Ecto.Association.NotLoaded.t(),
          inserted_at: NaiveDateTime.t(),
          updated_at: NaiveDateTime.t()
        }

  schema "bank_consents" do
    field :external_id, :string
    field :aspsp_id, :string
    field :aspsp_name, :string
    field :aspsp_bic, :string
    field :status, :string
    field :valid_until, :naive_datetime
    field :last_used_at, :naive_datetime
    field :redirect_url, :string

    belongs_to :user, User

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(user_id external_id aspsp_id status)a
  @optional_fields ~w(aspsp_name aspsp_bic valid_until last_used_at redirect_url)a

  @doc false
  def changeset(bank_consent, attrs) do
    bank_consent
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:status, ["pending", "authorized", "valid", "expired", "revoked", "rejected"])
    |> foreign_key_constraint(:user_id)
    |> unique_constraint(:external_id)
  end
end
