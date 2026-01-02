import Config

# Configure your database
config :wealth_backend, WealthBackend.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "wealth_backend_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :wealth_backend, WealthBackendWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "KHZm0hKHvNlUZVsF8G3xrT8TyHYqb2gMRvZCkLCJVDZiJhxMHNbqzLsJFYqTzHLC",
  server: false

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime

# Cloak encryption key for tests
config :wealth_backend, WealthBackend.Vault,
  ciphers: [
    default: {
      Cloak.Ciphers.AES.GCM,
      tag: "AES.GCM.V1",
      # Static key for tests - safe to commit
      key: Base.decode64!("qsL3oHxVbBRJNq4BhVQ2w5yLXUgT6pqMrqHF3SbCbmE=")
    }
  ]
