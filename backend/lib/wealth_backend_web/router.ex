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
    
    # Asset Types (global, read-only)
    get "/asset_types", AssetTypeController, :index
    
    # Snapshots - Frontend expects nested routes
    # Account Snapshots (nested under /snapshots for frontend)
    get "/snapshots/accounts", AccountSnapshotController, :index
    post "/snapshots/accounts", AccountSnapshotController, :create
    get "/snapshots/accounts/:id", AccountSnapshotController, :show
    put "/snapshots/accounts/:id", AccountSnapshotController, :update
    patch "/snapshots/accounts/:id", AccountSnapshotController, :update
    delete "/snapshots/accounts/:id", AccountSnapshotController, :delete
    
    # Asset Snapshots (nested under /snapshots for frontend)
    get "/snapshots/assets", AssetSnapshotController, :index
    post "/snapshots/assets", AssetSnapshotController, :create
    get "/snapshots/assets/:id", AssetSnapshotController, :show
    put "/snapshots/assets/:id", AssetSnapshotController, :update
    patch "/snapshots/assets/:id", AssetSnapshotController, :update
    delete "/snapshots/assets/:id", AssetSnapshotController, :delete
    
    # Legacy snapshot routes (for backward compatibility)
    get "/snapshots", AccountSnapshotController, :index
    post "/snapshots", AccountSnapshotController, :create
    get "/snapshots/:id", AccountSnapshotController, :show
    put "/snapshots/:id", AccountSnapshotController, :update
    patch "/snapshots/:id", AccountSnapshotController, :update
    delete "/snapshots/:id", AccountSnapshotController, :delete
    
    # Original flat routes (for backward compatibility)
    resources "/account_snapshots", AccountSnapshotController, except: [:new, :edit]
    resources "/asset_snapshots", AssetSnapshotController, except: [:new, :edit]
    
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
