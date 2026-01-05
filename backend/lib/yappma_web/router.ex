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
    resources "/users", YappmaWeb.UserController, except: [:new, :edit]

    # Institutions (filtered by user_id via query param)
    get "/institutions", YappmaWeb.InstitutionController, :index
    resources "/institutions", YappmaWeb.InstitutionController, except: [:new, :edit, :index]

    # Accounts (filtered by user_id via query param)
    get "/accounts", YappmaWeb.AccountController, :index
    resources "/accounts", YappmaWeb.AccountController, except: [:new, :edit, :index]

    # Asset Types
    resources "/asset_types", YappmaWeb.AssetTypeController, only: [:index, :show]

    # Assets (filtered by user_id via query param)
    get "/assets", YappmaWeb.AssetController, :index
    resources "/assets", YappmaWeb.AssetController, except: [:new, :edit, :index]

    # Account Snapshots (filtered by account_id via query param)
    get "/account_snapshots", YappmaWeb.AccountSnapshotController, :index
    resources "/account_snapshots", YappmaWeb.AccountSnapshotController, except: [:new, :edit, :index]

    # Asset Snapshots (filtered by asset_id via query param)
    get "/asset_snapshots", YappmaWeb.AssetSnapshotController, :index
    resources "/asset_snapshots", YappmaWeb.AssetSnapshotController, except: [:new, :edit, :index]

    # Snapshots API (frontend-friendly routes)
    scope "/snapshots" do
      # Account snapshots
      post "/accounts", YappmaWeb.AccountSnapshotController, :create
      put "/accounts/:id", YappmaWeb.AccountSnapshotController, :update
      delete "/accounts/:id", YappmaWeb.AccountSnapshotController, :delete

      # Asset snapshots  
      post "/assets", YappmaWeb.AssetSnapshotController, :create
      put "/assets/:id", YappmaWeb.AssetSnapshotController, :update
      delete "/assets/:id", YappmaWeb.AssetSnapshotController, :delete
    end

    # Transaction Categories
    get "/transaction-categories", YappmaWeb.TransactionCategoryController, :index
    post "/transaction-categories", YappmaWeb.TransactionCategoryController, :create
    put "/transaction-categories/:id", YappmaWeb.TransactionCategoryController, :update
    delete "/transaction-categories/:id", YappmaWeb.TransactionCategoryController, :delete

    # Transactions - IMPORTANT: specific routes before /:id pattern
    get "/transactions", YappmaWeb.TransactionController, :index
    get "/transactions/categories", YappmaWeb.TransactionController, :list_categories
    get "/transactions/:id", YappmaWeb.TransactionController, :show
    put "/transactions/:id", YappmaWeb.TransactionController, :update
    get "/accounts/:account_id/transactions", YappmaWeb.TransactionController, :list_by_account
    post "/transactions/sync", YappmaWeb.TransactionController, :sync

    # Dashboard / Analytics
    get "/dashboard/net_worth", YappmaWeb.DashboardController, :net_worth
    get "/dashboard/account_snapshots", YappmaWeb.DashboardController, :account_snapshots
    get "/dashboard/asset_snapshots", YappmaWeb.DashboardController, :asset_snapshots
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
