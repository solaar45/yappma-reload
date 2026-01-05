defmodule YappmaWeb.Router do
  use YappmaWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :authenticated do
    # TODO: Add real authentication plug
    # For now, use mock user for testing
    plug YappmaWeb.Plugs.MockUser
  end

  scope "/api", YappmaWeb do
    pipe_through :api

    # Health check
    get "/health", HealthController, :index

    # Public routes (login, register, etc.)
    # ...
  end

  scope "/api" do
    pipe_through [:api, :authenticated]

    # Users
    resources "/users", WealthBackendWeb.UserController, except: [:new, :edit]

    # Institutions (filtered by user_id via query param)
    get "/institutions", WealthBackendWeb.InstitutionController, :index
    resources "/institutions", WealthBackendWeb.InstitutionController, except: [:new, :edit, :index]

    # Accounts (filtered by user_id via query param)
    get "/accounts", WealthBackendWeb.AccountController, :index
    resources "/accounts", WealthBackendWeb.AccountController, except: [:new, :edit, :index]

    # Asset Types
    resources "/asset_types", WealthBackendWeb.AssetTypeController, only: [:index, :show]

    # Assets (filtered by user_id via query param)
    get "/assets", WealthBackendWeb.AssetController, :index
    resources "/assets", WealthBackendWeb.AssetController, except: [:new, :edit, :index]

    # Account Snapshots (filtered by account_id via query param)
    get "/account_snapshots", WealthBackendWeb.AccountSnapshotController, :index
    resources "/account_snapshots", WealthBackendWeb.AccountSnapshotController, except: [:new, :edit, :index]

    # Asset Snapshots (filtered by asset_id via query param)
    get "/asset_snapshots", WealthBackendWeb.AssetSnapshotController, :index
    resources "/asset_snapshots", WealthBackendWeb.AssetSnapshotController, except: [:new, :edit, :index]

    # Snapshots API (frontend-friendly routes)
    scope "/snapshots" do
      # Account snapshots
      post "/accounts", WealthBackendWeb.AccountSnapshotController, :create
      put "/accounts/:id", WealthBackendWeb.AccountSnapshotController, :update
      delete "/accounts/:id", WealthBackendWeb.AccountSnapshotController, :delete

      # Asset snapshots  
      post "/assets", WealthBackendWeb.AssetSnapshotController, :create
      put "/assets/:id", WealthBackendWeb.AssetSnapshotController, :update
      delete "/assets/:id", WealthBackendWeb.AssetSnapshotController, :delete
    end

    # Transactions
    get "/transactions/categories", WealthBackendWeb.TransactionController, :list_categories
    get "/transactions", WealthBackendWeb.TransactionController, :index
    get "/transactions/:id", WealthBackendWeb.TransactionController, :show
    put "/transactions/:id", WealthBackendWeb.TransactionController, :update
    get "/accounts/:account_id/transactions", WealthBackendWeb.TransactionController, :list_by_account
    post "/transactions/sync", WealthBackendWeb.TransactionController, :sync

    # Dashboard / Analytics
    get "/dashboard/net_worth", WealthBackendWeb.DashboardController, :net_worth
    get "/dashboard/account_snapshots", WealthBackendWeb.DashboardController, :account_snapshots
    get "/dashboard/asset_snapshots", WealthBackendWeb.DashboardController, :asset_snapshots
  end

  scope "/api", YappmaWeb do
    pipe_through [:api, :authenticated]

    # Bank Connections (PSD2)
    scope "/bank-connections" do
      # Banks/ASPSPs
      get "/banks", BankConnectionController, :list_banks
      get "/banks/:id", BankConnectionController, :get_bank

      # Consents
      get "/consents", BankConnectionController, :list_consents
      post "/consents", BankConnectionController, :create_consent
      get "/consents/:id", BankConnectionController, :get_consent
      post "/consents/:id/complete", BankConnectionController, :complete_consent
      delete "/consents/:id", BankConnectionController, :delete_consent

      # Accounts & Sync
      get "/consents/:id/accounts", BankConnectionController, :list_accounts
      post "/consents/:id/sync", BankConnectionController, :sync_accounts
    end
  end

  # Enable LiveDashboard in development
  if Application.compile_env(:yappma, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through [:fetch_session, :protect_from_forgery]

      live_dashboard "/dashboard", metrics: YappmaWeb.Telemetry
    end
  end
end
