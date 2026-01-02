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

# Get or create DKB institution for this user
dkb = Repo.one(from i in Institution, where: i.name == "DKB (Deutsche Kreditbank)" and i.user_id == ^user.id) ||
  Repo.insert!(%Institution{
    name: "DKB (Deutsche Kreditbank)",
    type: "bank",
    country: "DE",
    user_id: user.id
  })

IO.puts("✅ DKB Institution (ID: #{dkb.id})")

# Create mock bank connection
bank_connection = case Repo.one(from bc in BankConnection, where: bc.name == "Mock DKB Connection" and bc.user_id == ^user.id) do
  nil ->
    Repo.insert!(%BankConnection{
      name: "Mock DKB Connection",
      blz: "12030000",
      fints_url: "https://banking-dkb.s-fints-pt-dkb.de/fints30",
      user_id_encrypted: "mock_user",
      pin_encrypted: "mock_pin_encrypted",
      user_id: user.id,
      institution_id: dkb.id,
      status: :active,
      last_sync_at: DateTime.utc_now() |> DateTime.truncate(:second)
    })
  existing -> existing
end

IO.puts("✅ Mock Bank Connection (ID: #{bank_connection.id})")

# Create YAPPMA accounts
giro_account = case Repo.one(from a in Account, where: a.name == "Mock Girokonto" and a.user_id == ^user.id) do
  nil ->
    Repo.insert!(%Account{
      name: "Mock Girokonto",
      type: :checking,
      currency: "EUR",
      user_id: user.id,
      institution_id: dkb.id
    })
  existing -> existing
end

spar_account = case Repo.one(from a in Account, where: a.name == "Mock Sparkonto" and a.user_id == ^user.id) do
  nil ->
    Repo.insert!(%Account{
      name: "Mock Sparkonto",
      type: :savings,
      currency: "EUR",
      user_id: user.id,
      institution_id: dkb.id
    })
  existing -> existing
end

IO.puts("✅ YAPPMA Accounts")
IO.puts("   - Girokonto (ID: #{giro_account.id})")
IO.puts("   - Sparkonto (ID: #{spar_account.id})")

# Create bank accounts (FinTS mappings)
bank_account_giro = case Repo.one(from ba in BankAccount, where: ba.iban == "DE89370400440532013000") do
  nil ->
    Repo.insert!(%BankAccount{
      iban: "DE89370400440532013000",
      account_number: "532013000",
      account_name: "Mock Girokonto",
      bic: "COBADEFFXXX",
      bank_connection_id: bank_connection.id,
      account_id: giro_account.id
    })
  existing -> existing
end

bank_account_spar = case Repo.one(from ba in BankAccount, where: ba.iban == "DE89370400440532013001") do
  nil ->
    Repo.insert!(%BankAccount{
      iban: "DE89370400440532013001",
      account_number: "532013001",
      account_name: "Mock Sparkonto",
      bic: "COBADEFFXXX",
      bank_connection_id: bank_connection.id,
      account_id: spar_account.id
    })
  existing -> existing
end

IO.puts("✅ Bank Accounts (FinTS mappings)")
IO.puts("   - #{bank_account_giro.iban}")
IO.puts("   - #{bank_account_spar.iban}")

# Create initial snapshots
today = Date.utc_today()

unless Repo.exists?(from s in AccountSnapshot, where: s.account_id == ^giro_account.id and s.snapshot_date == ^today) do
  Repo.insert!(%AccountSnapshot{
    account_id: giro_account.id,
    balance: Decimal.new("1250.50"),
    snapshot_date: today,
    source: :fints_auto,
    external_reference: bank_account_giro.iban
  })
end

unless Repo.exists?(from s in AccountSnapshot, where: s.account_id == ^spar_account.id and s.snapshot_date == ^today) do
  Repo.insert!(%AccountSnapshot{
    account_id: spar_account.id,
    balance: Decimal.new("5000.00"),
    snapshot_date: today,
    source: :fints_auto,
    external_reference: bank_account_spar.iban
  })
end

IO.puts("✅ Account Snapshots")

IO.puts("\n" <> String.duplicate("=", 60))
IO.puts("🎉 Mock Test Data Complete!\n")
IO.puts("Test IDs:")
IO.puts("  User ID: #{user.id}")
IO.puts("  Bank Connection ID: #{bank_connection.id}")
IO.puts("  Girokonto ID: #{giro_account.id}")
IO.puts("  Sparkonto ID: #{spar_account.id}")
IO.puts("\n🎭 To test with MOCK MODE:")
IO.puts("  1. Start FinTS worker: cd fints-worker && export MOCK_MODE=true && python app.py")
IO.puts("  2. Test sync: iex -S mix")
IO.puts("     alias WealthBackend.BankConnections")
IO.puts("     BankConnections.sync_balances(#{bank_connection.id})")
IO.puts(String.duplicate("=", 60) <> "\n")
