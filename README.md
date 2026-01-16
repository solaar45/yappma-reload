# YAPPMA Reloaded

**Y**et **A**nother **P**ersonal **P**roject for **M**oney **A**nalysis - A comprehensive wealth tracking and portfolio management application.

## Tech Stack

### Backend
- **Framework:** Elixir / Phoenix (JSON API)
- **Database:** PostgreSQL
- **Architecture:** Context-based (Accounts, Portfolio, Analytics)
- **API Integration:** Alpha Vantage for security metadata

### Frontend  
- **Framework:** React + TypeScript
- **Build Tool:** Vite
- **UI Library:** shadcn/ui + Tailwind CSS
- **State Management:** React Query

## Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your secrets (optional: Alpha Vantage API key)
nano .env

# Load environment variables
source .env
```

**See [ENV_SETUP.md](./ENV_SETUP.md) for detailed configuration guide.**

### 2. Database Setup

```bash
# Start PostgreSQL
docker-compose up -d

# Create and migrate database
cd backend
mix setup
```

### 3. Start Backend

```bash
cd backend
mix phx.server
```

Backend runs at: http://localhost:4000

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

## Features

- ✅ **Multi-Account Management** - Track bank accounts, securities, and assets
- ✅ **Portfolio Tracking** - Monitor investments and performance
- ✅ **Institution Management** - Organize accounts by financial institutions
- ✅ **Security Metadata Enrichment** - Auto-fill stock/ETF data via Alpha Vantage
- ✅ **Account Snapshots** - Track balance history over time
- ✅ **RESTful API** - JSON API for all operations
- ✅ **Authentication** - Session-based user management

### Coming Soon

- ⏳ **FinTS Integration** - Automatic bank data import (PSD2)
- ⏳ **Analytics Dashboard** - Performance metrics and charts
- ⏳ **Transaction Tracking** - Detailed transaction history
- ⏳ **Multi-Currency Support** - Currency conversion and tracking

## Project Structure

```
yappma-reload/
├── .env.example              # Environment variable template
├── .env                      # Your local secrets (not committed)
├── ENV_SETUP.md              # Environment setup guide
├── docker-compose.yml        # PostgreSQL container
├── backend/                  # Phoenix API
│   ├── lib/
│   │   ├── wealth_backend/       # Business logic contexts
│   │   └── wealth_backend_web/   # Controllers, views, router
│   ├── priv/repo/migrations/ # Database migrations
│   ├── test/                 # Test suite
│   ├── config/               # Configuration files
│   └── API_REFERENCE.md      # API documentation
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── lib/              # API client, utilities
│   │   └── types/            # TypeScript definitions
│   └── public/               # Static assets
└── fints-worker/             # FinTS integration (Python)
```

## Documentation

- [Environment Setup Guide](./ENV_SETUP.md) - Configuration and environment variables
- [API Reference](./backend/API_REFERENCE.md) - REST API endpoints
- [Backend Documentation](./backend/BACKEND_DOCUMENTATION.md) - Architecture and design
- [Alpha Vantage Setup](./backend/ALPHA_VANTAGE_SETUP.md) - Security enrichment API
- [Security Enrichment](./backend/SECURITY_ENRICHMENT.md) - Metadata enrichment feature
- [REST API Guide](./backend/REST_API.md) - HTTP API documentation

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
# Backend formatter
cd backend
mix format

# Frontend linter
cd frontend
npm run lint
```

### Database Migrations

```bash
cd backend

# Create migration
mix ecto.gen.migration add_something

# Run migrations
mix ecto.migrate

# Rollback
mix ecto.rollback
```

## API Overview

The backend provides a JSON API for all operations:

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login user
- `DELETE /api/auth/logout` - Logout user

### Institutions
- `GET /api/institutions` - List all institutions
- `POST /api/institutions` - Create institution
- `PATCH /api/institutions/:id` - Update institution
- `DELETE /api/institutions/:id` - Delete institution

### Accounts
- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create account
- `PATCH /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Securities
- `POST /api/securities/enrich` - Enrich security metadata

See [API_REFERENCE.md](./backend/API_REFERENCE.md) for complete documentation.

## Contributing

This is a personal project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and not licensed for public use.

## Support

For issues or questions:
- Check the [documentation](./ENV_SETUP.md)
- Review [existing issues](https://github.com/solaar45/yappma-reload/issues)
- Open a new issue with details and logs
