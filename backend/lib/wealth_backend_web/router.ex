defmodule WealthBackendWeb.Router do
  use WealthBackendWeb, :router

  import WealthBackendWeb.UserAuth
  import WealthBackendWeb.Plugs.RequireAdmin
  import WealthBackendWeb.Plugs.RequireSuperAdmin
  import WealthBackendWeb.Plugs.RequireActiveUser
  import WealthBackendWeb.Plugs.CheckPasswordChangeRequired

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :put_root_layout, html: {WealthBackendWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug :fetch_current_user
  end

  pipeline :api_auth do
    plug :accepts, ["json"]
    plug :fetch_session
    plug :fetch_current_user
  end

  pipeline :require_active do
    plug WealthBackendWeb.Plugs.RequireActiveUser
  end

  pipeline :check_password_change do
    plug WealthBackendWeb.Plugs.CheckPasswordChangeRequired
  end

  pipeline :require_admin do
    plug WealthBackendWeb.Plugs.RequireAdmin
  end

  pipeline :require_super_admin do
    plug WealthBackendWeb.Plugs.RequireSuperAdmin
  end

  scope "/api", WealthBackendWeb do
    pipe_through :api_auth

    post "/users/log_in", UserSessionController, :create
    delete "/users/log_out", UserSessionController, :delete
    
    # Public User Registration
    post "/users", UserController, :create
    get "/users/check_username/:username", UserController, :check_username

    scope "/" do
      pipe_through [:require_authenticated_user, :require_active, :check_password_change]

      # Protected Users API
      resources "/users", UserController, except: [:new, :edit, :create]
      put "/users/settings/update_password", UserSettingsController, :update_password

      # Institutions
      get "/institutions", InstitutionController, :index
      resources "/institutions", InstitutionController, except: [:new, :edit, :index]

      # Accounts
      get "/accounts", AccountController, :index
      resources "/accounts", AccountController, except: [:new, :edit, :index]

      # Asset Types
      resources "/asset_types", AssetTypeController, only: [:index, :show]

      # Assets
      get "/assets", AssetController, :index
      resources "/assets", AssetController, except: [:new, :edit, :index]

      # Securities
      post "/securities/search", SecurityController, :search
      post "/securities/enrich", SecurityController, :enrich

      # Account Snapshots
      get "/account_snapshots", AccountSnapshotController, :index
      resources "/account_snapshots", AccountSnapshotController, except: [:new, :edit, :index]

      # Asset Snapshots
      get "/asset_snapshots", AssetSnapshotController, :index
      resources "/asset_snapshots", AssetSnapshotController, except: [:new, :edit, :index]

      # Snapshots API
      scope "/snapshots" do
        post "/accounts", AccountSnapshotController, :create
        put "/accounts/:id", AccountSnapshotController, :update
        delete "/accounts/:id", AccountSnapshotController, :delete

        post "/assets", AssetSnapshotController, :create
        put "/assets/:id", AssetSnapshotController, :update
        delete "/assets/:id", AssetSnapshotController, :delete
        
        # Import
        post "/import", ImportController, :create
      end

      # Tax Exemptions
      get "/tax_exemptions", TaxExemptionController, :index
      resources "/tax_exemptions", TaxExemptionController, except: [:new, :edit, :index]

      # Dashboard / Analytics
      get "/dashboard/net_worth", DashboardController, :net_worth
      get "/dashboard/account_snapshots", DashboardController, :account_snapshots
      get "/dashboard/asset_snapshots", DashboardController, :asset_snapshots
    end
  end

  # Admin Routes
  scope "/api/admin", WealthBackendWeb.Admin, as: :admin do
    pipe_through [:api_auth, :require_authenticated_user, :require_active, :require_admin]

    # User Management
    get "/users", UserController, :index
    get "/users/:id", UserController, :show
    post "/users", UserController, :create
    patch "/users/:id", UserController, :update
    delete "/users/:id", UserController, :delete
    
    # User Actions
    post "/users/:id/reset-password", UserController, :reset_password
    post "/users/:id/deactivate", UserController, :deactivate
    post "/users/:id/reactivate", UserController, :reactivate

    # Dashboard & Audit Log
    get "/dashboard/stats", DashboardController, :stats
    get "/audit-log", DashboardController, :audit_log

    # Super Admin only routes
    scope "/" do
      pipe_through :require_super_admin

      post "/users/:id/promote-to-admin", UserController, :promote_to_admin
      post "/users/:id/demote-to-user", UserController, :demote_to_user
    end
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
