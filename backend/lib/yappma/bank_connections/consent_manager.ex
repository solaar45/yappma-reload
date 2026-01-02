defmodule Yappma.BankConnections.ConsentManager do
  @moduledoc """
  Manages consent lifecycle for bank connections.
  
  Stores consent information in the database and handles
  the OAuth2-like flow for PSD2 account access.
  """

  import Ecto.Query
  alias Yappma.Repo
  alias Yappma.BankConnections.StyxClient
  # TODO: Create schema - alias Yappma.Accounts.BankConsent

  @doc """
  Creates a new consent request.
  """
  def create_consent(user_id, aspsp_id, opts) do
    redirect_url = Keyword.get(opts, :redirect_url)
    
    params = %{
      psu_id: "user_#{user_id}",
      redirect_url: redirect_url,
      accounts: Keyword.get(opts, :accounts, []),
      valid_until: Keyword.get(opts, :valid_until)
    }

    with {:ok, styx_response} <- StyxClient.create_consent(aspsp_id, params) do
      # TODO: Store consent in database
      # consent_data = %{
      #   user_id: user_id,
      #   aspsp_id: aspsp_id,
      #   consent_id: styx_response["consentId"],
      #   status: styx_response["consentStatus"],
      #   authorization_url: styx_response["_links"]["scaRedirect"]["href"],
      #   valid_until: styx_response["validUntil"]
      # }
      # 
      # %BankConsent{}
      # |> BankConsent.changeset(consent_data)
      # |> Repo.insert()

      {:ok, %{
        consent_id: styx_response["consentId"],
        authorization_url: styx_response["_links"]["scaRedirect"]["href"],
        status: styx_response["consentStatus"]
      }}
    end
  end

  @doc """
  Completes consent after user authorization.
  """
  def complete_consent(consent_id, _authorization_code) do
    # After redirect, check consent status
    with {:ok, status} <- StyxClient.get_consent_status(consent_id) do
      # TODO: Update consent in database
      # consent = Repo.get_by(BankConsent, consent_id: consent_id)
      # consent
      # |> BankConsent.changeset(%{status: status["consentStatus"]})
      # |> Repo.update()

      if status["consentStatus"] == "valid" do
        # Fetch accounts to verify access
        {:ok, accounts} = StyxClient.get_accounts(consent_id)
        
        {:ok, %{
          consent_status: "valid",
          accounts: accounts
        }}
      else
        {:error, {:consent_not_valid, status["consentStatus"]}}
      end
    end
  end

  @doc """
  Revokes a consent.
  """
  def revoke_consent(consent_id) do
    with {:ok, _result} <- StyxClient.delete_consent(consent_id) do
      # TODO: Update database
      # consent = Repo.get_by(BankConsent, consent_id: consent_id)
      # consent
      # |> BankConsent.changeset(%{status: "revoked"})
      # |> Repo.update()

      {:ok, %{status: "revoked"}}
    end
  end

  @doc """
  Checks if a consent is still valid.
  """
  def valid_consent?(consent_id) do
    case StyxClient.get_consent_status(consent_id) do
      {:ok, %{"consentStatus" => "valid"}} -> true
      _ -> false
    end
  end
end
