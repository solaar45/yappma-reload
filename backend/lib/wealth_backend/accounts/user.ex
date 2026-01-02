defmodule WealthBackend.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field :name, :string
    field :email, :string
    field :password_hash, :string
    field :currency_default, :string, default: "EUR"

    # Virtual fields (not persisted)
    field :password, :string, virtual: true
    field :password_confirmation, :string, virtual: true

    has_many :institutions, WealthBackend.Accounts.Institution
    has_many :accounts, WealthBackend.Accounts.Account
    has_many :bank_connections, WealthBackend.FinTS.BankConnection

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :email, :currency_default])
    |> validate_required([:name, :email])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/, message: "must be a valid email")
    |> unique_constraint(:email)
  end

  @doc """
  Changeset for user registration with password.
  """
  def registration_changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :email, :password, :password_confirmation, :currency_default])
    |> validate_required([:name, :email, :password])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/, message: "must be a valid email")
    |> validate_length(:password, min: 8, max: 100)
    |> validate_confirmation(:password, message: "does not match password")
    |> unique_constraint(:email)
    |> hash_password()
  end

  defp hash_password(changeset) do
    case get_change(changeset, :password) do
      nil ->
        changeset

      password ->
        changeset
        |> put_change(:password_hash, Bcrypt.hash_pwd_salt(password))
        |> delete_change(:password)
        |> delete_change(:password_confirmation)
    end
  end

  @doc """
  Verifies a password against the stored hash.
  """
  def verify_password(%__MODULE__{password_hash: hash}, password)
      when is_binary(hash) and is_binary(password) do
    Bcrypt.verify_pass(password, hash)
  end

  def verify_password(_, _), do: false
end
