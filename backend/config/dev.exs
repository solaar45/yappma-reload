import Config

# Configure your database
config :yappma, Yappma.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "yappma_dev",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

# For development, we disable any cache and enable
# debugging and code reloading.
config :yappma, YappmaWeb.Endpoint,
  # Binding to loopback ipv4 address prevents access from other machines.
  # Change to `ip: {0, 0, 0, 0}` to allow access from other machines.
  http: [ip: {127, 0, 0, 1}, port: 4000],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "liJ+1Zyg7o1YqId/AE6qdDyNmFLInsbGLmFV/qfp8/mzd1vZBPy0gxcBdpC5Sjxw",
  watchers: []

# Styx PSD2 API Configuration
config :yappma,
  styx_url: "http://localhost:8093",
  styx_api_key: "dev-api-key"

# Enable dev routes for dashboard and mailbox
config :yappma, dev_routes: true

# Do not include metadata nor timestamps in development logs
config :logger, :default_formatter, format: "[$level] $message\n"

# Set a higher stacktrace during development. Avoid configuring such
# in production as building large stacktraces may be expensive.
config :phoenix, :stacktrace_depth, 20

# Initialize plugs at runtime for faster development compilation
config :phoenix, :plug_init_mode, :runtime

# Enable phoenix live reload
config :yappma, YappmaWeb.Endpoint,
  live_reload: [
    patterns: [
      ~r"priv/static/(?!uploads/).*(js|css|png|jpeg|jpg|gif|svg)$",
      ~r"priv/gettext/.*(po)$",
      ~r"lib/yappma_web/(controllers|views|components)/.*(ex|heex)$"
    ]
  ]
