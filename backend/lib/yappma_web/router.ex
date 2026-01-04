defmodule YappmaWeb.Router do
  use YappmaWeb, :router

  # Alias WealthBackendWeb controllers to YappmaWeb namespace
  alias WealthBackendWeb.{
    UserController,
    InstitutionController,
    AccountController,
    AssetController,
    AssetTypeController,
    AccountSnapshotController,
    AssetSnapshotController,
    DashboardController
  }

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

  scope "/api", YappmaWeb do
    pipe_through [:api, :authenticated]

    # Users
    resources "/users", UserController, except: [:new, :edit]

    # Institutions (filtered by user_id via query param)
    get "/institutions", InstitutionController, :index
    resources "/institutions", InstitutionController, except: [:new, :edit, :index]

    # Accounts (filtered by user_id via query param)
    get "/accounts", AccountController, :index
    resources "/accounts", AccountController, except: [:new, :edit, :index]

    # Asset Types
    resources "/asset_types", AssetTypeController, only: [:index, :show]

    # Assets (filtered by user_id via query param)
    get "/assets", AssetController, :index
    resources "/assets", AssetController, except: [:new, :edit, :index]

    # Account Snapshots (filtered by account_id via query param)
    get "/account_snapshots", AccountSnapshotController, :index
    resources "/account_snapshots", AccountSnapshotController, except: [:new, :edit, :index]

    # Asset Snapshots (filtered by asset_id via query param)
    get "/asset_snapshots", AssetSnapshotController, :index
    resources "/asset_snapshots", AssetSnapshotController, except: [:new, :edit, :index]

    # Snapshots API (frontend-friendly routes)
    scope "/snapshots" do
      # Account snapshots
      post "/accounts", AccountSnapshotController, :create
      put "/accounts/:id", AccountSnapshotController, :update
      delete "/accounts/:id", AccountSnapshotController, :delete

      # Asset snapshots  
      post "/assets", AssetSnapshotController, :create
      put "/assets/:id", AssetSnapshotController, :update
      delete "/assets/:id", AssetSnapshotController, :delete
    end

    # Dashboard / Analytics
    get "/dashboard/net_worth", DashboardController, :net_worth
    get "/dashboard/account_snapshots", DashboardController, :account_snapshots
    get "/dashboard/asset_snapshots", DashboardController, :asset_snapshots

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
