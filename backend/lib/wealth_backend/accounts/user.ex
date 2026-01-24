defmodule WealthBackend.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  @valid_roles ~w(user admin super_admin read_only)

  schema "users" do
    field :email, :string
    field :password, :string, virtual: true, redact: true
    field :hashed_password, :string, redact: true
    field :current_password, :string, virtual: true, redact: true
    field :confirmed_at, :utc_datetime

    # Existing fields
    field :name, :string
    field :currency_default, :string, default: "EUR"
    field :tax_allowance_limit, :integer, default: 1000
    field :tax_status, :string, default: "single"

    # Multi-user/Admin fields
    field :role, :string, default: "user"
    field :is_active, :boolean, default: true
    field :last_login_at, :utc_datetime
    field :login_count, :integer, default: 0
    field :deactivated_at, :utc_datetime
    field :force_password_change, :boolean, default: false

    # Associations
    belongs_to :created_by_user, __MODULE__
    belongs_to :deactivated_by_user, __MODULE__
    has_many :institutions, WealthBackend.Accounts.Institution
    has_many :accounts, WealthBackend.Accounts.Account
    has_many :tax_exemptions, WealthBackend.Taxes.TaxExemption

    timestamps(type: :utc_datetime)
  end

  @doc """
  A user changeset for registration.

  It is important to validate the length of both email and password.
  Otherwise databases may truncate the email without warnings, which
  could lead to unpredictable or insecure behaviour. Long passwords may
  also be very expensive to hash for certain algorithms.

  ## Options

    * `:hash_password` - Hashes the password so it can be stored securely
      in the database and ensures the password field is cleared to prevent
      leaks in the logs. If password hashing is not needed and clearing the
      password field is not desired (like when using this changeset for
      validations on a LiveView form), this option can be set to `false`.
      Defaults to `true`.

    * `:validate_email` - Validates the uniqueness of the email, in case
      you don't want to validate the uniqueness of the email (like when
      using this changeset for validations on a LiveView form before
      submitting the form), this option can be set to `false`.
      Defaults to `true`.
  """
  def registration_changeset(user, attrs, opts \\ []) do
    user
    |> cast(attrs, [:email, :password, :name, :currency_default, :tax_allowance_limit, :tax_status])
    |> validate_email(opts)
    |> validate_password(opts)
    |> validate_required([:name])
    |> validate_inclusion(:tax_status, ~w(single married))
    |> validate_number(:tax_allowance_limit, greater_than_or_equal_to: 0)
  end

  @doc """
  Admin registration changeset - allows setting role and other admin fields.
  """
  def admin_registration_changeset(user, attrs, opts \\ []) do
    user
    |> cast(attrs, [:email, :password, :name, :role, :currency_default, :tax_allowance_limit, :tax_status])
    |> validate_email(opts)
    |> validate_password(opts)
    |> validate_required([:name])
    |> validate_inclusion(:role, @valid_roles)
    |> validate_inclusion(:tax_status, ~w(single married))
    |> validate_number(:tax_allowance_limit, greater_than_or_equal_to: 0)
  end

  @doc """
  Admin changeset for updating user fields that only admins can change.
  """
  def admin_changeset(user, attrs) do
    user
    |> cast(attrs, [
      :email, :name, :role, :is_active, :currency_default,
      :tax_allowance_limit, :tax_status, :deactivated_at, :deactivated_by_user_id
    ])
    |> validate_required([:email, :name, :role])
    |> validate_format(:email, ~r/^[^\s]+$/, message: "must have no spaces")
    |> validate_length(:email, max: 160)
    |> validate_inclusion(:role, @valid_roles)
    |> validate_inclusion(:tax_status, ~w(single married))
    |> validate_number(:tax_allowance_limit, greater_than_or_equal_to: 0)
    |> validate_role_change()
    |> unique_constraint(:email)
  end

  @doc """
  Admin password reset changeset - allows admin to reset password without knowing current one.
  """
  def admin_password_reset_changeset(user, attrs) do
    user
    |> cast(attrs, [:password, :force_password_change])
    |> validate_required([:password])
    |> validate_password([])
  end

  @doc """
  A user changeset for updating settings like name, currency, and tax preferences.
  Does not require or validate password.
  """
  def settings_changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :currency_default, :tax_allowance_limit, :tax_status])
    |> validate_inclusion(:tax_status, ~w(single married))
    |> validate_number(:tax_allowance_limit, greater_than_or_equal_to: 0)
  end

  defp validate_email(changeset, opts) do
    changeset
    |> validate_required([:email])
    |> validate_format(:email, ~r/^[^\s]+$/, message: "must have no spaces")
    |> validate_length(:email, max: 160)
    |> maybe_validate_unique_email(opts)
  end

  defp validate_password(changeset, opts) do
    changeset
    |> validate_required([:password])
    |> validate_length(:password, min: 16, max: 72)
    |> validate_format(:password, ~r/[a-z]/, message: "must have at least one lower case character")
    |> validate_format(:password, ~r/[A-Z]/, message: "must have at least one upper case character")
    |> validate_format(:password, ~r/[0-9]/, message: "must have at least one number")
    |> validate_format(:password, ~r/[!?@#$%^&*_0-9]/, message: "must have at least one special character")
    |> maybe_hash_password(opts)
  end

  defp maybe_hash_password(changeset, opts) do
    hash_password? = Keyword.get(opts, :hash_password, true)
    password = get_change(changeset, :password)

    if hash_password? && password && changeset.valid? do
      changeset
      # If using Bcrypt, then further validate it is at most 72 bytes long
      |> validate_length(:password, max: 72, count: :bytes)
      # Hashing could be done with `Ecto.Changeset.prepare_changes/2`, but that
      # would keep the database transaction open longer and hurt performance.
      |> put_change(:hashed_password, Bcrypt.hash_pwd_salt(password))
      |> delete_change(:password)
    else
      changeset
    end
  end

  defp maybe_validate_unique_email(changeset, opts) do
    if Keyword.get(opts, :validate_email, true) do
      changeset
      |> unsafe_validate_unique(:email, WealthBackend.Repo)
      |> unique_constraint(:email)
    else
      changeset
    end
  end

  # Validates that super_admin role cannot be changed
  defp validate_role_change(changeset) do
    case get_field(changeset, :role) do
      "super_admin" ->
        # Prevent changing super_admin role
        if get_change(changeset, :role) && get_field(changeset, :role, :original) == "super_admin" do
          add_error(changeset, :role, "cannot change super admin role")
        else
          changeset
        end
      _ ->
        changeset
    end
  end

  @doc """
  A user changeset for changing the email.

  It requires the email to change otherwise an error is added.
  """
  def email_changeset(user, attrs, opts \\ []) do
    user
    |> cast(attrs, [:email])
    |> validate_email(opts)
    |> case do
      %{changes: %{email: _}} = changeset -> changeset
      %{} = changeset -> add_error(changeset, :email, "did not change")
    end
  end

  @doc """
  A user changeset for changing the password.

  ## Options

    * `:hash_password` - Hashes the password so it can be stored securely
      in the database and ensures the password field is cleared to prevent
      leaks in the logs. If password hashing is not needed and clearing the
      password field is not desired (like when using this changeset for
      validations on a LiveView form), this option can be set to `false`.
      Defaults to `true`.
  """
  def password_changeset(user, attrs, opts \\ []) do
    user
    |> cast(attrs, [:password])
    |> validate_confirmation(:password, message: "does not match password")
    |> validate_password(opts)
  end

  @doc """
  Confirms the account by setting `confirmed_at`.
  """
  def confirm_changeset(user) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    change(user, confirmed_at: now)
  end

  @doc """
  Updates login tracking fields.
  """
  def login_changeset(user) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    change(user, 
      last_login_at: now,
      login_count: (user.login_count || 0) + 1
    )
  end

  @doc """
  Verifies the password.

  If there is no user or the user doesn't have a password, we call
  `Bcrypt.no_user_verify/0` to avoid timing attacks.
  """
  def valid_password?(%WealthBackend.Accounts.User{hashed_password: hashed_password}, password)
      when is_binary(hashed_password) and byte_size(password) > 0 do
    Bcrypt.verify_pass(password, hashed_password)
  end

  def valid_password?(_, _) do
    Bcrypt.no_user_verify()
    false
  end

  @doc """
  Validates the current password otherwise adds an error to the changeset.
  """
  def validate_current_password(changeset, password) do
    changeset = cast(changeset, %{current_password: password}, [:current_password])

    if valid_password?(changeset.data, password) do
      changeset
    else
      add_error(changeset, :current_password, "is not valid")
    end
  end

  @doc """
  Checks if user is an admin (admin or super_admin).
  """
  def is_admin?(%__MODULE__{role: role}) when role in ["admin", "super_admin"], do: true
  def is_admin?(_), do: false

  @doc """
  Checks if user is a super admin.
  """
  def is_super_admin?(%__MODULE__{role: "super_admin"}), do: true
  def is_super_admin?(_), do: false

  @doc """
  Checks if user account is active.
  """
  def is_active?(%__MODULE__{is_active: true}), do: true
  def is_active?(_), do: false

  @doc """
  Returns list of valid roles.
  """
  def valid_roles, do: @valid_roles
end
