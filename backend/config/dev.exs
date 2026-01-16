import Config

# Load .env file in development manually to ensure System env vars are set
# This avoids issues where Dotenvy might not be loaded yet during config evaluation
if File.exists?(".env") do
  File.stream!(".env")
  |> Stream.map(&String.trim/1)
  |> Stream.reject(&(&1 == "" or String.starts_with?(&1, "#")))
  |> Enum.each(fn line ->
    # Handle "export KEY=VAL" and "KEY=VAL"
    line = String.replace_prefix(line, "export ", "")
    
    case String.split(line, "=", parts: 2) do
      [key, val] ->
        key = String.trim(key)
        # Remove surrounding quotes from value if present
        value = val 
                |> String.trim()
                |> String.replace(~r/^["']|["']$/, "")
        
        System.put_env(key, value)
      _ -> 
        :ok
    end
  end)
end

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
  secret_key_base: "q8qqOe8QkYQsLvVBM7ZRVLQVJQVrDvZQQkQvQVZQVBQVQVZVQVQQVQVQVQVQVQVQ",
  watchers: []

# Enable dev routes for dashboard and mailbox
config :wealth_backend, dev_routes: true

# Do not include metadata nor timestamps in development logs
config :logger, :console, format: "[$level] $message\n"

# Set a higher stacktrace during development. Avoid configuring such
# in production as building large stacktraces may be expensive.
config :phoenix, :stacktrace_depth, 20

# Initialize plugs at runtime for faster development compilation
config :phoenix, :plug_init_mode, :runtime

# Alpha Vantage API configuration
# Get your free API key from: https://www.alphavantage.co/support/#api-key
# Set via environment variable: export ALPHA_VANTAGE_API_KEY=your_key_here
config :wealth_backend, :alpha_vantage_api_key, System.get_env("ALPHA_VANTAGE_API_KEY")
