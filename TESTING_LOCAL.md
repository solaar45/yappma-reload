# FinTS Integration - Lokales Testing (ohne Docker)

## 🎯 Übersicht

Diese Anleitung beschreibt das lokale Testen der FinTS-Integration **ohne Docker**.

---

## ⚙️ Voraussetzungen

- **PostgreSQL 16+** (lokal installiert)
- **Elixir 1.15+** & **Erlang/OTP 26+**
- **Python 3.11+**
- **Mix** Dependencies

---

## 📦 Setup Reihenfolge

### 1️⃣ **PostgreSQL vorbereiten**

```bash
# PostgreSQL Service starten (Linux)
sudo systemctl start postgresql

# PostgreSQL Service starten (macOS mit Homebrew)
brew services start postgresql

# PostgreSQL Service starten (Windows)
# PostgreSQL Service über Services-Manager starten

# Datenbank erstellen
psql -U postgres -c "CREATE DATABASE wealth_backend_dev;"

# Optional: User erstellen (falls nicht vorhanden)
psql -U postgres -c "CREATE USER postgres WITH PASSWORD 'postgres';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE wealth_backend_dev TO postgres;"
```

---

### 2️⃣ **Python FinTS Worker starten**

```bash
# Terminal 1: FinTS Worker
cd fints-worker

# Virtual Environment erstellen
python -m venv venv

# Aktivieren
source venv/bin/activate  # Linux/Mac
# ODER
venv\Scripts\activate     # Windows

# Dependencies installieren
pip install -r requirements.txt

# Environment Variables setzen
export FINTS_API_KEY=dev-test-key-12345
export PORT=5000

# Server starten
python app.py
```

**Erwartete Ausgabe:**
```
 * Running on http://0.0.0.0:5000
 * Running on http://127.0.0.1:5000
```

**Health Check:**
```bash
# Neues Terminal
curl http://localhost:5000/api/fints/health
# Erwartete Response: {"status":"healthy","service":"fints-worker","version":"1.0.0"}
```

---

### 3️⃣ **Elixir Backend starten**

```bash
# Terminal 2: Backend
cd backend

# Dependencies installieren
mix deps.get

# Compile
mix compile

# Environment Variables setzen
export FINTS_WORKER_URL=http://localhost:5000
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/wealth_backend_dev

# Datenbank erstellen & Migrations
mix ecto.create
mix ecto.migrate

# Seeds ausführen (DKB + comdirect)
mix run priv/repo/seeds/fints_banks.exs

# Server starten
mix phx.server
```

**Erwartete Ausgabe:**
```
[info] Running WealthBackendWeb.Endpoint with Bandit 1.x.x at 127.0.0.1:4000 (http)
[info] Access WealthBackendWeb.Endpoint at http://localhost:4000
```

**Health Check:**
```bash
# Neues Terminal
curl http://localhost:4000/api/health
```

---

## 🧪 Testing der FinTS Integration

### **Test 1: FinTS Worker - Connection Test**

```bash
curl -X POST http://localhost:5000/api/fints/test-connection \
  -H "X-API-Key: dev-test-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "blz": "12030000",
    "user_id": "test",
    "pin": "test",
    "fints_url": "https://banking-dkb.s-fints-pt-dkb.de/fints30"
  }'
```

**Erwartete Response (Fehler ist OK - keine echten Credentials):**
```json
{
  "success": false,
  "error": "..."
}
```

---

### **Test 2: Backend - Institutions Check**

```bash
# Prüfen ob DKB und comdirect in DB sind
curl http://localhost:4000/api/institutions
```

**Erwartete Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "DKB (Deutsche Kreditbank)",
      "type": "bank",
      "country": "DE",
      ...
    },
    {
      "id": 2,
      "name": "comdirect bank AG",
      "type": "bank",
      "country": "DE",
      ...
    }
  ]
}
```

---

### **Test 3: Backend - Bank Connection erstellen (Test-Mode)**

```bash
curl -X POST http://localhost:4000/api/bank_connections \
  -H "Content-Type: application/json" \
  -d '{
    "bank_connection": {
      "name": "Test DKB",
      "blz": "12030000",
      "fints_url": "https://banking-dkb.s-fints-pt-dkb.de/fints30",
      "banking_user_id": "test-user",
      "banking_pin": "test-pin",
      "institution_id": 1
    }
  }'
```

**Problem:** ⚠️ Das wird fehlschlagen wegen fehlendem `user_id` (Authentication fehlt noch)

---

## 🔧 Workaround für Testing ohne Auth

Temporär in `bank_connection_controller.ex` ändern:

```elixir
def create(conn, %{"bank_connection" => bank_connection_params}) do
  # Temporär: Hardcoded User ID für Testing
  bank_connection_params = Map.put(bank_connection_params, "user_id", 1)
  
  with {:ok, %BankConnection{} = bank_connection} <-
         BankConnections.create_bank_connection(bank_connection_params) do
    conn
    |> put_status(:created)
    |> render(:show, bank_connection: bank_connection)
  end
end
```

**Oder via IEx (Interactive Elixir):**

```bash
# Im backend/ Verzeichnis
iex -S mix

# In IEx:
alias WealthBackend.Accounts.User
alias WealthBackend.Repo

# Test User erstellen
{:ok, user} = %User{}
  |> User.changeset(%{email: "test@example.com", username: "testuser"})
  |> Repo.insert()

# User ID notieren (z.B. 1)
user.id
```

---

## 🧪 Vollständiger Test-Flow via IEx

```elixir
# Terminal 3: IEx Console
cd backend
iex -S mix

