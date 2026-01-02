defmodule WealthBackendWeb.Router do
  use WealthBackendWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :authenticated do
    plug WealthBackendWeb.Plugs.Authenticate
  end

  scope "/api", WealthBackendWeb do
    pipe_through :api

    # Public endpoints
    get "/health", HealthController, :index
    
    # Auth endpoints
    post "/auth/register", AuthController, :register
    post "/auth/login", AuthController, :login
  end

  scope "/api", WealthBackendWeb do
    pipe_through [:api, :authenticated]

    # Accounts
    resources "/accounts", AccountController, except: [:new, :edit]
    
    # Assets
    resources "/assets", AssetController, except: [:new, :edit]
    
    # Snapshots (alias for account_snapshots for frontend compatibility)
    get "/snapshots", AccountSnapshotController, :index
    post "/snapshots", AccountSnapshotController, :create
    get "/snapshots/:id", AccountSnapshotController, :show
    put "/snapshots/:id", AccountSnapshotController, :update
    patch "/snapshots/:id", AccountSnapshotController, :update
    delete "/snapshots/:id", AccountSnapshotController, :delete
    
    # Account Snapshots (original route)
    resources "/account_snapshots", AccountSnapshotController, except: [:new, :edit]
    
    # Institutions
    resources "/institutions", InstitutionController, except: [:new, :edit]
    
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
