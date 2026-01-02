# FinTS Bank Configuration for DKB and comdirect
# This seed file adds the supported banks to the institutions table

import Ecto.Query
alias WealthBackend.Repo
alias WealthBackend.Institutions.Institution
alias WealthBackend.Accounts.User

# Get first user or create one
user = Repo.one(from u in User, limit: 1) ||
  Repo.insert!(%User{
    email: "system@yappma.local",
    name: "System",
    currency_default: "EUR"
  })

IO.puts("Using user_id: #{user.id}")

# Check if institutions already exist
dkb_exists = Repo.exists?(from i in Institution, where: i.name == "DKB (Deutsche Kreditbank)" and i.user_id == ^user.id)
comdirect_exists = Repo.exists?(from i in Institution, where: i.name == "comdirect bank AG" and i.user_id == ^user.id)

# DKB (Deutsche Kreditbank)
# BLZ: 12030000, FinTS URL: https://banking-dkb.s-fints-pt-dkb.de/fints30
unless dkb_exists do
  Repo.insert!(%Institution{
    name: "DKB (Deutsche Kreditbank)",
    type: "bank",
    country: "DE",
    user_id: user.id
  })
  IO.puts("✅ DKB added")
else
  IO.puts("ℹ️ DKB already exists")
end

# comdirect
# BLZ: 20041155, FinTS URL: https://fints.comdirect.de/fints
unless comdirect_exists do
  Repo.insert!(%Institution{
    name: "comdirect bank AG",
    type: "bank",
    country: "DE",
    user_id: user.id
  })
  IO.puts("✅ comdirect added")
else
  IO.puts("ℹ️ comdirect already exists")
end

IO.puts("")
IO.puts("Bank Details:")
IO.puts("  DKB: BLZ 12030000, FinTS URL: https://banking-dkb.s-fints-pt-dkb.de/fints30")
IO.puts("  comdirect: BLZ 20041155, FinTS URL: https://fints.comdirect.de/fints")
