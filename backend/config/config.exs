import Config

# Configure Ecto repository
config :yappma,
  ecto_repos: [Yappma.Repo],
  generators: [timestamp_type: :utc_datetime, binary_id: true]

# Configures the endpoint
config :yappma, YappmaWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [json: YappmaWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: Yappma.PubSub,
  live_view: [signing_salt: "your-secret-salt"]

# Styx/PSD2 Configuration
config :yappma,
  styx_base_url: System.get_env("STYX_URL") || "http://localhost:8093",
  http_client: HTTPoison

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config
import_config "#{config_env()}.exs"
