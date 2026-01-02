# FinTS Bank Configuration for DKB and comdirect
# This seed file adds the supported banks to the institutions table

alias WealthBackend.Repo
alias WealthBackend.Institutions.Institution

# Note: Institutions require a user_id
# You need to create a user first, or use an existing one
# For testing, we'll use user_id = 1 (create a user first if needed)

# DKB (Deutsche Kreditbank)
# BLZ: 12030000, FinTS URL: https://banking-dkb.s-fints-pt-dkb.de/fints30
Repo.insert!(
  %Institution{
    name: "DKB (Deutsche Kreditbank)",
    type: "bank",
    country: "DE",
    user_id: 1
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
    user_id: 1
  },
  on_conflict: :nothing,
  conflict_target: [:name, :user_id]
)

IO.puts("✅ FinTS banks seeded (DKB, comdirect)")
IO.puts("")
IO.puts("Bank Details:")
IO.puts("  DKB: BLZ 12030000, FinTS URL: https://banking-dkb.s-fints-pt-dkb.de/fints30")
IO.puts("  comdirect: BLZ 20041155, FinTS URL: https://fints.comdirect.de/fints")
