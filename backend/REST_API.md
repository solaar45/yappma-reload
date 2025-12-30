# REST API Documentation

Diese Dokumentation beschreibt alle verfügbaren REST-Endpunkte des YAPPMA Backends.

**Base URL**: `http://localhost:4000/api`

---

## 👤 Users

### List all users
```http
GET /api/users
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "name": "Max Mustermann",
      "email": "max@example.com",
      "currency_default": "EUR",
      "inserted_at": "2025-12-30T19:46:40Z",
      "updated_at": "2025-12-30T19:46:40Z"
    }
  ]
}
```

### Get a user
```http
GET /api/users/:id
```

### Create a user
```http
POST /api/users
Content-Type: application/json

{
  "user": {
    "name": "Max Mustermann",
    "email": "max@example.com",
    "currency_default": "EUR"
  }
}
```

**Response** (201 Created):
```json
{
  "data": {
    "id": 1,
    "name": "Max Mustermann",
    "email": "max@example.com",
    "currency_default": "EUR",
    "inserted_at": "2025-12-30T20:00:00Z",
    "updated_at": "2025-12-30T20:00:00Z"
  }
}
```

### Update a user
```http
PUT /api/users/:id
Content-Type: application/json

{
  "user": {
    "name": "Max Updated"
  }
}
```

### Delete a user
```http
DELETE /api/users/:id
```

**Response** (204 No Content)

---

## 🏦 Institutions

### List institutions for a user
```http
GET /api/institutions?user_id=1
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "name": "Deutsche Bank",
      "type": "bank",
      "country": "DE",
      "user_id": 1,
      "inserted_at": "2025-12-30T19:46:40Z",
      "updated_at": "2025-12-30T19:46:40Z"
    }
  ]
}
```

### Create an institution
```http
POST /api/institutions
Content-Type: application/json

{
  "institution": {
    "name": "Trade Republic",
    "type": "broker",
    "country": "DE",
    "user_id": 1
  }
}
```

**Valid types**: `bank`, `broker`, `insurance`, `other`

### Get, Update, Delete
- `GET /api/institutions/:id`
- `PUT /api/institutions/:id`
- `DELETE /api/institutions/:id`

---

## 💳 Accounts

### List accounts for a user
```http
GET /api/accounts?user_id=1
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "name": "Girokonto",
      "type": "checking",
      "currency": "EUR",
      "is_active": true,
      "opened_at": null,
      "closed_at": null,
      "user_id": 1,
      "institution_id": 1,
      "institution": {
        "id": 1,
        "name": "Deutsche Bank",
        "type": "bank",
        "country": "DE"
      },
      "inserted_at": "2025-12-30T19:46:40Z",
      "updated_at": "2025-12-30T19:46:40Z"
    }
  ]
}
```

### Create an account
```http
POST /api/accounts
Content-Type: application/json

{
  "account": {
    "name": "Tagesgeldkonto",
    "type": "savings",
    "currency": "EUR",
    "is_active": true,
    "user_id": 1,
    "institution_id": 1
  }
}
```

**Valid types**: `checking`, `savings`, `credit_card`, `brokerage`, `insurance`, `cash`, `other`

---

## 🏷️ Asset Types

### List all asset types
```http
GET /api/asset_types
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "code": "cash",
      "description": "Cash and equivalents"
    },
    {
      "id": 2,
      "code": "security",
      "description": "Securities (stocks, ETFs, bonds)"
    },
    {
      "id": 3,
      "code": "insurance",
      "description": "Insurance policies"
    },
    {
      "id": 4,
      "code": "loan",
      "description": "Loans and debts"
    },
    {
      "id": 5,
      "code": "real_estate",
      "description": "Real estate properties"
    },
    {
      "id": 6,
      "code": "other",
      "description": "Other assets"
    }
  ]
}
```

### Get a single asset type
```http
GET /api/asset_types/:id
```

---

## 💰 Assets

