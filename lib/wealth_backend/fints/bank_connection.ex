defmodule WealthBackend.FinTS.BankConnection do
  use Ecto.Schema
  import Ecto.Changeset

  schema "bank_connections" do
    field :name, :string
    field :blz, :string
    field :user_id_fints, :string
    field :pin_encrypted, WealthBackend.Encrypted.Binary
    field :fints_url, :string
    field :status, :string, default: "active"
    field :last_sync_at, :utc_datetime
    field :error_message, :string

    # Virtual field for PIN input (not persisted)
    field :pin, :string, virtual: true

    belongs_to :user, WealthBackend.Accounts.User
    has_many :bank_accounts, WealthBackend.FinTS.BankAccount

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(bank_connection, attrs) do
    bank_connection
    |> cast(attrs, [
      :name,
      :blz,
      :user_id_fints,
      :pin,
      :fints_url,
      :status,
      :last_sync_at,
      :error_message,
      :user_id
    ])
    |> validate_required([:name, :blz, :user_id_fints, :fints_url, :user_id])
    |> validate_length(:name, min: 1, max: 255)
    |> validate_length(:blz, is: 8)
    |> validate_format(:fints_url, ~r/^https?:\/\/.+/)
    |> validate_inclusion(:status, ["active", "inactive", "error"])
    |> encrypt_pin()
    |> unique_constraint([:user_id, :blz, :user_id_fints],
      name: :bank_connections_unique_per_user,
      message: "connection already exists for this user"
    )
  end

  defp encrypt_pin(changeset) do
    case get_change(changeset, :pin) do
      nil -> changeset
      pin when is_binary(pin) ->
        put_change(changeset, :pin_encrypted, pin)
    end
  end
end
