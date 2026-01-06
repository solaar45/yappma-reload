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

    # Asset Types
    resources "/asset_types", AssetTypeController, only: [:index, :show]

    # Assets (filtered by user_id via query param)
    get "/assets", AssetController, :index
    resources "/assets", AssetController, except: [:new, :edit, :index]

    # Asset Snapshots (filtered by asset_id via query param)
    get "/asset_snapshots", AssetSnapshotController, :index
    resources "/asset_snapshots", AssetSnapshotController, except: [:new, :edit, :index]

    # Snapshots API (frontend-friendly routes)
    scope "/snapshots" do
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
