defmodule Yappma.Accounts.BankConsent do
  @moduledoc """
  Schema for PSD2 bank consents.
  
  A consent represents the user's authorization for YAPPMA to access
  their bank account data via PSD2 XS2A APIs through Styx.
  
  Consent lifecycle:
  1. pending - Created, waiting for user authorization
  2. valid - User authorized, can access accounts
  3. expired - 90 days passed (PSD2 limit)
  4. revoked - User or bank revoked access
  5. rejected - User rejected authorization
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @statuses ~w(pending valid expired revoked rejected)

  schema "bank_consents" do
    belongs_to :user, Yappma.Accounts.User
    
    # Bank identification
    field :aspsp_id, :string
    field :aspsp_name, :string
    field :aspsp_bic, :string
    
    # Consent from Styx/PSD2
    field :consent_id, :string
    field :status, :string
    
    # OAuth flow
    field :authorization_url, :string
    field :redirect_url, :string
    
    # Validity
    field :valid_until, :utc_datetime
    field :last_used_at, :utc_datetime
    
    # Metadata
    field :access_scope, :map
    field :frequency_per_day, :integer
    field :recurring_indicator, :boolean
    
    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(consent, attrs) do
    consent
    |> cast(attrs, [
      :user_id,
      :aspsp_id,
      :aspsp_name,
      :aspsp_bic,
      :consent_id,
      :status,
      :authorization_url,
      :redirect_url,
      :valid_until,
      :last_used_at,
      :access_scope,
      :frequency_per_day,
      :recurring_indicator
    ])
    |> validate_required([
      :user_id,
      :aspsp_id,
      :consent_id,
      :status
    ])
    |> validate_inclusion(:status, @statuses)
    |> unique_constraint(:consent_id)
    |> foreign_key_constraint(:user_id)
  end

  @doc """
  Creates a changeset for a new consent request.
  """
  def create_changeset(attrs) do
    %__MODULE__{}
    |> changeset(attrs)
    |> put_change(:status, "pending")
    |> put_change(:frequency_per_day, 4)
    |> put_change(:recurring_indicator, true)
  end

  @doc """
  Marks consent as valid after user authorization.
  """
  def authorize_changeset(consent, attrs \\ %{}) do
    consent
    |> changeset(attrs)
    |> put_change(:status, "valid")
    |> put_change(:last_used_at, DateTime.utc_now())
  end

  @doc """
  Revokes a consent.
  """
  def revoke_changeset(consent) do
    consent
    |> change()
    |> put_change(:status, "revoked")
  end

  @doc """
  Checks if consent is still valid and not expired.
  """
  def valid?(%__MODULE__{status: "valid", valid_until: valid_until}) do
    DateTime.compare(DateTime.utc_now(), valid_until) == :lt
  end

  def valid?(_), do: false

  @doc """
  Checks if consent needs renewal (expires within 7 days).
  """
  def needs_renewal?(%__MODULE__{status: "valid", valid_until: valid_until}) do
    days_until_expiry = DateTime.diff(valid_until, DateTime.utc_now(), :day)
    days_until_expiry <= 7 and days_until_expiry > 0
  end

  def needs_renewal?(_), do: false
end
