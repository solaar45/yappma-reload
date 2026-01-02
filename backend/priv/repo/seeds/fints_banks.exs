# FinTS Bank Configuration for DKB and comdirect
# This seed file adds the supported banks to the institutions table

alias WealthBackend.Repo
alias WealthBackend.Institutions.Institution

# DKB (Deutsche Kreditbank)
{:ok, _dkb} = Repo.insert(
  %Institution{
    name: "DKB (Deutsche Kreditbank)",
    type: :bank,
    country: "DE",
    website: "https://www.dkb.de",
    notes: "BLZ: 12030000, FinTS URL: https://banking-dkb.s-fints-pt-dkb.de/fints30"
  },
  on_conflict: :nothing
)

# comdirect
{:ok, _comdirect} = Repo.insert(
  %Institution{
    name: "comdirect bank AG",
    type: :bank,
    country: "DE",
    website: "https://www.comdirect.de",
    notes: "BLZ: 20041155, FinTS URL: https://fints.comdirect.de/fints"
  },
  on_conflict: :nothing
)

IO.puts("✅ FinTS banks seeded (DKB, comdirect)")
