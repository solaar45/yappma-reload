defmodule WealthBackend.BankConnections.BankConnection do
  use Ecto.Schema
  import Ecto.Changeset

  @status_values [:active, :error, :disabled]
  @sync_frequency_values [:manual, :daily, :weekly]

  schema "bank_connections" do
    field :name, :string
    field :blz, :string
    field :fints_url, :string
    field :user_id_encrypted, :binary
    field :pin_encrypted, :binary
    field :status, Ecto.Enum, values: @status_values, default: :active
    field :last_sync_at, :utc_datetime
    field :sync_frequency, Ecto.Enum, values: @sync_frequency_values, default: :manual
    field :auto_sync_enabled, :boolean, default: false
    field :last_error, :string
    field :sync_count, :integer, default: 0

    # Virtual fields for input (not stored encrypted)
    field :banking_user_id, :string, virtual: true
    field :banking_pin, :string, virtual: true

    belongs_to :user, WealthBackend.Accounts.User
    belongs_to :institution, WealthBackend.Institutions.Institution
    has_many :bank_accounts, WealthBackend.BankConnections.BankAccount

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(bank_connection, attrs) do
    bank_connection
    |> cast(attrs, [
      :name,
      :blz,
      :fints_url,
      :banking_user_id,
      :banking_pin,
      :status,
      :sync_frequency,
      :auto_sync_enabled,
      :user_id,
      :institution_id
    ])
    |> validate_required([:name, :blz, :fints_url, :user_id])
    |> validate_length(:blz, is: 8)
    |> validate_inclusion(:status, @status_values)
    |> validate_inclusion(:sync_frequency, @sync_frequency_values)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:institution_id)
    |> encrypt_credentials()
  end

  @doc false
  def update_changeset(bank_connection, attrs) do
    bank_connection
    |> cast(attrs, [:name, :status, :sync_frequency, :auto_sync_enabled])
    |> validate_inclusion(:status, @status_values)
    |> validate_inclusion(:sync_frequency, @sync_frequency_values)
  end

  defp encrypt_credentials(changeset) do
    # TODO: Implement encryption with Cloak
    # For now, store as-is (will be implemented in next step)
    changeset
    |> put_change(:user_id_encrypted, get_field(changeset, :banking_user_id))
    |> put_change(:pin_encrypted, get_field(changeset, :banking_pin))
  end

  def status_values, do: @status_values
  def sync_frequency_values, do: @sync_frequency_values
end
