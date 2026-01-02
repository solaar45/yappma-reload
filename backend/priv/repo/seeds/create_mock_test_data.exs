# Create mock test data for FinTS integration testing
# Run with: mix run priv/repo/seeds/create_mock_test_data.exs

import Ecto.Query
alias WealthBackend.Repo
alias WealthBackend.Accounts.{User, Account}
alias WealthBackend.Institutions.Institution
alias WealthBackend.BankConnections.{BankConnection, BankAccount}
alias WealthBackend.Analytics.AccountSnapshot

IO.puts("\n🎭 Creating Mock Test Data for FinTS Integration...\n")

# Get or create test user
user = Repo.one(from u in User, where: u.email == "test@test.de", limit: 1) ||
  Repo.insert!(%User{
    email: "test@test.de",
    name: "Test User",
    currency_default: "EUR"
  })

IO.puts("✅ Test User: #{user.email} (ID: #{user.id})")

# Get DKB institution
dkb = Repo.one!(from i in Institution, where: i.name == "DKB (Deutsche Kreditbank)" and i.user_id == ^user.id)

IO.puts("✅ DKB Institution found (ID: #{dkb.id})")

# Create mock bank connection
bank_connection = Repo.insert!(%BankConnection{
  name: "Mock DKB Connection",
  blz: "12030000",
  fints_url: "https://banking-dkb.s-fints-pt-dkb.de/fints30",
  banking_user_id: "mock_user",
  banking_pin: "mock_pin_encrypted",  # Would be encrypted in production
  user_id: user.id,
  institution_id: dkb.id,
  status: "active",
  last_sync: DateTime.utc_now()
}, on_conflict: :nothing)

IO.puts("✅ Mock Bank Connection created (ID: #{bank_connection.id})")

# Create YAPPMA accounts
giro_account = Repo.insert!(%Account{
  name: "Mock Girokonto",
  type: :checking,
  currency: "EUR",
  user_id: user.id,
  institution_id: dkb.id
}, on_conflict: :nothing)

spar_account = Repo.insert!(%Account{
  name: "Mock Sparkonto",
  type: :savings,
  currency: "EUR",
  user_id: user.id,
  institution_id: dkb.id
}, on_conflict: :nothing)

IO.puts("✅ YAPPMA Accounts created")
IO.puts("   - Girokonto (ID: #{giro_account.id})")
IO.puts("   - Sparkonto (ID: #{spar_account.id})")

# Create bank accounts (FinTS mappings)
bank_account_giro = Repo.insert!(%BankAccount{
  iban: "DE89370400440532013000",
  account_number: "532013000",
  account_name: "Mock Girokonto",
  bic: "COBADEFFXXX",
  bank_connection_id: bank_connection.id,
  yappma_account_id: giro_account.id
}, on_conflict: :nothing)

bank_account_spar = Repo.insert!(%BankAccount{
  iban: "DE89370400440532013001",
  account_number: "532013001",
  account_name: "Mock Sparkonto",
  bic: "COBADEFFXXX",
  bank_connection_id: bank_connection.id,
  yappma_account_id: spar_account.id
}, on_conflict: :nothing)

IO.puts("✅ Bank Accounts (FinTS mappings) created")
IO.puts("   - #{bank_account_giro.iban}")
IO.puts("   - #{bank_account_spar.iban}")

# Create initial snapshots
Repo.insert!(%AccountSnapshot{
  account_id: giro_account.id,
  balance: Decimal.new("1250.50"),
  snapshot_date: Date.utc_today(),
  source: "fints",
  external_reference: bank_account_giro.iban
}, on_conflict: :nothing)

Repo.insert!(%AccountSnapshot{
  account_id: spar_account.id,
  balance: Decimal.new("5000.00"),
  snapshot_date: Date.utc_today(),
  source: "fints",
  external_reference: bank_account_spar.iban
}, on_conflict: :nothing)

IO.puts("✅ Account Snapshots created")

IO.puts("\n" <> String.duplicate("=", 60))
IO.puts("🎉 Mock Test Data Complete!\n")
IO.puts("Test IDs:")
IO.puts("  User ID: #{user.id}")
IO.puts("  Bank Connection ID: #{bank_connection.id}")
IO.puts("  Girokonto ID: #{giro_account.id}")
IO.puts("  Sparkonto ID: #{spar_account.id}")
IO.puts("\nTo test in IEx:")
IO.puts("  alias WealthBackend.BankConnections")
IO.puts("  BankConnections.sync_balances(#{bank_connection.id})")
IO.puts(String.duplicate("=", 60) <> "\n")
