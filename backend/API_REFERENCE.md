# API Reference - Backend Contexts

Diese Referenz dokumentiert alle öffentlichen Funktionen der drei Haupt-Contexts.

---

## Accounts Context

**Modul**: `WealthBackend.Accounts`

### Users

#### `list_users/0`
Listet alle User.

**Rückgabe**: `[%User{}]`

#### `get_user!/1`
Holt einen User per ID (wirft Exception bei Not Found).

**Parameter**: `id :: integer()`  
**Rückgabe**: `%User{}`

#### `create_user/1`
Erstellt einen neuen User.

**Parameter**:
```elixir
attrs :: %{
  name: String.t(),
  email: String.t(),
  currency_default: String.t() # optional, default "EUR"
}
```

**Rückgabe**: `{:ok, %User{}} | {:error, %Ecto.Changeset{}}`

**Beispiel**:
```elixir
Accounts.create_user(%{
  name: "Max Mustermann",
  email: "max@example.com",
  currency_default: "EUR"
})
```

#### `update_user/2`
Aktualisiert einen User.

**Parameter**: `user :: %User{}`, `attrs :: map()`  
**Rückgabe**: `{:ok, %User{}} | {:error, %Ecto.Changeset{}}`

#### `delete_user/1`
Löscht einen User (cascaded zu allen zugehörigen Daten).

**Parameter**: `user :: %User{}`  
**Rückgabe**: `{:ok, %User{}} | {:error, %Ecto.Changeset{}}`

---

### Institutions

#### `list_institutions/1`
Listet alle Institutionen eines Users.

**Parameter**: `user_id :: integer()`  
**Rückgabe**: `[%Institution{}]`

#### `get_institution!/1`
Holt eine Institution per ID.

**Parameter**: `id :: integer()`  
**Rückgabe**: `%Institution{}`

#### `create_institution/1`
Erstellt eine neue Institution.

**Parameter**:
```elixir
attrs :: %{
  name: String.t(),
  type: :bank | :broker | :insurance | :other,
  country: String.t(),  # optional
  user_id: integer()
}
```

**Rückgabe**: `{:ok, %Institution{}} | {:error, %Ecto.Changeset{}}`

**Beispiel**:
```elixir
Accounts.create_institution(%{
  name: "Trade Republic",
  type: :broker,
  country: "DE",
  user_id: 1
})
```

---

### Accounts

#### `list_accounts/1`
Listet alle Accounts eines Users (mit preloaded Institution).

**Parameter**: `user_id :: integer()`  
**Rückgabe**: `[%Account{institution: %Institution{}}]`

#### `get_account!/1`
Holt ein Account per ID (mit preloaded Institution).

**Parameter**: `id :: integer()`  
**Rückgabe**: `%Account{}`

#### `create_account/1`
Erstellt ein neues Account.

**Parameter**:
```elixir
attrs :: %{
  name: String.t(),
  type: :checking | :savings | :credit_card | :brokerage | :insurance | :cash | :other,
  currency: String.t(),
  is_active: boolean(),  # optional, default true
  opened_at: Date.t(),   # optional
  closed_at: Date.t(),   # optional
  user_id: integer(),
  institution_id: integer()  # optional
}
```

**Rückgabe**: `{:ok, %Account{}} | {:error, %Ecto.Changeset{}}`

**Beispiel**:
```elixir
Accounts.create_account(%{
  name: "Tagesgeldkonto",
  type: :savings,
  currency: "EUR",
  user_id: 1,
  institution_id: 2
})
```

---

## Portfolio Context

**Modul**: `WealthBackend.Portfolio`

### Asset Types

#### `list_asset_types/0`
Listet alle verfügbaren Asset-Typen.

**Rückgabe**: `[%AssetType{}]`

**Standardtypen**:
- `cash` - Bargeld und Äquivalente
- `security` - Wertpapiere (Aktien, ETFs, Anleihen)
- `insurance` - Versicherungen
- `loan` - Kredite und Schulden
- `real_estate` - Immobilien
- `other` - Sonstige

#### `get_asset_type!/1`
Holt einen Asset-Typ per ID.

#### `get_asset_type_by_code/1`
Holt einen Asset-Typ per Code.

**Parameter**: `code :: String.t()`  
**Rückgabe**: `%AssetType{} | nil`

**Beispiel**:
```elixir
security_type = Portfolio.get_asset_type_by_code("security")
```

---

### Assets

#### `list_assets/1`
Listet alle Assets eines Users (mit preloaded Daten).

**Parameter**: `user_id :: integer()`  
**Rückgabe**: `[%Asset{account: ..., asset_type: ..., security_asset: ...}]`

#### `get_asset!/1`
Holt ein Asset per ID (mit allen Typ-Daten).

**Parameter**: `id :: integer()`  
**Rückgabe**: `%Asset{}`

