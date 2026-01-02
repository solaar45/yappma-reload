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
#
# The watchers configuration can be used to run external
# watchers to your application. For example, we can use it
# to bundle .js and .css sources.
config :wealth_backend, WealthBackendWeb.Endpoint,
  # Binding to loopback ipv4 address prevents access from other machines.
  # Change to `ip: {0, 0, 0, 0}` to allow access from other machines.
  http: [ip: {127, 0, 0, 1}, port: 4000],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "iJ8VvCLKhEq7Iq8VvCLKhEq7Iq8VvCLKhEq7Iq8VvCLKhEq7Iq8VvCLKhEq7Iq8VvCLKhEq7",
  watchers: [
    esbuild: {Esbuild, :install_and_run, [:wealth_backend, ~w(--sourcemap=inline --watch)]},
    tailwind: {Tailwind, :install_and_run, [:wealth_backend, ~w(--watch)]}
  ]

# Watch static and templates for browser reloading.
config :wealth_backend, WealthBackendWeb.Endpoint,
  live_reload: [
    patterns: [
      ~r"priv/static/(?!uploads/).*(js|css|png|jpeg|jpg|gif|svg)$",
      ~r"priv/gettext/.*(po)$",
      ~r"lib/wealth_backend_web/(controllers|live|components)/.*(ex|heex)$"
    ]
  ]

# Enable dev routes for dashboard and mailbox
config :wealth_backend, dev_routes: true

# Do not include metadata nor timestamps in development logs
config :logger, :console, format: "[$level] $message\n"

# Set a higher stacktrace during development. Avoid configuring such
# in production as building large stacktraces may be expensive.
config :phoenix, :stacktrace_depth, 20

# Initialize plugs at runtime for faster development compilation
config :phoenix, :plug_init_mode, :runtime

# Disable swoosh api client as it is only required for production adapters.
config :swoosh, :api_client, false

# Cloak encryption key for development
# Generated with: mix cloak.gen.secret
# NOTE: In production, use a different key from environment variable!
config :wealth_backend, WealthBackend.Vault,
  ciphers: [
    default: {
      Cloak.Ciphers.AES.GCM,
      tag: "AES.GCM.V1",
      # This is a development-only key. Generate your own for production!
      key: Base.decode64!("rqHF3SbCbmD3sL3oHxVbBRJNq4BhVQ2w5yLXUgT6pqM=")
    }
  ]