### List assets for a user
```http
GET /api/assets?user_id=1
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "name": "MSCI World ETF",
      "symbol": "IE00B4L5Y983",
      "currency": "EUR",
      "is_active": true,
      "created_at_date": null,
      "closed_at": null,
      "user_id": 1,
      "account_id": 2,
      "asset_type_id": 2,
      "asset_type": {
        "id": 2,
        "code": "security",
        "description": "Securities (stocks, ETFs, bonds)"
      },
      "account": {
        "id": 2,
        "name": "Depot",
        "type": "brokerage"
      },
      "security_asset": {
        "isin": "IE00B4L5Y983",
        "wkn": null,
        "ticker": "IWDA",
        "exchange": "XETRA",
        "sector": "Diversified"
      },
      "insurance_asset": null,
      "loan_asset": null,
      "real_estate_asset": null,
      "inserted_at": "2025-12-30T20:00:00Z",
      "updated_at": "2025-12-30T20:00:00Z"
    }
  ]
}
```

### Create an asset (Security)
```http
POST /api/assets
Content-Type: application/json

{
  "asset": {
    "name": "Vanguard FTSE All-World",
    "symbol": "IE00BK5BQT80",
    "currency": "EUR",
    "user_id": 1,
    "account_id": 2,
    "asset_type_id": 2,
    "security_asset": {
      "isin": "IE00BK5BQT80",
      "ticker": "VWCE",
      "exchange": "XETRA",
      "sector": "Diversified"
    }
  }
}
```

### Create an asset (Insurance)
```http
POST /api/assets
Content-Type: application/json

{
  "asset": {
    "name": "Privathaftpflicht",
    "currency": "EUR",
    "user_id": 1,
    "asset_type_id": 3,
    "insurance_asset": {
      "insurer_name": "Allianz",
      "policy_number": "12345678",
      "insurance_type": "liability",
      "coverage_amount": "10000000.00",
      "payment_frequency": "yearly"
    }
  }
}
```

### Create an asset (Real Estate)
```http
POST /api/assets
Content-Type: application/json

{
  "asset": {
    "name": "Eigentumswohnung",
    "currency": "EUR",
    "user_id": 1,
    "asset_type_id": 5,
    "real_estate_asset": {
      "address": "Musterstraße 42, 12345 Musterstadt",
      "size_m2": "85.5",
      "purchase_price": "350000.00",
      "purchase_date": "2020-06-15"
    }
  }
}
```

### Get, Update, Delete
- `GET /api/assets/:id`
- `PUT /api/assets/:id`
- `DELETE /api/assets/:id`

---

## 📏 Account Snapshots

### List snapshots for an account
```http
GET /api/account_snapshots?account_id=1
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "snapshot_date": "2025-12-30",
      "balance": "5000.50",
      "currency": "EUR",
      "note": null,
      "account_id": 1,
      "inserted_at": "2025-12-30T19:51:48Z",
      "updated_at": "2025-12-30T19:51:48Z"
    }
  ]
}
```

### Create a snapshot
```http
POST /api/account_snapshots
Content-Type: application/json

{
  "snapshot": {
    "account_id": 1,
    "snapshot_date": "2025-12-30",
    "balance": "5000.50",
    "currency": "EUR",
    "note": "Monatsabschluss"
  }
}
```

**Constraint**: Nur ein Snapshot pro Account und Datum.

### Get, Update, Delete
- `GET /api/account_snapshots/:id`
- `PUT /api/account_snapshots/:id`
- `DELETE /api/account_snapshots/:id`

---

## 📏 Asset Snapshots

### List snapshots for an asset
```http
GET /api/asset_snapshots?asset_id=1
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "snapshot_date": "2025-12-30",
      "quantity": "42.5",
      "market_price_per_unit": "98.75",
      "value": "4196.88",
      "note": null,
      "asset_id": 1,
      "inserted_at": "2025-12-30T20:00:00Z",
      "updated_at": "2025-12-30T20:00:00Z"
    }
  ]
}
```

### Create a snapshot (Security)
```http
POST /api/asset_snapshots
Content-Type: application/json

{
  "snapshot": {
    "asset_id": 1,
    "snapshot_date": "2025-12-30",
    "quantity": "42.5",
    "market_price_per_unit": "98.75",
    "value": "4196.88"
  }
}
```

### Create a snapshot (Insurance)
```http
POST /api/asset_snapshots
Content-Type: application/json

{
  "snapshot": {
    "asset_id": 2,
    "snapshot_date": "2025-12-30",
    "value": "12500.00",
    "note": "Rückkaufswert"
  }
}
```

