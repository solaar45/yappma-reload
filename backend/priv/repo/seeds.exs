# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#

alias WealthBackend.Repo
alias WealthBackend.Accounts
alias WealthBackend.Portfolio
alias WealthBackend.Analytics

IO.puts("\n🌱 Starting seed process...\n")

# Clear existing data (only for development!)
IO.puts("Clearing existing data...")
Repo.delete_all(WealthBackend.Analytics.AssetSnapshot)
Repo.delete_all(WealthBackend.Analytics.AccountSnapshot)
Repo.delete_all(WealthBackend.Portfolio.SecurityAsset)
Repo.delete_all(WealthBackend.Portfolio.InsuranceAsset)
Repo.delete_all(WealthBackend.Portfolio.LoanAsset)
Repo.delete_all(WealthBackend.Portfolio.RealEstateAsset)
Repo.delete_all(WealthBackend.Portfolio.Asset)
Repo.delete_all(WealthBackend.Accounts.Account)
Repo.delete_all(WealthBackend.Accounts.Institution)
Repo.delete_all(WealthBackend.Portfolio.AssetType)
Repo.delete_all(WealthBackend.Accounts.User)

# ============================================================================
# 1. Create Asset Types
# ============================================================================
IO.puts("✅ Creating asset types...")

asset_types = [
  %{code: "cash", description: "Cash and equivalents"},
  %{code: "security", description: "Securities (stocks, ETFs, bonds)"},
  %{code: "insurance", description: "Insurance policies"},
  %{code: "loan", description: "Loans and debts"},
  %{code: "real_estate", description: "Real estate properties"},
  %{code: "other", description: "Other assets"}
]

Enum.each(asset_types, fn attrs ->
  WealthBackend.Portfolio.AssetType.changeset(%WealthBackend.Portfolio.AssetType{}, attrs)
  |> Repo.insert!()
end)

# Preload asset types for later use
security_type = Portfolio.get_asset_type_by_code("security")
insurance_type = Portfolio.get_asset_type_by_code("insurance")
real_estate_type = Portfolio.get_asset_type_by_code("real_estate")
cash_type = Portfolio.get_asset_type_by_code("cash")

# ============================================================================
# 2. Create Demo User
# ============================================================================
IO.puts("✅ Creating demo user...")

{:ok, user} = Accounts.create_user(%{
  name: "Demo User",
  email: "demo@yappma.dev",
  currency_default: "EUR"
})

# ============================================================================
# 3. Create Institutions
# ============================================================================
IO.puts("✅ Creating institutions...")

{:ok, bank} = Accounts.create_institution(%{
  name: "Deutsche Bank",
  type: :bank,
  country: "DE",
  user_id: user.id
})

{:ok, broker} = Accounts.create_institution(%{
  name: "Trade Republic",
  type: :broker,
  country: "DE",
  user_id: user.id
})

{:ok, insurance_company} = Accounts.create_institution(%{
  name: "Allianz",
  type: :insurance,
  country: "DE",
  user_id: user.id
})

# ============================================================================
# 4. Create Accounts
# ============================================================================
IO.puts("✅ Creating accounts...")

{:ok, checking_account} = Accounts.create_account(%{
  name: "Girokonto",
  type: :checking,
  currency: "EUR",
  is_active: true,
  opened_at: ~D[2020-01-15],
  user_id: user.id,
  institution_id: bank.id
})

{:ok, savings_account} = Accounts.create_account(%{
  name: "Tagesgeldkonto",
  type: :savings,
  currency: "EUR",
  is_active: true,
  opened_at: ~D[2020-03-01],
  user_id: user.id,
  institution_id: bank.id
})

{:ok, brokerage_account} = Accounts.create_account(%{
  name: "Depot",
  type: :brokerage,
  currency: "EUR",
  is_active: true,
  opened_at: ~D[2021-06-15],
  user_id: user.id,
  institution_id: broker.id
})

{:ok, cash_account} = Accounts.create_account(%{
  name: "Bargeld",
  type: :cash,
  currency: "EUR",
  is_active: true,
  user_id: user.id,
  institution_id: nil
})

# ============================================================================
# 5. Create Assets
# ============================================================================
IO.puts("✅ Creating assets...")

# Security 1: MSCI World ETF
{:ok, etf_msci_world} = Portfolio.create_full_asset(%{
  name: "iShares Core MSCI World",
  symbol: "IE00B4L5Y983",
  currency: "EUR",
  is_active: true,
  created_at_date: ~D[2021-06-15],
  user_id: user.id,
  account_id: brokerage_account.id,
  asset_type_id: security_type.id,
  security_asset: %{
    isin: "IE00B4L5Y983",
    wkn: "A0RPWH",
    ticker: "IWDA",
    exchange: "XETRA",
    sector: "Diversified"
  }
})

