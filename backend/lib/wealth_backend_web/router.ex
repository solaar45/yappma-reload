defmodule WealthBackendWeb.Router do
  use WealthBackendWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", WealthBackendWeb do
    pipe_through :api

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

    # Tax Exemptions
    get "/tax_exemptions", TaxExemptionController, :index
    resources "/tax_exemptions", TaxExemptionController, except: [:new, :edit, :index]

    # Dashboard / Analytics
    get "/dashboard/net_worth", DashboardController, :net_worth
    get "/dashboard/account_snapshots", DashboardController, :account_snapshots
    get "/dashboard/asset_snapshots", DashboardController, :asset_snapshots
  end

  # Enable LiveDashboard in development
  if Application.compile_env(:wealth_backend, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through [:fetch_session, :protect_from_forgery]

      live_dashboard "/dashboard", metrics: WealthBackendWeb.Telemetry
    end
  end
end
