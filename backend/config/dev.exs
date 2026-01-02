import Config

# Configure your database
config :wealth_backend, WealthBackend.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "wealth_backend_dev",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

# For development, we disable any cache and enable
# debugging and code reloading.
config :wealth_backend, WealthBackendWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4000],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "KHZm0hKHvNlUZVsF8G3xrT8TyHYqb2gMRvZCkLCJVDZiJhxMHNbqzLsJFYqTzHLC",
  watchers: [
    esbuild: {Esbuild, :install_and_run, [:wealth_backend, ~w(--sourcemap=inline --watch)]},
    tailwind: {Tailwind, :install_and_run, [:wealth_backend, ~w(--watch)]}
  ]

# Enable dev routes for dashboard and mailbox
config :wealth_backend, dev_routes: true

# Do not include metadata nor timestamps in development logs
config :logger, :console, format: "[$level] $message\n"

# Set a higher stacktrace during development.
config :phoenix, :stacktrace_depth, 20

# Initialize plugs at runtime for faster development compilation
config :phoenix, :plug_init_mode, :runtime

# Disable swoosh api client as it is only required for production adapters.
config :swoosh, :api_client, false

# FinTS Worker configuration
config :wealth_backend, :fints_worker,
  base_url: "http://localhost:5000",
  api_key: "dev-test-key-12345",
  timeout: 30_000
