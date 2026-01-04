defmodule YappmaWeb.Router do
  use YappmaWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :authenticated do
    # TODO: Add authentication plug
    # plug YappmaWeb.Plugs.Authenticate
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

    # Existing routes
    # resources "/accounts", AccountController
    # resources "/transactions", TransactionController
    # ...
  end
end
