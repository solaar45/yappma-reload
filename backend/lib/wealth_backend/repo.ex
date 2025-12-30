defmodule WealthBackend.Repo do
  use Ecto.Repo,
    otp_app: :wealth_backend,
    adapter: Ecto.Adapters.Postgres
end
