defmodule Yappma.BankConnections do
  @moduledoc """
  The BankConnections context - main API for PSD2 integration.
  """

  alias Yappma.BankConnections.{StyxClient, ConsentManager, AccountSync}

  @doc """
  Lists all available banks (ASPSPs) from Styx.
  """
  defdelegate list_banks, to: StyxClient, as: :list_aspsps

  @doc """
  Gets a specific bank by ASPSP ID.
  """
  defdelegate get_bank(aspsp_id), to: StyxClient, as: :get_aspsp

  @doc """
  Initiates a new consent with a bank.
  
  ## Options
  - `:redirect_url` - URL to redirect user after authorization (required)
  - `:validity_days` - Number of days consent is valid (default: 90)
  """
  def initiate_consent(user_id, aspsp_id, opts \\ []) do
    redirect_url = Keyword.fetch!(opts, :redirect_url)
    
    case StyxClient.create_consent(aspsp_id, redirect_url) do
      {:ok, styx_response} ->
        # Store consent in DB
        consent_attrs = %{
          user_id: user_id,
          external_id: styx_response["consent_id"] || styx_response[:consent_id],
          aspsp_id: aspsp_id,
          status: "pending",
          authorization_url: styx_response["authorization_url"] || styx_response[:authorization_url],
          valid_until: DateTime.add(DateTime.utc_now(), 90, :day)
        }
        
        case ConsentManager.upsert_consent(consent_attrs) do
          {:ok, consent} ->
            # Return response with both external_id and internal id
            {:ok, Map.merge(styx_response, %{
              internal_consent_id: consent.id,
              consent_id: consent.external_id
            })}
          
          {:error, reason} ->
            {:error, reason}
        end
      
      error ->
        error
    end
  end

  @doc """
  Completes consent after user authorization.
  Updates the consent status to "valid" after successful authorization.
  """
  def complete_consent(consent_id, _authorization_code \\ nil) do
    case ConsentManager.update_consent_status(consent_id, "valid") do
      {:ok, consent} ->
        {:ok, %{
          status: "valid",
          consent_id: consent.external_id,
          valid_until: consent.valid_until
        }}
      
      {:error, :not_found} ->
        {:error, :consent_not_found}
      
      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Gets consent status from Styx.
  """
  def get_consent_status(consent_id) do
    StyxClient.get_consent_status(consent_id)
  end

  @doc """
  Lists all consents for a user.
  """
  defdelegate list_user_consents(user_id), to: ConsentManager

  @doc """
  Revokes a consent.
  """
  def revoke_consent(consent_id) do
    # Just revoke in DB - Styx might not have a delete endpoint in mock mode
    ConsentManager.revoke_consent(consent_id)
  end

  @doc """
  Lists accounts for a consent.
  """
  def list_accounts(consent_id) do
    StyxClient.get_accounts(consent_id)
  end

  @doc """
  Syncs accounts and transactions for a consent.
  
  This:
  1. Fetches accounts from Styx
  2. Stores/updates them in YAPPMA database
  3. Fetches and stores transactions (TODO)
  """
  def sync_accounts(user_id, external_consent_id) when is_binary(external_consent_id) do
    # Get or create internal DB consent ID (also ensures user_id is valid integer)
    case ConsentManager.get_or_create_consent_id(external_consent_id, user_id) do
      {:ok, internal_consent_id} ->
        # Get the consent to retrieve the validated user_id
        consent = ConsentManager.get_consent(internal_consent_id)
        AccountSync.sync_user_accounts(consent.user_id, internal_consent_id, external_consent_id)
      
      {:error, reason} ->
        {:error, reason}
    end
  end
end
