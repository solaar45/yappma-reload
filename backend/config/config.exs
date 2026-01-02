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

# Suppress Tesla deprecated builder warning
config :tesla, disable_deprecated_builder_warning: true

# Configure esbuild (not used but suppresses warnings)
config :esbuild,
  version: "0.25.4",
  wealth_backend: []

# Configure tailwind (not used but suppresses warnings)
config :tailwind,
  version: "4.1.12",
  wealth_backend: []

# Import environment specific config
import_config "#{config_env()}.exs"