# === Setup ===
alias WealthBackend.BankConnections
alias WealthBackend.BankConnections.BankConnection
alias WealthBackend.Accounts.User
alias WealthBackend.Repo

# User erstellen (falls nicht vorhanden)
{:ok, user} = %User{} 
  |> User.changeset(%{email: "test@test.de", username: "testuser"})
  |> Repo.insert()

# === Test 1: Bank Connection erstellen ===
{:ok, connection} = BankConnections.create_bank_connection(%{
  name: "Test DKB Connection",
  blz: "12030000",
  fints_url: "https://banking-dkb.s-fints-pt-dkb.de/fints30",
  banking_user_id: "deine-echte-user-id",  # Deine DKB Login-ID
  banking_pin: "deine-echte-pin",          # Deine DKB PIN
  user_id: user.id,
  institution_id: 1  # DKB aus Seeds
})

# === Test 2: Connection testen ===
BankConnections.test_connection(%{
  blz: "12030000",
  banking_user_id: "deine-echte-user-id",
  banking_pin: "deine-echte-pin",
  fints_url: "https://banking-dkb.s-fints-pt-dkb.de/fints30"
})
# Erwartete Response (mit echten Daten):
# {:ok, %{"account_count" => 2, "message" => "Connection successful", "success" => true}}

# === Test 3: Konten abrufen ===
{:ok, accounts} = BankConnections.fetch_bank_accounts(connection.id)
# Zeigt deine DKB Konten an

# === Test 4: Bank Account erstellen ===
account = List.first(accounts)

{:ok, bank_account} = BankConnections.create_bank_account(%{
  iban: account["iban"],
  account_number: account["account_number"],
  account_name: account["account_name"],
  bic: account["bic"],
  bank_connection_id: connection.id
})

# === Test 5: YAPPMA Account erstellen und verknüpfen ===
alias WealthBackend.Accounts

{:ok, yappma_account} = Accounts.create_account(%{
  name: "Mein DKB Girokonto",
  type: :checking,
  currency: "EUR",
  user_id: user.id
})

# Bank Account mit YAPPMA Account verknüpfen
{:ok, _} = BankConnections.link_bank_account(bank_account.id, yappma_account.id)

# === Test 6: Balance Sync! ===
{:ok, results} = BankConnections.sync_balances(connection.id)
# Erstellt automatisch AccountSnapshots!

# === Test 7: Snapshots prüfen ===
alias WealthBackend.Analytics

snapshots = Analytics.list_account_snapshots(yappma_account.id)
# Zeigt den importierten Snapshot
```

---

## ✅ Erfolgreiche Test-Signale

### FinTS Worker:
- ✅ Health Check: `200 OK`
- ✅ Connection Test: `{"success": true, "account_count": X}`
- ✅ Fetch Accounts: `{"success": true, "accounts": [...]}`
- ✅ Fetch Balances: `{"success": true, "balances": [...]}`

### Elixir Backend:
- ✅ Server läuft auf Port 4000
- ✅ Migrations erfolgreich
- ✅ Seeds geladen (DKB + comdirect)
- ✅ Bank Connection erstellt
- ✅ Bank Accounts abgerufen
- ✅ Account Snapshots erstellt via Sync

---

## 🐛 Troubleshooting

### Problem: PostgreSQL Connection Failed
```bash
# PostgreSQL läuft?
sudo systemctl status postgresql

# Port 5432 frei?
netstat -an | grep 5432

# Config checken
cat backend/config/dev.exs
```

### Problem: FinTS Worker nicht erreichbar
```bash
# Python läuft?
ps aux | grep python

# Port 5000 frei?
netstat -an | grep 5000

# Logs ansehen
# Im fints-worker Terminal
```

### Problem: Mix Dependencies fehlen
```bash
cd backend
mix deps.clean --all
mix deps.get
mix compile
```

### Problem: FinTS Connection Failed
- ✅ Echte DKB/comdirect Credentials verwenden
- ✅ BLZ korrekt (8 Ziffern)
- ✅ FinTS URL korrekt
- ⚠️ PSD2: TAN-Verfahren wird möglicherweise abgefragt

---

## 📋 Quick Command Reference

```bash
# === PostgreSQL ===
sudo systemctl start postgresql          # Start
psql -U postgres -l                      # Liste DBs

# === Python Worker ===
cd fints-worker
source venv/bin/activate                 # Activate venv
python app.py                            # Start server
curl http://localhost:5000/api/fints/health  # Health check

# === Elixir Backend ===
cd backend
mix deps.get                             # Install deps
mix ecto.create                          # Create DB
mix ecto.migrate                         # Run migrations
mix run priv/repo/seeds/fints_banks.exs  # Seed banks
mix phx.server                           # Start server
iex -S mix                              # Interactive shell

# === Testing ===
curl http://localhost:4000/api/health    # Backend health
curl http://localhost:5000/api/fints/health  # Worker health
```

---

## 🎯 Nächste Schritte nach erfolgreichem Test

1. ✅ **Backend funktioniert** → Frontend entwickeln
2. ✅ **Sync funktioniert** → Authentication hinzufügen
3. ✅ **Snapshots erstellt** → Dashboard visualisieren
4. ✅ **Alles läuft** → Auto-Sync (Phase 2) implementieren

---

**Viel Erfolg beim Testing!** 🚀

Bei Problemen: Terminal-Outputs teilen für Debugging.