**Hinweis**: Bei Versicherungen ist nur `value` relevant.

---

## 📊 Dashboard / Analytics

### Get Net Worth
```http
GET /api/dashboard/net_worth?user_id=1&date=2025-12-30
```

**Query Parameters**:
- `user_id` (required): User ID
- `date` (optional): ISO 8601 date (default: today)

**Response** (200 OK):
```json
{
  "data": {
    "total": "125000.00",
    "accounts": "25000.00",
    "assets": "100000.00",
    "date": "2025-12-30"
  }
}
```

### Get Latest Account Snapshots
```http
GET /api/dashboard/account_snapshots?user_id=1&date=2025-12-30
```

**Response** (200 OK):
```json
{
  "data": {
    "snapshots": [
      {
        "id": 1,
        "snapshot_date": "2025-12-30",
        "balance": "5000.50",
        "currency": "EUR",
        "account": {
          "id": 1,
          "name": "Girokonto",
          "type": "checking",
          "institution": {
            "id": 1,
            "name": "Deutsche Bank",
            "type": "bank"
          }
        }
      }
    ],
    "date": "2025-12-30"
  }
}
```

### Get Latest Asset Snapshots
```http
GET /api/dashboard/asset_snapshots?user_id=1&date=2025-12-30
```

**Response** (200 OK):
```json
{
  "data": {
    "snapshots": [
      {
        "id": 1,
        "snapshot_date": "2025-12-30",
        "quantity": "42.5",
        "market_price_per_unit": "98.75",
        "value": "4196.88",
        "asset": {
          "id": 1,
          "name": "MSCI World ETF",
          "symbol": "IE00B4L5Y983",
          "currency": "EUR",
          "asset_type": {
            "id": 2,
            "code": "security",
            "description": "Securities (stocks, ETFs, bonds)"
          },
          "account": {
            "id": 2,
            "name": "Depot",
            "type": "brokerage"
          }
        }
      }
    ],
    "date": "2025-12-30"
  }
}
```

---

## ❌ Error Responses

### Validation Error (422 Unprocessable Entity)
```json
{
  "errors": {
    "email": ["has already been taken"],
    "name": ["can't be blank"]
  }
}
```

### Not Found (404)
```json
{
  "errors": {
    "detail": "Not Found"
  }
}
```

---

## 🗺️ Complete Route List

```
GET     /api/users
POST    /api/users
GET     /api/users/:id
PUT     /api/users/:id
DELETE  /api/users/:id

GET     /api/institutions
POST    /api/institutions
GET     /api/institutions/:id
PUT     /api/institutions/:id
DELETE  /api/institutions/:id

GET     /api/accounts
POST    /api/accounts
GET     /api/accounts/:id
PUT     /api/accounts/:id
DELETE  /api/accounts/:id

GET     /api/asset_types
GET     /api/asset_types/:id

GET     /api/assets
POST    /api/assets
GET     /api/assets/:id
PUT     /api/assets/:id
DELETE  /api/assets/:id

GET     /api/account_snapshots
POST    /api/account_snapshots
GET     /api/account_snapshots/:id
PUT     /api/account_snapshots/:id
DELETE  /api/account_snapshots/:id

GET     /api/asset_snapshots
POST    /api/asset_snapshots
GET     /api/asset_snapshots/:id
PUT     /api/asset_snapshots/:id
DELETE  /api/asset_snapshots/:id

GET     /api/dashboard/net_worth
GET     /api/dashboard/account_snapshots
GET     /api/dashboard/asset_snapshots
```

---

## 🧪 Testing mit curl

```bash
# List users
curl http://localhost:4000/api/users

# Get net worth
curl "http://localhost:4000/api/dashboard/net_worth?user_id=1"

# Create account snapshot
curl -X POST http://localhost:4000/api/account_snapshots \
  -H "Content-Type: application/json" \
  -d '{
    "snapshot": {
      "account_id": 1,
      "snapshot_date": "2025-12-30",
      "balance": "5000.50",
      "currency": "EUR"
    }
  }'
```

---

## 🔗 Weitere Infos

- **Context API**: Siehe `backend/API_REFERENCE.md`
- **Backend-Architektur**: Siehe `backend/BACKEND_DOCUMENTATION.md`
