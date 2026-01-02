# FinTS Bank Configuration for DKB and comdirect
# This seed file adds the supported banks to the institutions table

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

# DKB (Deutsche Kreditbank)
# BLZ: 12030000, FinTS URL: https://banking-dkb.s-fints-pt-dkb.de/fints30
Repo.insert!(
  %Institution{
    name: "DKB (Deutsche Kreditbank)",
    type: "bank",
    country: "DE",
    user_id: user.id
  },
  on_conflict: :nothing,
  conflict_target: [:name, :user_id]
)

# comdirect
# BLZ: 20041155, FinTS URL: https://fints.comdirect.de/fints
Repo.insert!(
  %Institution{
    name: "comdirect bank AG",
    type: "bank",
    country: "DE",
    user_id: user.id
  },
  on_conflict: :nothing,
  conflict_target: [:name, :user_id]
)

IO.puts("✅ FinTS banks seeded (DKB, comdirect)")
IO.puts("")
IO.puts("Bank Details:")
IO.puts("  DKB: BLZ 12030000, FinTS URL: https://banking-dkb.s-fints-pt-dkb.de/fints30")
IO.puts("  comdirect: BLZ 20041155, FinTS URL: https://fints.comdirect.de/fints")
