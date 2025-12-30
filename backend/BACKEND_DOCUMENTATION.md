# YAPPMA Backend Documentation

## Übersicht

Das YAPPMA-Backend ist eine Elixir/Phoenix JSON-API für ein privates Wealth-Tracking-System. Es implementiert ein flexibles Datenmodell mit polymorphen Assets und zeitbasierten Snapshots.

## Tech Stack

- **Framework**: Phoenix 1.8.3 (JSON API, kein HTML-Rendering)
- **Sprache**: Elixir 1.17.3 / OTP 27
- **Datenbank**: PostgreSQL (lokal)
- **ORM**: Ecto 3.13.5

## Architektur

Das Backend folgt der Phoenix-Context-Architektur mit drei Hauptbereichen:

### 1. Accounts Context
**Pfad**: `lib/wealth_backend/accounts.ex`

Verwaltet Benutzer, Finanzinstitutionen und Konten.

#### Schemas:

##### User (`users`)
```elixir
schema "users" do
  field :name, :string
  field :email, :string              # unique
  field :currency_default, :string   # z.B. "EUR"
  has_many :institutions
  has_many :accounts
end
```

##### Institution (`institutions`)
```elixir
schema "institutions" do
  field :name, :string
  field :type, Ecto.Enum            # :bank | :broker | :insurance | :other
  field :country, :string
  belongs_to :user
  has_many :accounts
end
```

##### Account (`accounts`)
```elixir
schema "accounts" do
  field :name, :string
  field :type, Ecto.Enum            # :checking | :savings | :credit_card | :brokerage | :insurance | :cash | :other
  field :currency, :string
  field :is_active, :boolean
  field :opened_at, :date
  field :closed_at, :date
  belongs_to :user
  belongs_to :institution           # nullable
end
```

#### Wichtige Funktionen:
- `list_users/0`
- `create_user/1`
- `list_institutions/1` - Filtert nach User-ID
- `list_accounts/1` - Filtert nach User-ID, preloaded mit Institution

---

### 2. Portfolio Context
**Pfad**: `lib/wealth_backend/portfolio.ex`

Verwaltet Assets mit polymorphem Typ-System.

#### Schemas:

##### AssetType (`asset_types`)
```elixir
schema "asset_types" do
  field :code, :string              # unique: "cash", "security", "insurance", "loan", "real_estate", "other"
  field :description, :string
end
```

##### Asset (`assets`) - Basis-Tabelle
```elixir
schema "assets" do
  field :name, :string
  field :symbol, :string            # ISIN, Ticker, etc.
  field :currency, :string
  field :is_active, :boolean
  field :created_at_date, :date
  field :closed_at, :date
  belongs_to :user
  belongs_to :account               # nullable
  belongs_to :asset_type
  
  # Polymorphe 1:1 Beziehungen
  has_one :security_asset
  has_one :insurance_asset
  has_one :loan_asset
  has_one :real_estate_asset
end
```

##### Typ-spezifische Tabellen

**SecurityAsset** (`security_assets`):
```elixir
@primary_key {:asset_id, :id, autogenerate: false}
schema "security_assets" do
  field :isin, :string
  field :wkn, :string
  field :ticker, :string
  field :exchange, :string
  field :sector, :string
  belongs_to :asset, define_field: false
end
```

**InsuranceAsset** (`insurance_assets`):
```elixir
@primary_key {:asset_id, :id, autogenerate: false}
schema "insurance_assets" do
  field :insurer_name, :string
  field :policy_number, :string
  field :insurance_type, :string
  field :coverage_amount, :decimal
  field :deductible, :decimal
  field :payment_frequency, :string
end
```

**LoanAsset** (`loan_assets`):
```elixir
field :interest_rate, :decimal
field :payment_frequency, :string
field :maturity_date, :date
```

**RealEstateAsset** (`real_estate_assets`):
```elixir
field :address, :string
field :size_m2, :decimal
field :purchase_price, :decimal
field :purchase_date, :date
```

#### Wichtige Funktionen:

**`create_full_asset/1`**  
Die zentrale Funktion zum Anlegen von Assets mit Typ-Details:

```elixir
# Beispiel: Wertpapier anlegen
Portfolio.create_full_asset(%{
  name: "MSCI World ETF",
  symbol: "IE00B4L5Y983",
  currency: "EUR",
  user_id: 1,
  account_id: 2,
  asset_type_id: 2,  # security
  security_asset: %{
    isin: "IE00B4L5Y983",
    ticker: "IWDA",
    exchange: "XETRA"
  }
})
```

Nutzt `Ecto.Multi` für atomare Transaktionen (Asset + Typ-Details).

---

### 3. Analytics Context
**Pfad**: `lib/wealth_backend/analytics.ex`

Verwaltet zeitbasierte Snapshots und Aggregationen.

#### Schemas:

##### AccountSnapshot (`account_snapshots`)
```elixir
schema "account_snapshots" do
  field :snapshot_date, :date       # unique per account_id
  field :balance, :decimal
  field :currency, :string
  field :note, :string
  belongs_to :account
end
```

##### AssetSnapshot (`asset_snapshots`)
```elixir
schema "asset_snapshots" do
  field :snapshot_date, :date       # unique per asset_id
  field :quantity, :decimal         # Stückzahl (z.B. bei Wertpapieren)
  field :market_price_per_unit, :decimal
  field :value, :decimal            # Gesamtwert
  field :note, :string
  belongs_to :asset
end
```

#### Wichtige Funktionen:

**CRUD für Snapshots:**
- `create_account_snapshot/1`
- `list_account_snapshots/1` - Sortiert nach Datum (neueste zuerst)

**Aggregationen:**

**`get_latest_account_snapshots/2`**  
Holt die jeweils neuesten Snapshots aller Accounts eines Users bis zu einem Datum.

```elixir
Analytics.get_latest_account_snapshots(user_id, ~D[2025-12-30])
# => Liste von AccountSnapshots mit preloaded Account + Institution
```

**Technische Details:**
- Nutzt SQL-Subquery mit `MAX()` für Performance
- Vermeidet N+1 Queries durch intelligentes Preloading

**`calculate_net_worth/2`**  
Berechnet das Gesamtvermögen eines Users.

```elixir
Analytics.calculate_net_worth(user_id, Date.utc_today())
# => %{
#   total: #Decimal<125000.00>,
#   accounts: #Decimal<25000.00>,
#   assets: #Decimal<100000.00>
# }
```

---

## Datenbank-Schema

### ER-Diagramm (vereinfacht)

```
User
  ├─1:N─> Institution
  ├─1:N─> Account
  └─1:N─> Asset

Account
  ├─N:1─> Institution (optional)
  └─1:N─> AccountSnapshot

Asset
  ├─N:1─> Account (optional)
  ├─N:1─> AssetType
  ├─1:1─> SecurityAsset (conditional)
  ├─1:1─> InsuranceAsset (conditional)
  ├─1:1─> LoanAsset (conditional)
  ├─1:1─> RealEstateAsset (conditional)
  └─1:N─> AssetSnapshot
```

### Constraints & Indizes

- **Unique Constraints:**
  - `users.email`
  - `asset_types.code`
  - `account_snapshots(account_id, snapshot_date)`
  - `asset_snapshots(asset_id, snapshot_date)`

- **Foreign Key Cascades:**
  - User-Deletion → Cascade zu Institutions, Accounts, Assets
  - Account-Deletion → Cascade zu AccountSnapshots
  - Asset-Deletion → Cascade zu AssetSnapshots und Typ-Tabellen

---

## Setup & Development

### Ersteinrichtung

```bash
cd backend
mix deps.get
mix ecto.setup              # Erstellt DB, führt Migrationen aus, lädt Seeds
mix phx.server              # Startet Server auf Port 4000
```

### Migrationen

Alle Migrationen befinden sich in `priv/repo/migrations/`:

1. `20251230192001` - Users
2. `20251230192002` - Institutions
3. `20251230192003` - Accounts
4. `20251230193001` - AssetTypes
5. `20251230193002` - Assets
6. `20251230193003` - SecurityAssets
7. `20251230193004` - InsuranceAssets
8. `20251230193005` - LoanAssets
9. `20251230193006` - RealEstateAssets
10. `20251230194001` - AccountSnapshots
11. `20251230194002` - AssetSnapshots

