# YAPPMA Reloaded

**Y**et **A**nother **P**ersonal **P**roject for **M**oney **A**nalysis - A comprehensive wealth tracking and portfolio management application.

## Tech Stack

### Backend
- **Framework:** Elixir / Phoenix (JSON API)
- **Database:** PostgreSQL
- **Architecture:** Context-based (Accounts, Portfolio, Analytics)
- **API Integration:** Financial Modeling Prep for security metadata

### Frontend  
- **Framework:** React + TypeScript
- **Build Tool:** Vite
- **UI Library:** shadcn/ui + Tailwind CSS
- **State Management:** React Query

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/solaar45/yappma-reload.git
cd yappma-reload

# 2. Configure environment
cp .env.example .env
nano .env  # Add your secrets

# 3. Start all services
docker-compose up -d
```

**That's it!** 🎉

- Backend automatically creates database and runs migrations
- Frontend builds and serves on port 8080
- PostgreSQL ready on port 5432

**Access:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:4000
- Admin Panel: http://localhost:8080/admin (requires admin role)

**See [DOCKER_DEPLOYMENT.md](./docs/DOCKER_DEPLOYMENT.md) for details on automatic migrations.**

### Option 2: Local Development

#### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your secrets
nano .env

# Load environment variables
source .env
```

**See [ENV_SETUP.md](./ENV_SETUP.md) for detailed configuration guide.**

#### 2. Database Setup

```bash
# Start PostgreSQL (if using Docker)
docker-compose up -d postgres

# Create and migrate database (AUTOMATIC)
cd backend
mix setup  # Runs: ecto.create + ecto.migrate + seeds
```

#### 3. Start Backend

```bash
cd backend
mix phx.server
```

Backend runs at: http://localhost:4000

#### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

## Features

### ✅ Core Features
- **Multi-Account Management** - Track bank accounts, securities, and assets
- **Portfolio Tracking** - Monitor investments and performance
- **Institution Management** - Organize accounts by financial institutions
- **Security Metadata Enrichment** - Auto-fill stock/ETF data via FMP API
- **Account Snapshots** - Track balance history over time
- **RESTful API** - JSON API for all operations
- **Authentication** - Session-based user management

### ✅ Multi-User Admin System (NEW)
- **User Management** - Create, edit, deactivate, delete users
- **Role-Based Access Control** - User, Admin, Super Admin, Read-Only
- **Admin Dashboard** - System statistics and user overview
- **Password Management** - Reset passwords, enforce changes
- **Audit Logging** - Full history of admin actions
- **GDPR Compliance** - Complete audit trail

**See [MULTI_USER_ADMIN.md](./docs/MULTI_USER_ADMIN.md) for details.**

### ⏳ Coming Soon
- **FinTS Integration** - Automatic bank data import (PSD2)
- **Analytics Dashboard** - Performance metrics and charts
- **Transaction Tracking** - Detailed transaction history
- **Multi-Currency Support** - Currency conversion and tracking

## Project Structure

```
yappma-reload/
├── .env.example              # Environment variable template
├── .env                      # Your local secrets (not committed)
├── docker-compose.yml        # Production deployment
├── docs/                     # Documentation
│   ├── MULTI_USER_ADMIN.md   # Admin system API docs
│   ├── MULTI_USER_IMPLEMENTATION.md  # Implementation details
│   └── DOCKER_DEPLOYMENT.md  # Docker & auto-migrations
├── backend/                  # Phoenix API
│   ├── lib/
│   │   ├── wealth_backend/       # Business logic contexts
│   │   └── wealth_backend_web/   # Controllers, views, router
│   ├── priv/repo/migrations/ # Database migrations (AUTO-RUN in Docker)
│   ├── test/                 # Test suite
│   ├── config/               # Configuration files
│   ├── Dockerfile            # Backend container with auto-migrations
│   ├── docker-entrypoint.sh  # Migration runner
│   └── API_REFERENCE.md      # API documentation
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components + Admin panel
│   │   ├── lib/              # API client, utilities
│   │   └── types/            # TypeScript definitions
│   ├── Dockerfile            # Frontend container
│   └── public/               # Static assets
└── fints-worker/             # FinTS integration (Python)
```

## Documentation

### Setup & Configuration
- [Environment Setup Guide](./ENV_SETUP.md) - Configuration and environment variables
- [Docker Deployment Guide](./docs/DOCKER_DEPLOYMENT.md) - Docker setup with auto-migrations
- [Backend Setup](./backend/SETUP.md) - Local backend setup

### API & Architecture
- [API Reference](./backend/API_REFERENCE.md) - REST API endpoints
- [Backend Documentation](./backend/BACKEND_DOCUMENTATION.md) - Architecture and design
- [REST API Guide](./backend/REST_API.md) - HTTP API documentation

### Features
- [Multi-User Admin System](./docs/MULTI_USER_ADMIN.md) - Admin API documentation
- [Multi-User Implementation](./docs/MULTI_USER_IMPLEMENTATION.md) - Implementation details
- [Security Enrichment](./backend/SECURITY_ENRICHMENT.md) - Metadata enrichment feature
- [FMP API Setup](./backend/ALPHA_VANTAGE_SETUP.md) - Financial API configuration

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

# Run migrations (local)
mix ecto.migrate

# Rollback
mix ecto.rollback

# Docker: Automatic on container start!
# See docs/DOCKER_DEPLOYMENT.md
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

### Admin (NEW)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PATCH /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/:id/reset-password` - Reset password
- `GET /api/admin/dashboard/stats` - System statistics

See [API_REFERENCE.md](./backend/API_REFERENCE.md) and [MULTI_USER_ADMIN.md](./docs/MULTI_USER_ADMIN.md) for complete documentation.

## Deployment

### Docker Compose (Production)

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Update to new version
git pull
docker-compose up -d --build  # Migrations run automatically!
```

### Kubernetes (Advanced)

```yaml
# See docs/DOCKER_DEPLOYMENT.md for K8s examples
# Includes automatic migrations via init containers
```

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
- Check the [documentation](./docs/)
- Review [existing issues](https://github.com/solaar45/yappma-reload/issues)
- Open a new issue with details and logs
