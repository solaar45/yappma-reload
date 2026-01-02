import Config

# Configure Ecto repositories
config :wealth_backend,
  ecto_repos: [WealthBackend.Repo]

# Configures the endpoint
config :wealth_backend, WealthBackendWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [json: WealthBackendWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: WealthBackend.PubSub,
  live_view: [signing_salt: "your-signing-salt"]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# FinTS Worker Configuration
config :wealth_backend,
  fints_worker_url: System.get_env("FINTS_WORKER_URL") || "http://localhost:5000"

# Import environment specific config
import_config "#{config_env()}.exs"
