defmodule WealthBackendWeb.Router do
  use WealthBackendWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :authenticated do
    # TODO: Add authentication plug
    # plug WealthBackendWeb.Plugs.Authenticate
  end

  scope "/api", WealthBackendWeb do
    pipe_through :api

    # Public endpoints
    get "/health", HealthController, :index
  end

  scope "/api", WealthBackendWeb do
    pipe_through [:api, :authenticated]

    # Accounts
    resources "/accounts", AccountController, except: [:new, :edit]
    
    # Account Snapshots
    resources "/account_snapshots", AccountSnapshotController, except: [:new, :edit]
    
    # Institutions
    resources "/institutions", InstitutionController, only: [:index, :show]
    
    # Bank Connections (FinTS)
    post "/bank_connections/test", BankConnectionController, :test
    
    resources "/bank_connections", BankConnectionController, except: [:new, :edit] do
      post "/fetch_accounts", BankConnectionController, :fetch_accounts
      post "/sync_balances", BankConnectionController, :sync_balances
    end
    
    # Bank Accounts
    resources "/bank_accounts", BankAccountController, only: [:index, :show]
    post "/bank_accounts/:id/link", BankAccountController, :link
  end
end
