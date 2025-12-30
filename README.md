# YAPPMA Reloaded

Backend für den Wealth Tracker "Yet Another Personal Project for Money Analysis".

## Tech Stack
- **Framework:** Elixir / Phoenix (JSON API)
- **Database:** PostgreSQL
- **Architecture:** Context-based (Accounts, Portfolio, Analytics)

## Setup

1. Database start:
   ```bash
   docker-compose up -d
   ```

2. Setup dependencies and database:
   ```bash
   mix setup
   ```

3. Start server:
   ```bash
   mix phx.server
   ```
