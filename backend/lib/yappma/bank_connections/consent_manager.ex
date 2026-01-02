defmodule Yappma.BankConnections.ConsentManager do
  @moduledoc """
  Manages consent lifecycle for bank connections.
  
  Stores consent information in the database and handles
  the OAuth2-like flow for PSD2 account access.
  """

  import Ecto.Query
  alias Yappma.Repo
  alias Yappma.BankConnections.StyxClient
  alias Yappma.Accounts.BankConsent

  @doc """
  Creates a new consent request.
  """
  def create_consent(user_id, aspsp_id, opts) do
    redirect_url = Keyword.get(opts, :redirect_url)
    
    # Get bank info first
    {:ok, bank_info} = StyxClient.get_aspsp(aspsp_id)
    
    params = %{
      psu_id: "user_#{user_id}",
      redirect_url: redirect_url,
      accounts: Keyword.get(opts, :accounts, []),
      valid_until: Keyword.get(opts, :valid_until)
    }

    with {:ok, styx_response} <- StyxClient.create_consent(aspsp_id, params) do
      # Store consent in database
      consent_attrs = %{
        user_id: user_id,
        aspsp_id: aspsp_id,
        aspsp_name: bank_info["name"],
        aspsp_bic: bank_info["bic"],
        consent_id: styx_response["consentId"],
        status: "pending",
        authorization_url: get_in(styx_response, ["_links", "scaRedirect", "href"]),
        redirect_url: redirect_url,
        valid_until: parse_datetime(styx_response["validUntil"]),
        access_scope: styx_response["access"]
      }

      case BankConsent.create_changeset(consent_attrs) |> Repo.insert() do
        {:ok, consent} ->
          {:ok, %{
            id: consent.id,
            consent_id: consent.consent_id,
            authorization_url: consent.authorization_url,
            status: consent.status
          }}
        
        {:error, changeset} ->
          {:error, changeset}
      end
    end
  end

  @doc """
  Lists all consents for a user.
  """
  def list_user_consents(user_id) do
    BankConsent
    |> where([c], c.user_id == ^user_id)
    |> order_by([c], desc: c.inserted_at)
    |> Repo.all()
  end

  @doc """
  Gets a consent by consent_id.
  """
  def get_by_consent_id(consent_id) do
    Repo.get_by(BankConsent, consent_id: consent_id)
  end

  @doc """
  Completes consent after user authorization.
  """
  def complete_consent(consent_id, _authorization_code) do
    consent = get_by_consent_id(consent_id)

    if consent do
      # Check consent status with Styx
      with {:ok, styx_status} <- StyxClient.get_consent_status(consent_id) do
        if styx_status["consentStatus"] == "valid" do
          # Update consent in database
          consent
          |> BankConsent.authorize_changeset()
          |> Repo.update()

          # Fetch accounts to verify access
          {:ok, accounts} = StyxClient.get_accounts(consent_id)
          
          {:ok, %{
            consent_id: consent_id,
            consent_status: "valid",
            accounts: accounts
          }}
        else
          # Update status
          consent
          |> Ecto.Changeset.change(%{status: styx_status["consentStatus"]})
          |> Repo.update()

          {:error, {:consent_not_valid, styx_status["consentStatus"]}}
        end
      end
    else
      {:error, :consent_not_found}
    end
  end

  @doc """
  Revokes a consent.
  """
  def revoke_consent(consent_id) do
    consent = get_by_consent_id(consent_id)

    if consent do
      with {:ok, _result} <- StyxClient.delete_consent(consent_id) do
        consent
        |> BankConsent.revoke_changeset()
        |> Repo.update()

        {:ok, %{status: "revoked"}}
      end
    else
      {:error, :consent_not_found}
    end
  end

  @doc """
  Checks if a consent is still valid.
  """
  def valid_consent?(consent_id) do
    case get_by_consent_id(consent_id) do
      %BankConsent{} = consent -> BankConsent.valid?(consent)
      nil -> false
    end
  end

  @doc """
  Gets consent status from Styx and updates database.
  """
  def refresh_consent_status(consent_id) do
    consent = get_by_consent_id(consent_id)

    if consent do
      case StyxClient.get_consent_status(consent_id) do
        {:ok, styx_status} ->
          consent
          |> Ecto.Changeset.change(%{
            status: styx_status["consentStatus"],
            last_used_at: DateTime.utc_now()
          })
          |> Repo.update()

          {:ok, styx_status}
        
        error -> error
      end
    else
      {:error, :consent_not_found}
    end
  end

  defp parse_datetime(nil), do: nil
  defp parse_datetime(date_string) when is_binary(date_string) do
    case DateTime.from_iso8601(date_string <> "T00:00:00Z") do
      {:ok, datetime, _} -> datetime
      _ -> nil
    end
  end
end
