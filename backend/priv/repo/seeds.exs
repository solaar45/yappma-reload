# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#

alias WealthBackend.Repo
alias WealthBackend.Accounts
alias WealthBackend.Institutions
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
Repo.delete_all(WealthBackend.Institutions.Institution)
Repo.delete_all(WealthBackend.Portfolio.AssetType)
Repo.delete_all(WealthBackend.Accounts.User)

# ============================================================================
# 1. Create Asset Types
# ============================================================================
IO.puts("✅ Creating asset types...")

asset_types = [
  %{code: "cash", description: "Cash & Accounts"},
  %{code: "security", description: "Securities"},
  %{code: "real_estate", description: "Real Estate"},
  %{code: "collectible", description: "Valuables"},
  %{code: "insurance", description: "Insurance"},
  %{code: "other", description: "Other Assets"}
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

{:ok, user} = Accounts.register_user(%{
  name: "Demo User",
  email: "demo@yappma.dev",
  password: "password1234",
  currency_default: "EUR"
})

# Mark as confirmed
user |> Ecto.Changeset.change(%{confirmed_at: DateTime.utc_now() |> DateTime.truncate(:second)}) |> Repo.update!()

# ============================================================================
# 3. Create Institutions (Global Master Data)
# ============================================================================
IO.puts("✅ Creating institutions...")

institutions_data = [
  # --- Major Banks ---
  %{name: "Deutsche Bank", website: "deutsche-bank.de", type: "bank", category: "bank", country: "DE"},
  %{name: "Commerzbank", website: "commerzbank.de", type: "bank", category: "bank", country: "DE"},
  %{name: "ING DiBa", website: "ing.de", type: "bank", category: "bank", country: "DE"},
  %{name: "DKB", website: "dkb.de", type: "bank", category: "bank", country: "DE"},
  %{name: "Postbank", website: "postbank.de", type: "bank", category: "bank", country: "DE"},
  %{name: "Comdirect", website: "comdirect.de", type: "bank", category: "bank", country: "DE"},
  %{name: "Consorsbank", website: "consorsbank.de", type: "bank", category: "bank", country: "DE"},
  %{name: "HypoVereinsbank", website: "hvb.de", type: "bank", category: "bank", country: "DE"},
  %{name: "Targobank", website: "targobank.de", type: "bank", category: "bank", country: "DE"},
  %{name: "Santander Consumer Bank", website: "santander.de", type: "bank", category: "bank", country: "DE"},
  %{name: "Norisbank", website: "norisbank.de", type: "bank", category: "bank", country: "DE"},
  %{name: "1822direkt", website: "1822direkt.de", type: "bank", category: "bank", country: "DE"},
  %{name: "Sparkasse", website: "sparkasse.de", type: "bank", category: "bank", country: "DE"},
  %{name: "Volksbank Raiffeisenbank", website: "vr.de", type: "bank", category: "bank", country: "DE"},
  %{name: "Sparda-Bank", website: "sparda.de", type: "bank", category: "bank", country: "DE"},
  %{name: "Deutsche Kreditbank", website: "dkb.de", type: "bank", category: "bank", country: "DE"},
  %{name: "GLS Bank", website: "gls.de", type: "bank", category: "bank", country: "DE"},
  %{name: "DBK", website: "dbk.de", type: "bank", category: "bank", country: "DE"},

  # --- Neobanks ---
  %{name: "N26", website: "n26.com", type: "bank", category: "neobank", country: "DE"},
  %{name: "C24 Bank", website: "c24.de", type: "bank", category: "neobank", country: "DE"},
  %{name: "Revolut", website: "revolut.com", type: "bank", category: "neobank", country: "DE"},
  %{name: "Bunq", website: "bunq.com", type: "bank", category: "neobank", country: "NL"},
  %{name: "Tomorrow", website: "tomorrow.one", type: "bank", category: "neobank", country: "DE"},
  %{name: "Vivid Money", website: "vivid.money", type: "bank", category: "neobank", country: "DE"},
  %{name: "Klarna", website: "klarna.com", type: "bank", category: "neobank", country: "SE"},

  # --- Brokers ---
  %{name: "Trade Republic", website: "traderepublic.com", type: "broker", category: "broker", country: "DE"},
  %{name: "Scalable Capital", website: "scalable.capital", type: "broker", category: "broker", country: "DE"},
  %{name: "Flatex", website: "flatex.de", type: "broker", category: "broker", country: "DE"},
  %{name: "Smartbroker", website: "smartbroker.de", type: "broker", category: "broker", country: "DE"},
  %{name: "onvista bank", website: "onvista-bank.de", type: "broker", category: "broker", country: "DE"},
  %{name: "JustTRADE", website: "justtrade.com", type: "broker", category: "broker", country: "DE"},
  %{name: "Finanzen.net ZERO", website: "finanzen.net", type: "broker", category: "broker", country: "DE"},
  %{name: "S Broker", website: "sbroker.de", type: "broker", category: "broker", country: "DE"},
  %{name: "Degiro", website: "degiro.de", type: "broker", category: "broker", country: "DE"},
  %{name: "CapTrader", website: "captrader.com", type: "broker", category: "broker", country: "DE"},
  %{name: "Lynx", website: "lynxbroker.de", type: "broker", category: "broker", country: "DE"},
  %{name: "Interactive Brokers", website: "interactivebrokers.com", type: "broker", category: "broker", country: "US"},
  %{name: "Trading 212", website: "trading212.com", type: "broker", category: "broker", country: "UK"},
  %{name: "eToro", website: "etoro.com", type: "broker", category: "broker", country: "CY"},

  # --- Insurance ---
  %{name: "Allianz", website: "allianz.de", type: "insurance", category: "insurance", country: "DE"},
  %{name: "HUK-COBURG", website: "huk.de", type: "insurance", category: "insurance", country: "DE"},
  %{name: "CosmosDirekt", website: "cosmosdirekt.de", type: "insurance", category: "insurance", country: "DE"},
  %{name: "ERGO", website: "ergo.de", type: "insurance", category: "insurance", country: "DE"},
  %{name: "AXA", website: "axa.de", type: "insurance", category: "insurance", country: "DE"},
  %{name: "R+V Versicherung", website: "ruv.de", type: "insurance", category: "insurance", country: "DE"},
  %{name: "Generali", website: "generali.de", type: "insurance", category: "insurance", country: "DE"},
  %{name: "Debeka", website: "debeka.de", type: "insurance", category: "insurance", country: "DE"},
  %{name: "Signal Iduna", website: "signal-iduna.de", type: "insurance", category: "insurance", country: "DE"},
  %{name: "HanseMerkur", website: "hansemerkur.de", type: "insurance", category: "insurance", country: "DE"},
  %{name: "Gothaer", website: "gothaer.de", type: "insurance", category: "insurance", country: "DE"},
  %{name: "Zurich", website: "zurich.de", type: "insurance", category: "insurance", country: "DE"},
  %{name: "DEVK", website: "devk.de", type: "insurance", category: "insurance", country: "DE"},
  %{name: "Techniker Krankenkasse", website: "tk.de", type: "insurance", category: "insurance", country: "DE"},
  %{name: "AOK", website: "aok.de", type: "insurance", category: "insurance", country: "DE"},
  %{name: "BARMER", website: "barmer.de", type: "insurance", category: "insurance", country: "DE"},

  # --- Crypto Exchanges (moved to "other" type, crypto category) ---
  %{name: "Binance", website: "binance.com", type: "other", category: "crypto", country: "MT"},
  %{name: "Coinbase", website: "coinbase.com", type: "other", category: "crypto", country: "US"},
  %{name: "Kraken", website: "kraken.com", type: "other", category: "crypto", country: "US"},
  %{name: "Bitpanda", website: "bitpanda.com", type: "other", category: "crypto", country: "AT"},
  %{name: "Bison", website: "bisonapp.com", type: "other", category: "crypto", country: "DE"},
  %{name: "Crypto.com", website: "crypto.com", type: "other", category: "crypto", country: "SG"},
  %{name: "Ledger", website: "ledger.com", type: "other", category: "crypto", country: "FR"},
  %{name: "Trezor", website: "trezor.io", type: "other", category: "crypto", country: "CZ"},
  %{name: "KuCoin", website: "kucoin.com", type: "other", category: "crypto", country: "SC"},
  %{name: "Bybit", website: "bybit.com", type: "other", category: "crypto", country: "AE"},
  %{name: "Bitvavo", website: "bitvavo.com", type: "other", category: "crypto", country: "NL"}
]

# Insert all institutions
institutions_map = Enum.reduce(institutions_data, %{}, fn attrs, acc ->
  case Institutions.create_institution(Map.put(attrs, :is_system_provided, true)) do
    {:ok, institution} -> Map.put(acc, attrs.name, institution)
    {:error, changeset} -> 
      IO.puts("❌ Failed to create #{attrs.name}: #{inspect(changeset.errors)}")
      acc
  end
end)

# Retrieve specific institutions for account associations (using new map for safety)
bank = institutions_map["Deutsche Bank"]
broker = institutions_map["Trade Republic"]
insurance_company = institutions_map["Allianz"]

if is_nil(bank) do
  IO.puts("⚠️ Warning: Deutsche Bank not found in created institutions map. Falling back to first available.")
end
# Safe fallback if specific ones failed (just for demo accounts below)
bank = bank || Enum.at(Map.values(institutions_map), 0)
broker = broker || Enum.at(Map.values(institutions_map), 1)
insurance_company = insurance_company || Enum.at(Map.values(institutions_map), 2)

# ============================================================================
# 4. Create Accounts
# ============================================================================
IO.puts("✅ Creating accounts...")

{:ok, checking_account} = Accounts.create_account(%{
  name: "Girokonto",
  type: "checking",
  currency: "EUR",
  is_active: true,
  opened_at: ~D[2020-01-15],
  user_id: user.id,
  institution_id: bank.id
})

{:ok, savings_account} = Accounts.create_account(%{
  name: "Tagesgeldkonto",
  type: "savings",
  currency: "EUR",
  is_active: true,
  opened_at: ~D[2020-03-01],
  user_id: user.id,
  institution_id: bank.id
})

{:ok, brokerage_account} = Accounts.create_account(%{
  name: "Depot",
  type: "brokerage",
  currency: "EUR",
  is_active: true,
  opened_at: ~D[2021-06-15],
  user_id: user.id,
  institution_id: broker.id
})

{:ok, cash_account} = Accounts.create_account(%{
  name: "Bargeld",
  type: "cash",
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
{:ok, etf_msci_world} = Portfolio.create_full_asset(user.id, %{
  name: "iShares Core MSCI World",
  symbol: "IE00B4L5Y983",
  currency: "EUR",
  is_active: true,
  created_at_date: ~D[2021-06-15],
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
{:ok, etf_vanguard} = Portfolio.create_full_asset(user.id, %{
  name: "Vanguard FTSE All-World",
  symbol: "IE00BK5BQT80",
  currency: "EUR",
  is_active: true,
  created_at_date: ~D[2022-01-10],
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
{:ok, bitcoin_etf} = Portfolio.create_full_asset(user.id, %{
  name: "iShares Bitcoin Trust ETF",
  symbol: "US46428V5093",
  currency: "EUR",
  is_active: true,
  created_at_date: ~D[2024-02-15],
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
{:ok, liability_insurance} = Portfolio.create_full_asset(user.id, %{
  name: "Privathaftpflichtversicherung",
  currency: "EUR",
  is_active: true,
  created_at_date: ~D[2020-01-01],
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
{:ok, life_insurance} = Portfolio.create_full_asset(user.id, %{
  name: "Kapitallebensversicherung",
  currency: "EUR",
  is_active: true,
  created_at_date: ~D[2015-03-15],
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
{:ok, apartment} = Portfolio.create_full_asset(user.id, %{
  name: "Eigentumswohnung München",
  currency: "EUR",
  is_active: true,
  created_at_date: ~D[2018-09-01],
  asset_type_id: real_estate_type.id,
  real_estate_asset: %{
    address: "Maximilianstraße 42, 80539 München",
    size_m2: Decimal.new("85.5"),
    purchase_price: Decimal.new("450000"),
    purchase_date: ~D[2018-09-01]
  }
})

# Cash Asset
{:ok, cash_home} = Portfolio.create_full_asset(user.id, %{
  name: "Bargeld zu Hause",
  currency: "EUR",
  is_active: true,
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
  {:ok, _} = Analytics.create_account_snapshot(user.id, %{
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
  {:ok, _} = Analytics.create_account_snapshot(user.id, %{
    account_id: savings_account.id,
    snapshot_date: date,
    balance: Decimal.new(balance),
    currency: "EUR"
  })
end)

# Depot Snapshots
Enum.each([
  {~D[2025-10-31], "28000.00"},
  {~D[2025-11-30], "29500.00"},
  {~D[2025-12-30], "31000.00"}
], fn {date, balance} ->
  {:ok, _} = Analytics.create_account_snapshot(user.id, %{
    account_id: brokerage_account.id,
    snapshot_date: date,
    balance: Decimal.new(balance),
    currency: "EUR"
  })
end)

# ============================================================================
# 7. Create Asset Snapshots
# ============================================================================
IO.puts("✅ Creating asset snapshots...")

# MSCI World ETF Snapshots
Enum.each([
  {~D[2025-10-31], "110.50", "15000.00"},
  {~D[2025-11-30], "112.80", "15500.00"},
  {~D[2025-12-30], "115.20", "16000.00"}
], fn {date, price, value} ->
  {:ok, _} = Analytics.create_asset_snapshot(user.id, %{
    asset_id: etf_msci_world.id,
    snapshot_date: date,
    quantity: Decimal.new("138.5"),
    price_per_unit: Decimal.new(price),
    total_value: Decimal.new(value),
    currency: "EUR"
  })
end)

# Vanguard All-World Snapshots
Enum.each([
  {~D[2025-10-31], "108.20", "10820.00"},
  {~D[2025-11-30], "110.00", "11000.00"},
  {~D[2025-12-30], "112.50", "11250.00"}
], fn {date, price, value} ->
  {:ok, _} = Analytics.create_asset_snapshot(user.id, %{
    asset_id: etf_vanguard.id,
    snapshot_date: date,
    quantity: Decimal.new("100.0"),
    price_per_unit: Decimal.new(price),
    total_value: Decimal.new(value),
    currency: "EUR"
  })
end)

# Bitcoin ETF Snapshots
Enum.each([
  {~D[2025-10-31], "45.30", "2265.00"},
  {~D[2025-11-30], "48.00", "2400.00"},
  {~D[2025-12-30], "51.50", "2575.00"}
], fn {date, price, value} ->
  {:ok, _} = Analytics.create_asset_snapshot(user.id, %{
    asset_id: bitcoin_etf.id,
    snapshot_date: date,
    quantity: Decimal.new("50.0"),
    price_per_unit: Decimal.new(price),
    total_value: Decimal.new(value),
    currency: "EUR"
  })
end)

# Immobilie Snapshots (gleicher Wert, aber für Tracking)
Enum.each(dates, fn date ->
  {:ok, _} = Analytics.create_asset_snapshot(user.id, %{
    asset_id: apartment.id,
    snapshot_date: date,
    quantity: Decimal.new("1.0"),
    price_per_unit: Decimal.new("480000.00"),
    total_value: Decimal.new("480000.00"),
    currency: "EUR"
  })
end)

# Bargeld Snapshots
Enum.each([
  {~D[2025-10-31], "500.00"},
  {~D[2025-11-30], "450.00"},
  {~D[2025-12-30], "600.00"}
], fn {date, value} ->
  {:ok, _} = Analytics.create_asset_snapshot(user.id, %{
    asset_id: cash_home.id,
    snapshot_date: date,
    quantity: Decimal.new("1.0"),
    price_per_unit: Decimal.new(value),
    total_value: Decimal.new(value),
    currency: "EUR"
  })
end)

IO.puts("\n✅ Seeding completed successfully!\n")
IO.puts("📊 Summary:")
IO.puts("   - Asset Types: #{length(asset_types)}")
IO.puts("   - Institutions: #{map_size(institutions_map)}")
IO.puts("   - Accounts: 4")
IO.puts("   - Assets: 8")
IO.puts("   - Account Snapshots: 9")
IO.puts("   - Asset Snapshots: 15")
IO.puts("\n🎉 You can now log in with:")
IO.puts("   Email: demo@yappma.dev")
IO.puts("   Password: password1234\n")