# Security 2: Vanguard All-World
{:ok, etf_vanguard} = Portfolio.create_full_asset(%{
  name: "Vanguard FTSE All-World",
  symbol: "IE00BK5BQT80",
  currency: "EUR",
  is_active: true,
  created_at_date: ~D[2022-01-10],
  user_id: user.id,
  account_id: brokerage_account.id,
  asset_type_id: security_type.id,
  security_asset: %{
    isin: "IE00BK5BQT80",
    ticker: "VWCE",
    exchange: "XETRA",
    sector: "Diversified"
  }
})

# Security 3: Bitcoin ETF
{:ok, bitcoin_etf} = Portfolio.create_full_asset(%{
  name: "iShares Bitcoin Trust ETF",
  symbol: "US46428V5093",
  currency: "EUR",
  is_active: true,
  created_at_date: ~D[2024-02-15],
  user_id: user.id,
  account_id: brokerage_account.id,
  asset_type_id: security_type.id,
  security_asset: %{
    isin: "US46428V5093",
    ticker: "IBIT",
    exchange: "NYSE",
    sector: "Cryptocurrency"
  }
})

# Insurance 1: Haftpflicht
{:ok, liability_insurance} = Portfolio.create_full_asset(%{
  name: "Privathaftpflichtversicherung",
  currency: "EUR",
  is_active: true,
  created_at_date: ~D[2020-01-01],
  user_id: user.id,
  asset_type_id: insurance_type.id,
  insurance_asset: %{
    insurer_name: "Allianz",
    policy_number: "PHP-2020-001234",
    insurance_type: "liability",
    coverage_amount: Decimal.new("10000000"),
    payment_frequency: "yearly"
  }
})

# Insurance 2: Lebensversicherung
{:ok, life_insurance} = Portfolio.create_full_asset(%{
  name: "Kapitallebensversicherung",
  currency: "EUR",
  is_active: true,
  created_at_date: ~D[2015-03-15],
  user_id: user.id,
  asset_type_id: insurance_type.id,
  insurance_asset: %{
    insurer_name: "Allianz",
    policy_number: "LV-2015-005678",
    insurance_type: "life",
    coverage_amount: Decimal.new("50000"),
    payment_frequency: "monthly"
  }
})

# Real Estate
{:ok, apartment} = Portfolio.create_full_asset(%{
  name: "Eigentumswohnung München",
  currency: "EUR",
  is_active: true,
  created_at_date: ~D[2018-09-01],
  user_id: user.id,
  asset_type_id: real_estate_type.id,
  real_estate_asset: %{
    address: "Maximilianstraße 42, 80539 München",
    size_m2: Decimal.new("85.5"),
    purchase_price: Decimal.new("450000"),
    purchase_date: ~D[2018-09-01]
  }
})

# Cash Asset
{:ok, cash_home} = Portfolio.create_full_asset(%{
  name: "Bargeld zu Hause",
  currency: "EUR",
  is_active: true,
  user_id: user.id,
  account_id: cash_account.id,
  asset_type_id: cash_type.id
})

# ============================================================================
# 6. Create Account Snapshots
# ============================================================================
IO.puts("✅ Creating account snapshots...")

# Snapshots für verschiedene Zeitpunkte
dates = [
  ~D[2025-10-31],
  ~D[2025-11-30],
  ~D[2025-12-30]
]

# Girokonto Snapshots
Enum.each([
  {~D[2025-10-31], "3500.00"},
  {~D[2025-11-30], "4200.50"},
  {~D[2025-12-30], "5000.00"}
], fn {date, balance} ->
  {:ok, _} = Analytics.create_account_snapshot(%{
    account_id: checking_account.id,
    snapshot_date: date,
    balance: Decimal.new(balance),
    currency: "EUR"
  })
end)

# Tagesgeld Snapshots
Enum.each([
  {~D[2025-10-31], "12000.00"},
  {~D[2025-11-30], "12500.00"},
  {~D[2025-12-30], "13000.00"}
], fn {date, balance} ->
  {:ok, _} = Analytics.create_account_snapshot(%{
    account_id: savings_account.id,
    snapshot_date: date,
    balance: Decimal.new(balance),
    currency: "EUR"
  })
end)

# Bargeld Snapshots
Enum.each([
  {~D[2025-10-31], "500.00"},
  {~D[2025-11-30], "450.00"},
  {~D[2025-12-30], "600.00"}
], fn {date, balance} ->
  {:ok, _} = Analytics.create_account_snapshot(%{
    account_id: cash_account.id,
    snapshot_date: date,
    balance: Decimal.new(balance),
    currency: "EUR"
  })
end)

# ============================================================================
# 7. Create Asset Snapshots
# ============================================================================
IO.puts("✅ Creating asset snapshots...")