### Seeds

Die Seeds (`priv/repo/seeds.exs`) erstellen:
- 6 Asset-Typen (cash, security, insurance, loan, real_estate, other)
- Test-User (email: `test@example.com`)
- Test-Institution (Deutsche Bank)
- 2 Test-Accounts (Girokonto, Depot)

**Ausführen:**
```bash
mix run priv/repo/seeds.exs
```

---

## Testing in IEx

### Beispiel-Session

```elixir
# IEx starten
iex -S mix

# Aliases setzen
alias WealthBackend.{Accounts, Portfolio, Analytics, Repo}
alias WealthBackend.Accounts.User

# User holen
user = Repo.get_by!(User, email: "test@example.com")

# Accounts listen
Accounts.list_accounts(user.id)

# Asset-Typen anzeigen
Portfolio.list_asset_types()

# Security-Asset erstellen
security_type = Portfolio.get_asset_type_by_code("security")
{:ok, asset} = Portfolio.create_full_asset(%{
  name: "MSCI World",
  currency: "EUR",
  user_id: user.id,
  account_id: 4,  # Depot
  asset_type_id: security_type.id,
  security_asset: %{
    isin: "IE00B4L5Y983",
    ticker: "IWDA"
  }
})

# Snapshot erstellen
Analytics.create_asset_snapshot(%{
  asset_id: asset.id,
  snapshot_date: Date.utc_today(),
  quantity: Decimal.new("10"),
  market_price_per_unit: Decimal.new("95.50"),
  value: Decimal.new("955.00")
})

# Net Worth berechnen
Analytics.calculate_net_worth(user.id)
```

---

## Design-Entscheidungen

### Warum Ecto.Enum statt String?
- **Typsicherheit**: Compiler-Fehler bei falschen Werten
- **Performance**: Interne Integer-Speicherung
- **Dokumentation**: Erlaubte Werte direkt im Schema

### Warum Decimal statt Float?
- **Finanzgenauigkeit**: Vermeidet Rundungsfehler (0.1 + 0.2 ≠ 0.3)
- **Standard**: PostgreSQL `NUMERIC` ist perfekt für Geldbeträge

### Warum polymorphe Assets?
- **Flexibilität**: Neue Asset-Typen ohne Schema-Migration
- **Klarheit**: Typ-spezifische Felder nur wo nötig
- **Performance**: Base-Queries bleiben schlank

### Warum Snapshots statt Transaktionen?
- **Einfachheit**: Manuelle Eingabe ohne doppelte Buchführung
- **Flexibilität**: Import aus Bank-Exports möglich
- **Performance**: Zeitreihen-Queries extrem schnell

---

## Nächste Schritte

### Geplante Erweiterungen:

1. **JSON-API-Controller**
   - REST-Endpunkte für Frontend
   - Authentifizierung (Guardian/JWT)

2. **Transaktionen (optional)**
   - Tabellen: `categories`, `transactions`
   - Automatische Snapshot-Generierung

3. **Background Jobs**
   - Automatische Kursupdates via Oban
   - APIs: Yahoo Finance, Alpha Vantage

4. **Auswertungen**
   - Asset-Allocation nach Typ/Sektor
   - Historische Performance
   - Währungsumrechnung

5. **Deployment**
   - Dockerfile für Unraid
   - Docker Compose mit Caddy/Traefik

---

## Troubleshooting

### Migration-Fehler

```bash
mix ecto.reset    # Löscht DB und erstellt neu (nur Development!)
```

### Port bereits belegt

Ändere in `config/dev.exs`:
```elixir
config :wealth_backend, WealthBackendWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4001]
```

### Seeds mehrfach ausführen

Seeds nutzen `Repo.delete_all` → IDs werden nicht zurückgesetzt.  
Für "saubere" IDs: `mix ecto.reset`

---

## Kontakt & Entwicklung

**Repository**: [solaar45/yappma-reload](https://github.com/solaar45/yappma-reload)  
**Status**: Phase 1-4 abgeschlossen (Datenmodell + Contexts)  
**Lizenz**: Private Nutzung
