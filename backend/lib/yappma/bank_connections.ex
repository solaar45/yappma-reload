defmodule Yappma.BankConnections do
  @moduledoc """
  Context module for managing bank connections via Styx PSD2 API.
  
  This module provides functions to:
  - List available banks (ASPSPs)
  - Initiate consent for account access
  - Retrieve account information
  - Fetch transactions
  - Manage consent lifecycle
  """

  alias Yappma.BankConnections.StyxClient
  alias Yappma.BankConnections.ConsentManager
  alias Yappma.BankConnections.AccountSync

  @doc """
  Lists all available banks (ASPSPs) configured in Styx.
  
  ## Examples
  
      iex> list_banks()
      {:ok, [%{name: "DKB Bank", bic: "BYLADEM1001", ...}]}
  """
  def list_banks do
    StyxClient.list_aspsps()
  end

  @doc """
  Gets bank details by BIC or ASPSP ID.
  
  ## Examples
  
      iex> get_bank("BYLADEM1001")
      {:ok, %{name: "DKB Bank", ...}}
  """
  def get_bank(bic_or_id) do
    StyxClient.get_aspsp(bic_or_id)
  end

  @doc """
  Initiates a consent request for account access.
  
  Returns a consent URL that the user needs to visit to authorize access.
  
  ## Parameters
  
    - user_id: The YAPPMA user ID
    - aspsp_id: The bank identifier (e.g., "dkb-bank-de")
    - opts: Options like redirect_url, accounts to access, etc.
  
  ## Examples
  
      iex> initiate_consent(user_id, "dkb-bank-de", redirect_url: "https://yappma.local/callback")
      {:ok, %{consent_id: "abc123", authorization_url: "https://..."}}
  """
  def initiate_consent(user_id, aspsp_id, opts \\ []) do
    ConsentManager.create_consent(user_id, aspsp_id, opts)
  end

  @doc """
  Completes the consent flow after user authorization.
  
  ## Parameters
  
    - consent_id: The consent ID from initiate_consent
    - authorization_code: The code received from the redirect callback
  
  ## Examples
  
      iex> complete_consent("abc123", "auth_code_xyz")
      {:ok, %{consent_status: "valid", accounts: [...]}}
  """
  def complete_consent(consent_id, authorization_code) do
    ConsentManager.complete_consent(consent_id, authorization_code)
  end

  @doc """
  Lists all bank consents for a user.
  
  ## Examples
  
      iex> list_user_consents(user_id)
      [%Yappma.Accounts.BankConsent{}, ...]
  """
  def list_user_consents(user_id) do
    ConsentManager.list_user_consents(user_id)
  end

  @doc """
  Lists all accounts accessible with a given consent.
  
  ## Examples
  
      iex> list_accounts(consent_id)
      {:ok, [%{iban: "DE...", name: "Girokonto", balance: ...}]}
  """
  def list_accounts(consent_id) do
    StyxClient.get_accounts(consent_id)
  end

  @doc """
  Gets detailed information for a specific account.
  
  ## Examples
  
      iex> get_account(consent_id, account_id)
      {:ok, %{iban: "DE...", balance: %{amount: 1234.56, currency: "EUR"}}}
  """
  def get_account(consent_id, account_id) do
    StyxClient.get_account_details(consent_id, account_id)
  end

  @doc """
  Fetches transactions for an account.
  
  ## Parameters
  
    - consent_id: The consent ID
    - account_id: The account ID
    - opts: Options like date_from, date_to, booking_status
  
  ## Examples
  
      iex> get_transactions(consent_id, account_id, date_from: ~D[2024-01-01])
      {:ok, [%{transaction_id: "...", amount: -12.34, creditor_name: "EDEKA"}]}
  """
  def get_transactions(consent_id, account_id, opts \\ []) do
    StyxClient.get_transactions(consent_id, account_id, opts)
  end

  @doc """
  Syncs accounts and transactions for a user.
  
  This creates/updates accounts and imports new transactions into YAPPMA.
  
  ## Examples
  
      iex> sync_accounts(user_id, consent_id)
      {:ok, %{accounts_synced: 2, transactions_imported: 45}}
  """
  def sync_accounts(user_id, consent_id) do
    AccountSync.sync_user_accounts(user_id, consent_id)
  end

  @doc """
  Checks the status of a consent.
  
  ## Examples
  
      iex> get_consent_status(consent_id)
      {:ok, %{status: "valid", valid_until: ~U[2024-03-01 00:00:00Z]}}
  """
  def get_consent_status(consent_id) do
    StyxClient.get_consent_status(consent_id)
  end

  @doc """
  Revokes a consent.
  
  ## Examples
  
      iex> revoke_consent(consent_id)
      {:ok, %{status: "revoked"}}
  """
  def revoke_consent(consent_id) do
    ConsentManager.revoke_consent(consent_id)
  end
end