# MSCI World ETF Snapshots (100 Stück)
Enum.each([
  {~D[2025-10-31], "100", "85.50"},
  {~D[2025-11-30], "100", "87.20"},
  {~D[2025-12-30], "100", "89.75"}
], fn {date, qty, price} ->
  {:ok, _} = Analytics.create_asset_snapshot(%{
    asset_id: etf_msci_world.id,
    snapshot_date: date,
    quantity: Decimal.new(qty),
    market_price_per_unit: Decimal.new(price),
    value: Decimal.mult(Decimal.new(qty), Decimal.new(price))
  })
end)

# Vanguard All-World ETF Snapshots (50 Stück)
Enum.each([
  {~D[2025-10-31], "50", "98.00"},
  {~D[2025-11-30], "50", "99.50"},
  {~D[2025-12-30], "50", "101.20"}
], fn {date, qty, price} ->
  {:ok, _} = Analytics.create_asset_snapshot(%{
    asset_id: etf_vanguard.id,
    snapshot_date: date,
    quantity: Decimal.new(qty),
    market_price_per_unit: Decimal.new(price),
    value: Decimal.mult(Decimal.new(qty), Decimal.new(price))
  })
end)

# Bitcoin ETF Snapshots (20 Stück)
Enum.each([
  {~D[2025-10-31], "20", "42.50"},
  {~D[2025-11-30], "20", "45.80"},
  {~D[2025-12-30], "20", "48.25"}
], fn {date, qty, price} ->
  {:ok, _} = Analytics.create_asset_snapshot(%{
    asset_id: bitcoin_etf.id,
    snapshot_date: date,
    quantity: Decimal.new(qty),
    market_price_per_unit: Decimal.new(price),
    value: Decimal.mult(Decimal.new(qty), Decimal.new(price))
  })
end)

# Haftpflicht Snapshots (Rückkaufswert = 0, keine Quantity)
Enum.each([
  {~D[2025-10-31], "0"},
  {~D[2025-11-30], "0"},
  {~D[2025-12-30], "0"}
], fn {date, value} ->
  {:ok, _} = Analytics.create_asset_snapshot(%{
    asset_id: liability_insurance.id,
    snapshot_date: date,
    value: Decimal.new(value),
    note: "Keine Rückkaufswert bei Haftpflicht"
  })
end)

# Lebensversicherung Snapshots (steigender Rückkaufswert)
Enum.each([
  {~D[2025-10-31], "18500.00"},
  {~D[2025-11-30], "18750.00"},
  {~D[2025-12-30], "19000.00"}
], fn {date, value} ->
  {:ok, _} = Analytics.create_asset_snapshot(%{
    asset_id: life_insurance.id,
    snapshot_date: date,
    value: Decimal.new(value),
    note: "Rückkaufswert"
  })
end)

# Immobilie Snapshots (steigende Bewertung)
Enum.each([
  {~D[2025-10-31], "480000.00"},
  {~D[2025-11-30], "482000.00"},
  {~D[2025-12-30], "485000.00"}
], fn {date, value} ->
  {:ok, _} = Analytics.create_asset_snapshot(%{
    asset_id: apartment.id,
    snapshot_date: date,
    value: Decimal.new(value),
    note: "Marktwertschätzung"
  })
end)

# Bargeld Snapshots
Enum.each([
  {~D[2025-10-31], "800.00"},
  {~D[2025-11-30], "750.00"},
  {~D[2025-12-30], "900.00"}
], fn {date, value} ->
  {:ok, _} = Analytics.create_asset_snapshot(%{
    asset_id: cash_home.id,
    snapshot_date: date,
    value: Decimal.new(value)
  })
end)

# ============================================================================
# Summary
# ============================================================================
IO.puts("\n✅ Seed process completed!\n")
IO.puts("📊 Summary:")
IO.puts("   - User: #{user.email} (ID: #{user.id})")
IO.puts("   - Institutions: 3")
IO.puts("   - Accounts: 4")
IO.puts("   - Assets: 8")
IO.puts("   - Account Snapshots: #{3 * 3} (3 months × 3 accounts)")
IO.puts("   - Asset Snapshots: #{7 * 3} (3 months × 7 assets)")

net_worth = Analytics.calculate_net_worth(user.id)
IO.puts("\n💰 Current Net Worth (#{Date.utc_today()}):")
IO.puts("   - Total: €#{net_worth.total}")
IO.puts("   - Accounts: €#{net_worth.accounts}")
IO.puts("   - Assets: €#{net_worth.assets}")

IO.puts("\n🚀 Test the API:")
IO.puts("   curl http://localhost:4000/api/users")
IO.puts("   curl http://localhost:4000/api/dashboard/net_worth?user_id=#{user.id}")
IO.puts("")
