# YAPPMA Reload

**Y**et **A**nother **P**ersonal **P**ortfolio **M**anagement **A**pp - Reloaded with modern tech stack.

A comprehensive personal wealth management application built with Elixir/Phoenix (backend) and React/TypeScript (frontend).

## Features

- 📊 **Portfolio Management**: Track accounts, assets, and their values over time
- 💰 **Net Worth Calculation**: Automated calculation and historical tracking
- 🏦 **PSD2 Bank Integration**: Connect your bank accounts via Styx for automatic synchronization
- 📈 **Asset Types**: Support for securities, insurance, real estate, loans, and more
- 📅 **Historical Snapshots**: Track your wealth evolution over time
- 🔒 **Type-Safe**: Fully typed backend (Elixir) and frontend (TypeScript)

## Tech Stack

### Backend
- **Elixir 1.17** + **Phoenix 1.7**
- **PostgreSQL** for data storage
- **Ecto** for database queries and migrations
- **Styx** integration for PSD2 bank connections

### Frontend
- **React 18** + **TypeScript**
- **Vite** for fast builds
- **TanStack Query** for data fetching and caching
- **Tailwind CSS** + **shadcn/ui** for styling
- **React Router** for navigation

## Quick Start

### Prerequisites

- **Elixir 1.17+** and **Erlang/OTP 27+**
- **Node.js 18+** and **npm**
- **PostgreSQL 14+**
- **(Optional) Styx** for PSD2 bank integration

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/solaar45/yappma-reload.git
cd yappma-reload
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies
mix deps.get

# Setup database (create, migrate, seed)
mix ecto.setup

# Start Phoenix server
mix phx.server
```

The backend will be available at **http://localhost:4000**

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at **http://localhost:5173**

### Database Management

```bash
# Create database
mix ecto.create

# Run migrations
mix ecto.migrate

# Seed with demo data
mix run priv/repo/seeds.exs

# Reset database (drop, create, migrate, seed)
mix ecto.reset

# Rollback last migration
mix ecto.rollback
```

## Project Structure

```
yappma-reload/
├── backend/
│   ├── lib/
│   │   ├── wealth_backend/
│   │   │   ├── accounts/           # User accounts and institutions
│   │   │   ├── portfolio/          # Assets and asset types
│   │   │   ├── analytics/          # Snapshots and calculations
│   │   │   ├── bank_connections/   # PSD2 integration (Styx)
│   │   │   └── repo.ex
│   │   ├── wealth_backend_web/
│   │   │   ├── controllers/
│   │   │   ├── views/
│   │   │   └── router.ex
│   │   └── yappma.ex
│   ├── priv/
│   │   └── repo/
│   │       ├── migrations/
│   │       └── seeds.exs
│   └── mix.exs
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ui/                 # shadcn/ui components
    │   │   └── bank-connections/   # PSD2 UI components
    │   ├── lib/
    │   │   └── api/                # API client and hooks
    │   ├── pages/                  # Route pages
    │   ├── contexts/               # React contexts
    │   └── App.tsx
    └── package.json
```

## API Documentation

### Core Endpoints

#### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create a new user

#### Accounts
- `GET /api/accounts?user_id={id}` - List user's accounts
- `POST /api/accounts` - Create a new account
- `PUT /api/accounts/{id}` - Update an account
- `DELETE /api/accounts/{id}` - Delete an account

#### Assets
- `GET /api/assets?user_id={id}` - List user's assets
- `POST /api/assets` - Create a new asset
- `PUT /api/assets/{id}` - Update an asset

#### Institutions
- `GET /api/institutions?user_id={id}` - List user's institutions
- `POST /api/institutions` - Create a new institution

#### Analytics
- `GET /api/dashboard/net_worth?user_id={id}` - Get current net worth
- `GET /api/dashboard/account_snapshots?user_id={id}` - Get account snapshots
- `GET /api/dashboard/asset_snapshots?user_id={id}` - Get asset snapshots

#### Bank Connections (PSD2)
- `GET /api/bank-connections/banks` - List available banks
- `GET /api/bank-connections/consents` - List user's consents
- `POST /api/bank-connections/consents` - Create new bank consent
- `POST /api/bank-connections/consents/{id}/sync` - Sync accounts
- `DELETE /api/bank-connections/consents/{id}` - Revoke consent

## PSD2 Bank Integration

YAPPMA integrates with [Styx](https://github.com/railslove/styx) for PSD2 bank connections.

### Setup Styx (Optional)

```bash
# Clone Styx
git clone https://github.com/railslove/styx.git
cd styx

# Follow Styx installation instructions
# ...

# Start Styx
mix phx.server
```

### Configure Backend

Add to `backend/config/dev.exs`:

```elixir
config :yappma, :styx,
  base_url: "http://localhost:4001",
  client_id: "your_client_id",
  client_secret: "your_client_secret"
```

## Development

### Running Tests

```bash
# Backend tests
cd backend
mix test

# Frontend tests
cd frontend
npm test
```

### Code Quality

```bash
# Backend - Format code
mix format

# Backend - Run linter
mix credo

# Frontend - Lint
npm run lint

# Frontend - Type check
npm run type-check
```

## Production Deployment

### Backend

```bash
cd backend

# Build release
MIX_ENV=prod mix release

# Run release
_build/prod/rel/yappma/bin/yappma start
```

### Frontend

```bash
cd frontend

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

### Backend (`backend/config/runtime.exs`)

```bash
DATABASE_URL=postgresql://user:pass@localhost/yappma_prod
SECRET_KEY_BASE=your_secret_key
PORT=4000

# Styx Configuration
STYX_BASE_URL=https://styx.example.com
STYX_CLIENT_ID=your_client_id
STYX_CLIENT_SECRET=your_client_secret
```

### Frontend (`.env`)

```bash
VITE_API_BASE_URL=http://localhost:4000/api
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review API documentation

---

Made with ❤️ using Elixir and React
