defmodule WealthBackendWeb.BankConnectionController do
  use WealthBackendWeb, :controller

  alias WealthBackend.BankConnections

  action_fallback WealthBackendWeb.FallbackController

  @doc """
  GET /api/bank-connections/banks
  Lists all available banks (ASPSPs)
  """
  def list_banks(conn, _params) do
    case BankConnections.list_banks() do
      {:ok, banks} ->
        json(conn, banks)

      {:error, {:request_failed, :econnrefused}} ->
        # Styx not running - return mock data for UI testing
        json(conn, mock_banks())

      {:error, reason} ->
        conn
        |> put_status(:service_unavailable)
        |> json(%{error: "Failed to load banks", reason: inspect(reason)})
    end
  end

  @doc """
  GET /api/bank-connections/banks/:id
  Get details for a specific bank
  """
  def get_bank(conn, %{"id" => aspsp_id}) do
    case BankConnections.get_bank(aspsp_id) do
      {:ok, bank} ->
        json(conn, bank)

      {:error, {:request_failed, :econnrefused}} ->
        # Styx not running - return mock data
        bank = Enum.find(mock_banks(), &(&1.aspsp_id == aspsp_id))

        if bank do
          json(conn, bank)
        else
          conn
          |> put_status(:not_found)
          |> json(%{error: "Bank not found"})
        end

      {:error, reason} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Bank not found", reason: inspect(reason)})
    end
  end

  @doc """
  POST /api/bank-connections/consents
  Initiates a new consent request
  
  Body:
    - aspsp_id: Bank identifier
    - redirect_url: Callback URL after authorization
  """
  def create_consent(conn, %{"aspsp_id" => aspsp_id, "redirect_url" => redirect_url}) do
    user_id = conn.assigns[:current_user_id] || 1  # TODO: Get from proper auth

    case BankConnections.initiate_consent(user_id, aspsp_id, redirect_url: redirect_url) do
      {:ok, consent_data} ->
        conn
        |> put_status(:created)
        |> json(consent_data)

      {:error, {:request_failed, :econnrefused}} ->
        # Styx not running - return mock consent
        mock_consent = %{
          consent_id: "mock-consent-#{:rand.uniform(999999)}",
          authorization_url: "#{redirect_url}?consent_id=mock-consent-123&status=authorized",
          status: "pending",
          aspsp_id: aspsp_id,
          user_id: user_id,
          created_at: DateTime.utc_now() |> DateTime.to_iso8601()
        }

        conn
        |> put_status(:created)
        |> json(mock_consent)

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Failed to create consent", reason: inspect(reason)})
    end
  end

  @doc """
  GET /api/bank-connections/consents
  Lists all consents for the current user
  """
  def list_consents(conn, _params) do
    user_id = conn.assigns[:current_user_id] || 1  # TODO: Get from proper auth
    consents = BankConnections.list_user_consents(user_id)
    json(conn, consents)
  end

  @doc """
  GET /api/bank-connections/consents/:id
  Gets consent status
  """
  def get_consent(conn, %{"id" => consent_id}) do
    case BankConnections.get_consent_status(consent_id) do
      {:ok, status} ->
        json(conn, status)

      {:error, reason} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Consent not found", reason: inspect(reason)})
    end
  end

  @doc """
  POST /api/bank-connections/consents/:id/complete
  Completes consent after user authorization
  """
  def complete_consent(conn, %{"id" => consent_id} = params) do
    auth_code = params["authorization_code"]

    case BankConnections.complete_consent(consent_id, auth_code) do
      {:ok, result} ->
        json(conn, result)

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Failed to complete consent", reason: inspect(reason)})
    end
  end

  @doc """
  DELETE /api/bank-connections/consents/:id
  Revokes a consent
  """
  def delete_consent(conn, %{"id" => consent_id}) do
    case BankConnections.revoke_consent(consent_id) do
      {:ok, _result} ->
        send_resp(conn, :no_content, "")

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Failed to revoke consent", reason: inspect(reason)})
    end
  end

  @doc """
  GET /api/bank-connections/consents/:id/accounts
  Lists accounts for a consent
  """
  def list_accounts(conn, %{"id" => consent_id}) do
    case BankConnections.list_accounts(consent_id) do
      {:ok, accounts} ->
        json(conn, accounts)

      {:error, {:request_failed, :econnrefused}} ->
        # Styx not running - return mock accounts
        json(conn, mock_accounts())

      {:error, reason} ->
        conn
        |> put_status(:service_unavailable)
        |> json(%{error: "Failed to load accounts", reason: inspect(reason)})
    end
  end

  @doc """
  POST /api/bank-connections/consents/:id/sync
  Syncs accounts and transactions
  """
  def sync_accounts(conn, %{"id" => consent_id}) do
    user_id = conn.assigns[:current_user_id] || 1  # TODO: Get from proper auth

    case BankConnections.sync_accounts(user_id, consent_id) do
      {:ok, stats} ->
        json(conn, stats)

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Failed to sync accounts", reason: inspect(reason)})
    end
  end

  # Mock banks for UI testing when Styx is unavailable
  defp mock_banks do
    [
      %{
        aspsp_id: "COBADEFFXXX",
        name: "Commerzbank",
        bic: "COBADEFFXXX",
        logo_url: "https://logo.clearbit.com/commerzbank.de",
        supported_services: ["accounts", "payments", "funds-confirmations"],
        supported_sca_methods: ["REDIRECT"]
      },
      %{
        aspsp_id: "DEUTDEFFXXX",
        name: "Deutsche Bank",
        bic: "DEUTDEFFXXX",
        logo_url: "https://logo.clearbit.com/deutsche-bank.de",
        supported_services: ["accounts", "payments"],
        supported_sca_methods: ["REDIRECT", "DECOUPLED"]
      },
      %{
        aspsp_id: "HYVEDEMM488",
        name: "HypoVereinsbank",
        bic: "HYVEDEMM488",
        logo_url: "https://logo.clearbit.com/hypovereinsbank.de",
        supported_services: ["accounts", "payments"],
        supported_sca_methods: ["REDIRECT"]
      },
      %{
        aspsp_id: "GENODEF1S06",
        name: "Sparkasse",
        bic: "GENODEF1S06",
        logo_url: "https://logo.clearbit.com/sparkasse.de",
        supported_services: ["accounts", "payments"],
        supported_sca_methods: ["REDIRECT"]
      },
      %{
        aspsp_id: "BYLADEM1001",
        name: "Postbank",
        bic: "BYLADEM1001",
        logo_url: "https://logo.clearbit.com/postbank.de",
        supported_services: ["accounts"],
        supported_sca_methods: ["REDIRECT"]
      },
      %{
        aspsp_id: "DRESDEFF",
        name: "N26",
        bic: "DRESDEFF",
        logo_url: "https://logo.clearbit.com/n26.com",
        supported_services: ["accounts", "payments"],
        supported_sca_methods: ["REDIRECT", "DECOUPLED"]
      },
      %{
        aspsp_id: "INGDDEFFXXX",
        name: "ING",
        bic: "INGDDEFFXXX",
        logo_url: "https://logo.clearbit.com/ing.de",
        supported_services: ["accounts", "payments"],
        supported_sca_methods: ["REDIRECT"]
      }
    ]
  end

  # Mock accounts for UI testing when Styx is unavailable
  defp mock_accounts do
    [
      %{
        resource_id: "account-1",
        iban: "DE89370400440532013000",
        name: "Girokonto",
        currency: "EUR",
        balance: %{
          amount: 2543.89,
          currency: "EUR"
        },
        account_type: "checking"
      },
      %{
        resource_id: "account-2",
        iban: "DE89370400440532013001",
        name: "Sparkonto",
        currency: "EUR",
        balance: %{
          amount: 15789.42,
          currency: "EUR"
        },
        account_type: "savings"
      },
      %{
        resource_id: "account-3",
        iban: "DE89370400440532013002",
        name: "Tagesgeldkonto",
        currency: "EUR",
        balance: %{
          amount: 8234.15,
          currency: "EUR"
        },
        account_type: "savings"
      }
    ]
  end
end
