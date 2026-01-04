defmodule WealthBackend.Accounts.BankConsent do
  @moduledoc """
  Schema for bank consents from PSD2/Styx integration.
  
  Represents a user's authorization for YAPPMA to access their bank accounts
  via PSD2 API through Styx middleware.
  """
  use Ecto.Schema
  import Ecto.Changeset

  schema "bank_consents" do
    field :aspsp_id, :string
    field :aspsp_name, :string
    field :aspsp_bic, :string
    
    # External consent ID from Styx/Bank
    field :external_id, :string
    field :status, :string, default: "pending"
    
    field :authorization_url, :string
    field :redirect_url, :string
    
    field :valid_until, :utc_datetime
    field :last_used_at, :utc_datetime
    
    field :access_scope, :map
    field :frequency_per_day, :integer, default: 4
    field :recurring_indicator, :boolean, default: true

    belongs_to :user, WealthBackend.Accounts.User

    timestamps(type: :utc_datetime)
  end

  @statuses ~w(pending authorized valid expired revoked rejected)

  @doc false
  def changeset(consent, attrs) do
    consent
    |> cast(attrs, [
      :user_id, :aspsp_id, :aspsp_name, :aspsp_bic,
      :external_id, :status, :authorization_url, :redirect_url,
      :valid_until, :last_used_at, :access_scope,
      :frequency_per_day, :recurring_indicator
    ])
    |> validate_required([:user_id, :aspsp_id, :status])
    |> validate_inclusion(:status, @statuses)
    |> unique_constraint(:external_id)
    |> foreign_key_constraint(:user_id)
  end

  @doc """
  Changeset for creating a new consent request.
  """
  def create_changeset(attrs) do
    %__MODULE__{}
    |> changeset(attrs)
    |> put_change(:status, "pending")
  end

  @doc """
  Changeset for completing a consent after user authorization.
  """
  def complete_changeset(consent, attrs) do
    consent
    |> changeset(attrs)
    |> put_change(:status, "valid")
    |> put_change(:last_used_at, DateTime.utc_now())
  end

  @doc """
  Changeset for revoking a consent.
  """
  def revoke_changeset(consent) do
    consent
    |> change(status: "revoked")
    |> put_change(:last_used_at, DateTime.utc_now())
  end

  @doc """
  Changeset for marking a consent as expired.
  """
  def expire_changeset(consent) do
    consent
    |> change(status: "expired")
  end

  @doc """
  Checks if a consent is still valid.
  """
  def valid?(consent) do
    consent.status in ["valid", "authorized"] &&
      (consent.valid_until == nil || DateTime.compare(consent.valid_until, DateTime.utc_now()) == :gt)
  end

  @doc """
  Checks if a consent is pending authorization.
  """
  def pending?(consent) do
    consent.status == "pending"
  end
end
