defmodule Yappma.Repo do
  use Ecto.Repo,
    otp_app: :yappma,
    adapter: Ecto.Adapters.Postgres
end
