# Styx PSD2 Mock Server

Mock server for testing PSD2 bank connections without real banking APIs.

## Installation

```bash
cd styx-mock
npm install
```

## Usage

```bash
npm start
```

Server runs on http://localhost:8093

## Endpoints

- `GET /aspsps` - List available banks
- `POST /consents/create` - Create consent
- `GET /consents/:id/accounts` - Get accounts for consent
- `GET /consents/:id/accounts/:accountId/transactions` - Get transactions for account

## Mock Data

- 2 mock banks (Mock Bank Germany, Test Bank Germany)
- 2 mock accounts per consent (ACC001, ACC002)
- 10 sample transactions per account