#### `create_full_asset/1` ⭐
Die zentrale Funktion zum Anlegen von Assets **mit** Typ-spezifischen Daten.

**Parameter**:
```elixir
attrs :: %{
  # Base Asset
  name: String.t(),
  symbol: String.t(),        # optional
  currency: String.t(),
  is_active: boolean(),      # optional, default true
  created_at_date: Date.t(), # optional
  user_id: integer(),
  account_id: integer(),     # optional
  asset_type_id: integer(),
  
  # Typ-spezifisch (abhängig von asset_type_id):
  security_asset: %{         # falls type = "security"
    isin: String.t(),
    wkn: String.t(),
    ticker: String.t(),
    exchange: String.t(),
    sector: String.t()
  },
  insurance_asset: %{        # falls type = "insurance"
    insurer_name: String.t(),
    policy_number: String.t(),
    insurance_type: String.t(),
    coverage_amount: Decimal.t(),
    deductible: Decimal.t(),
    payment_frequency: String.t()
  },
  loan_asset: %{             # falls type = "loan"
    interest_rate: Decimal.t(),
    payment_frequency: String.t(),
    maturity_date: Date.t()
  },
  real_estate_asset: %{      # falls type = "real_estate"
    address: String.t(),
    size_m2: Decimal.t(),
    purchase_price: Decimal.t(),
    purchase_date: Date.t()
  }
}
```

**Rückgabe**: `{:ok, %Asset{}} | {:error, %Ecto.Changeset{}}`

**Beispiele**:

```elixir
# Wertpapier
Portfolio.create_full_asset(%{
  name: "Vanguard FTSE All-World",
  symbol: "IE00BK5BQT80",
  currency: "EUR",
  user_id: 1,
  account_id: 4,
  asset_type_id: 2,  # security
  security_asset: %{
    isin: "IE00BK5BQT80",
    ticker: "VWCE",
    exchange: "XETRA",
    sector: "Diversified"
  }
})

# Versicherung
Portfolio.create_full_asset(%{
  name: "Privathaftpflicht",
  currency: "EUR",
  user_id: 1,
  asset_type_id: 3,  # insurance
  insurance_asset: %{
    insurer_name: "Allianz",
    policy_number: "12345678",
    insurance_type: "liability",
    coverage_amount: Decimal.new("10000000"),
    payment_frequency: "yearly"
  }
})

# Immobilie
Portfolio.create_full_asset(%{
  name: "Eigentumswohnung",
  currency: "EUR",
  user_id: 1,
  asset_type_id: 5,  # real_estate
  real_estate_asset: %{
    address: "Musterstraße 42, 12345 Musterstadt",
    size_m2: Decimal.new("85.5"),
    purchase_price: Decimal.new("350000"),
    purchase_date: ~D[2020-06-15]
  }
})
```

**Technische Details**:
- Nutzt `Ecto.Multi` für atomare Transaktion
- Entscheidet anhand `asset_type.code`, welche Sub-Tabelle befüllt wird
- Gibt vollständig geladenes Asset zurück

---

## Analytics Context

**Modul**: `WealthBackend.Analytics`

### Account Snapshots

#### `list_account_snapshots/1`
Listet alle Snapshots eines Accounts (neueste zuerst).

**Parameter**: `account_id :: integer()`  
**Rückgabe**: `[%AccountSnapshot{}]`

#### `create_account_snapshot/1`
Erstellt einen neuen Account-Snapshot.

**Parameter**:
```elixir
attrs :: %{
  account_id: integer(),
  snapshot_date: Date.t(),
  balance: Decimal.t(),
  currency: String.t(),
  note: String.t()  # optional
}
```

**Rückgabe**: `{:ok, %AccountSnapshot{}} | {:error, %Ecto.Changeset{}}`

**Constraint**: Nur ein Snapshot pro Account und Datum (unique constraint).

**Beispiel**:
```elixir
Analytics.create_account_snapshot(%{
  account_id: 3,
  snapshot_date: ~D[2025-12-30],
  balance: Decimal.new("15234.89"),
  currency: "EUR",
  note: "Jahresabschluss"
})
```

---

### Asset Snapshots

#### `list_asset_snapshots/1`
Listet alle Snapshots eines Assets (neueste zuerst).

**Parameter**: `asset_id :: integer()`  
**Rückgabe**: `[%AssetSnapshot{}]`

#### `create_asset_snapshot/1`
Erstellt einen neuen Asset-Snapshot.

**Parameter**:
```elixir
attrs :: %{
  asset_id: integer(),
  snapshot_date: Date.t(),
  quantity: Decimal.t(),              # optional
  market_price_per_unit: Decimal.t(), # optional
  value: Decimal.t(),                 # Pflichtfeld
  note: String.t()                    # optional
}
```

**Rückgabe**: `{:ok, %AssetSnapshot{}} | {:error, %Ecto.Changeset{}}`

**Beispiele**:

```elixir
# Wertpapier (mit Stückzahl)
Analytics.create_asset_snapshot(%{
  asset_id: 5,
  snapshot_date: ~D[2025-12-30],
  quantity: Decimal.new("42.5"),
  market_price_per_unit: Decimal.new("98.75"),
  value: Decimal.new("4196.875")
})

# Versicherung (ohne Stückzahl, nur Rückkaufswert)
Analytics.create_asset_snapshot(%{
  asset_id: 8,
  snapshot_date: ~D[2025-12-30],
  value: Decimal.new("12500.00")
})
```

---

### Aggregationen

#### `get_latest_account_snapshots/2` ⭐
Holt die jeweils neuesten Snapshots aller Accounts eines Users.

**Parameter**:
- `user_id :: integer()`
- `date :: Date.t()` - optional, default `Date.utc_today()`

**Rückgabe**: `[%AccountSnapshot{account: %Account{institution: %Institution{}}}]`

**Performance**: Nutzt SQL-Subquery mit `MAX()` → 1 Query für alle Accounts.

**Beispiel**:
```elixir
# Aktuelle Stände
Analytics.get_latest_account_snapshots(user_id)

# Historische Stände (z.B. Jahresende 2024)
Analytics.get_latest_account_snapshots(user_id, ~D[2024-12-31])
```

#### `get_latest_asset_snapshots/2`
Analog zu Account-Snapshots, aber für Assets.

**Parameter**: `user_id :: integer()`, `date :: Date.t()`  
**Rückgabe**: `[%AssetSnapshot{asset: %Asset{...}}]`

#### `calculate_net_worth/2` ⭐
Berechnet das Gesamtvermögen eines Users.

**Parameter**:
- `user_id :: integer()`
- `date :: Date.t()` - optional, default `Date.utc_today()`

**Rückgabe**:
```elixir
%{
  total: Decimal.t(),     # Summe aus accounts + assets
  accounts: Decimal.t(),  # Summe aller Account-Balances
  assets: Decimal.t()     # Summe aller Asset-Values
}
```

**Beispiel**:
```elixir
Analytics.calculate_net_worth(user_id)
# => %{
#   total: #Decimal<125000.00>,
#   accounts: #Decimal<25000.00>,
#   assets: #Decimal<100000.00>
# }
```

**Anwendungsfall**: Dashboard "Vermögensübersicht"

---

## Fehlerbehandlung

Alle `create_*` und `update_*` Funktionen returnen:
- `{:ok, struct}` bei Erfolg
- `{:error, %Ecto.Changeset{}}` bei Validierungsfehlern

### Typische Fehler:

**Unique Constraint Violation**:
```elixir
{:error, changeset} = Analytics.create_account_snapshot(%{
  account_id: 3,
  snapshot_date: ~D[2025-12-30],  # existiert schon
  balance: Decimal.new("1000")
})

changeset.errors
# => [snapshot_date: {"has already been taken", [constraint: :unique, ...]}]
```

**Foreign Key Constraint**:
```elixir
{:error, changeset} = Accounts.create_account(%{
  name: "Test",
  user_id: 9999  # existiert nicht
})

changeset.errors
# => [user_id: {"does not exist", [constraint: :foreign, ...]}]
```

---

## Best Practices

### 1. Immer Decimal für Geldbeträge
```elixir
# ✅ Korrekt
balance: Decimal.new("1234.56")

# ❌ Falsch
balance: 1234.56  # Float!
```

### 2. Preloading beachten
```elixir
# Ineffizient (N+1 Query)
accounts = Accounts.list_accounts(user_id)
Enum.map(accounts, fn acc -> acc.institution.name end)

# Effizient (bereits preloaded)
accounts = Accounts.list_accounts(user_id)
Enum.map(accounts, fn acc -> acc.institution.name end)  # kein weiterer Query
```

### 3. Snapshots konsistent anlegen
```elixir
# Bei Wertpapieren: quantity * price = value
%{
  quantity: Decimal.new("10"),
  market_price_per_unit: Decimal.new("100"),
  value: Decimal.new("1000")  # manuell berechnen
}
```

### 4. Asset-Typ-ID cachen
```elixir
# Einmal holen
security_type = Portfolio.get_asset_type_by_code("security")

# Mehrfach verwenden
Portfolio.create_full_asset(%{..., asset_type_id: security_type.id})
Portfolio.create_full_asset(%{..., asset_type_id: security_type.id})
```

---

## Zukünftige API-Erweiterungen

### Geplant:

```elixir
# Asset-Allocation
Analytics.get_asset_allocation_by_type(user_id, date)
# => %{security: 60%, cash: 20%, real_estate: 20%}

# Historische Performance
Analytics.get_net_worth_history(user_id, from_date, to_date)
# => [%{date: ~D[...], total: ...}, ...]

# Währungsumrechnung
Analytics.calculate_net_worth(user_id, date, target_currency: "USD")
```
