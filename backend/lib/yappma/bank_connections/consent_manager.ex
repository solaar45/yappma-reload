defmodule Yappma.BankConnections.ConsentManager do
  @moduledoc """
  Manages bank consent lifecycle:
  - Creating consent requests
  - Handling OAuth callbacks
  - Refreshing consents
  - Revoking consents
  """

  require Logger
  alias Yappma.Repo
  alias Yappma.Accounts.BankConsent
  alias Yappma.BankConnections.StyxClient

  @doc """
  Creates a new consent request for a user to access a specific bank.
  
  Returns the consent record with an authorization URL that the user needs to visit.
  """
  def create_consent(user_id, aspsp_id, opts \\ []) do
    redirect_url = Keyword.get(opts, :redirect_url, default_redirect_url())
    
    # Get bank details
    with {:ok, aspsp} <- StyxClient.get_aspsp(aspsp_id),
         # Create consent request in Styx
         {:ok, styx_consent} <- StyxClient.create_consent(aspsp_id, redirect_url) do
      
      consent_attrs = %{
        user_id: user_id,
        aspsp_id: aspsp_id,
        aspsp_name: aspsp["name"],
        aspsp_bic: aspsp["bic"],
        consent_id: styx_consent["consentId"],
        authorization_url: styx_consent["authorizationUrl"],
        redirect_url: redirect_url,
        status: "pending",
        valid_until: parse_valid_until(styx_consent["validUntil"]),
        access_scope: styx_consent["access"],
        frequency_per_day: styx_consent["frequencyPerDay"] || 4,
        recurring_indicator: styx_consent["recurringIndicator"] || true
      }

      case BankConsent.create_changeset(consent_attrs) |> Repo.insert() do
        {:ok, consent} ->
          Logger.info("Created consent #{consent.consent_id} for user #{user_id}")
          {:ok, consent}
        
        {:error, changeset} ->
          Logger.error("Failed to create consent: #{inspect(changeset.errors)}")
          {:error, changeset}
      end
    end
  end

  @doc """
  Lists all consents for a user.
  """
  def list_user_consents(user_id) do
    BankConsent
    |> Ecto.Query.where(user_id: ^user_id)
    |> Ecto.Query.order_by(desc: :inserted_at)
    |> Repo.all()
  end

  @doc """
  Gets a consent by its Styx consent ID.
  """
  def get_by_consent_id(consent_id) do
    Repo.get_by(BankConsent, consent_id: consent_id)
  end

  @doc """
  Completes a consent after the user has authorized it at their bank.
  
  This is called after the OAuth callback with the authorization code.
  """
  def complete_consent(consent_id, authorization_code) do
    with consent when not is_nil(consent) <- get_by_consent_id(consent_id),
         {:ok, styx_consent} <- StyxClient.complete_consent(consent_id, authorization_code) do
      
      # Update consent with completion data
      consent
      |> BankConsent.complete_changeset(%{
        status: styx_consent["status"],
        valid_until: parse_valid_until(styx_consent["validUntil"]),
        access_scope: styx_consent["access"]
      })
      |> Repo.update()
    else
      nil ->
        {:error, :consent_not_found}
      
      {:error, reason} ->
        # Mark consent as rejected/failed
        case get_by_consent_id(consent_id) do
          nil -> {:error, :consent_not_found}
          consent ->
            consent
            |> BankConsent.changeset(%{status: "rejected"})
            |> Repo.update()
            {:error, reason}
        end
    end
  end

  @doc """
  Revokes a consent, terminating access to bank accounts.
  """
  def revoke_consent(consent_id) do
    with consent when not is_nil(consent) <- get_by_consent_id(consent_id),
         {:ok, _styx_response} <- StyxClient.revoke_consent(consent_id) do
      
      consent
      |> BankConsent.revoke_changeset()
      |> Repo.update()
    else
      nil -> {:error, :consent_not_found}
      error -> error
    end
  end

  @doc """
  Checks if a consent is still valid and updates its status if needed.
  """
  def check_consent_validity(consent) do
    cond do
      # Already expired/revoked
      consent.status in ["expired", "revoked"] ->
        {:ok, consent}
      
      # Check expiration date
      consent.valid_until && DateTime.compare(consent.valid_until, DateTime.utc_now()) == :lt ->
        consent
        |> BankConsent.expire_changeset()
        |> Repo.update()
      
      # Still valid
      true ->
        {:ok, consent}
    end
  end

  @doc """
  Refreshes consent status from Styx.
  """
  def refresh_consent_status(consent_id) do
    with consent when not is_nil(consent) <- get_by_consent_id(consent_id),
         {:ok, styx_consent} <- StyxClient.get_consent_status(consent_id) do
      
      consent
      |> BankConsent.changeset(%{
        status: styx_consent["status"],
        valid_until: parse_valid_until(styx_consent["validUntil"])
      })
      |> Repo.update()
    else
      nil -> {:error, :consent_not_found}
      error -> error
    end
  end

  # Private helpers

  defp default_redirect_url do
    # Get from config or use default
    Application.get_env(:yappma, :psd2_redirect_url, "http://localhost:5173/bank-callback")
  end

  defp parse_valid_until(nil), do: nil
  defp parse_valid_until(datetime_string) when is_binary(datetime_string) do
    case DateTime.from_iso8601(datetime_string) do
      {:ok, datetime, _offset} -> datetime
      _ -> nil
    end
  end
  defp parse_valid_until(%DateTime{} = datetime), do: datetime
  defp parse_valid_until(_), do: nil
end
