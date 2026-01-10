# Environment Configuration Guide

## Overview

YAPPMA Reload uses a **centralized environment configuration** approach. All environment variables for both frontend and backend are managed from the root directory.

## Quick Start

```bash
# 1. Copy the example file
cp .env.example .env

# 2. Edit .env and add your secrets
nano .env  # or use your preferred editor

# 3. Source the environment (if needed)
source .env

# 4. Start the applications
cd backend && mix phx.server &
cd frontend && npm run dev
```

## File Structure

```
yappma-reload/
├── .env.example          # Template with all variables (safe to commit)
├── .env                  # Your local secrets (NEVER commit)
├── .gitignore            # Protects .env from being committed
├── frontend/
│   └── .gitignore        # Also ignores .env files
└── backend/
    └── config/
        └── dev.exs       # Reads from environment variables
```

## Environment Variables

### Frontend (Vite/React)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE_URL` | Backend API URL | `/api` | Yes |
| `VITE_LOGOKIT_TOKEN` | LogoKit API token | Provided | No |
| `VITE_LOGO_DEV_TOKEN` | LogoKit dev token | Provided | No |

**Note:** Vite requires `VITE_` prefix for variables to be exposed to the browser.

### Backend (Phoenix/Elixir)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ALPHA_VANTAGE_API_KEY` | API key for security metadata | - | No* |
| `DB_USERNAME` | PostgreSQL username | `postgres` | Yes |
| `DB_PASSWORD` | PostgreSQL password | `postgres` | Yes |
| `DB_HOSTNAME` | Database host | `localhost` | Yes |
| `DB_DATABASE` | Database name | `wealth_backend_dev` | Yes |
| `SECRET_KEY_BASE` | Phoenix secret key | Generated | Yes |
| `PHOENIX_HOST` | Server host | `localhost` | No |
| `PHOENIX_PORT` | Server port | `4000` | No |
| `LOG_LEVEL` | Logging level | `info` | No |
| `ENRICHER_TIMEOUT` | API timeout (ms) | `10000` | No |

\* Optional but recommended for full functionality. Demo mode available without key.

## How Environment Variables are Loaded

### Frontend (Vite)

Vite automatically loads `.env` files in this order:

1. `.env` - Loaded in all environments
2. `.env.local` - Loaded in all environments, ignored by git
3. `.env.[mode]` - Only loaded in specified mode (e.g., `.env.development`)
4. `.env.[mode].local` - Only loaded in specified mode, ignored by git

**Location:** Vite looks for `.env` files in the **project root** (where `vite.config.ts` is).

**Our setup:** All variables are in root `.env`, which frontend's Vite config reads automatically.

### Backend (Phoenix/Elixir)

Elixir reads environment variables from:

1. **System environment** - Set via `export` or shell config
2. **Config files** - `config/dev.exs` uses `System.get_env("VAR_NAME")`
3. **Runtime** - Can be loaded at application startup

**Our setup:** Variables are loaded from system environment (shell), which you set by sourcing `.env`.

## Setting Up Environment Variables

### Method 1: Source the .env file (Recommended for Development)

```bash
# Load variables into your shell
source .env

# Verify variables are loaded
echo $ALPHA_VANTAGE_API_KEY
echo $VITE_API_BASE_URL

# Start backend (will use environment variables)
cd backend
mix phx.server

# In another terminal, start frontend (Vite loads .env automatically)
cd frontend
npm run dev
```

### Method 2: Use direnv (Automatic loading)

**Install direnv:**
```bash
# macOS
brew install direnv

# Ubuntu/Debian
sudo apt install direnv

# Add to your shell (~/.bashrc or ~/.zshrc)
eval "$(direnv hook bash)"  # or zsh
```

**Setup:**
```bash
# Create .envrc in project root
cat > .envrc << 'EOF'
dotenv
EOF

# Allow direnv to load .env
direnv allow

# Now variables auto-load when you cd into the project!
```

### Method 3: Shell Configuration (Persistent)

**For development that survives terminal restarts:**

```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'export ALPHA_VANTAGE_API_KEY="your_key_here"' >> ~/.bashrc
source ~/.bashrc
```

## Common Issues & Solutions

### Frontend can't access environment variables

**Problem:** `import.meta.env.VITE_API_BASE_URL` is undefined

**Solution:**
1. Ensure variable name starts with `VITE_`
2. Restart Vite dev server after changing `.env`
3. Check `.env` is in the **root directory** (not `frontend/`)

```bash
# Correct location
yappma-reload/.env  ✅

# Wrong location
yappma-reload/frontend/.env  ❌
```

### Backend can't access environment variables

**Problem:** `System.get_env("ALPHA_VANTAGE_API_KEY")` returns nil

**Solution:**
1. Source `.env` before starting backend
   ```bash
   source .env
   mix phx.server
   ```

2. Or set in current terminal:
   ```bash
   export ALPHA_VANTAGE_API_KEY="your_key"
   mix phx.server
   ```

3. Or use environment prefix:
   ```bash
   ALPHA_VANTAGE_API_KEY="your_key" mix phx.server
   ```

### .env not loading automatically

**Problem:** Have to manually source `.env` every time

**Solution:** Use direnv (see Method 2 above) or add to shell config (Method 3)

### Git wants to commit .env

**Problem:** `.env` shows up in `git status`

**Solution:**
```bash
# Verify .gitignore includes .env
grep ".env" .gitignore

# If not, add it
echo ".env" >> .gitignore

# If already tracked, remove from git (keeps local file)
git rm --cached .env
git commit -m "Stop tracking .env"
```

## Security Best Practices

### ✅ DO

- ✅ Keep secrets in `.env` (never in code)
- ✅ Add `.env` to `.gitignore`
- ✅ Use `.env.example` as documentation
- ✅ Rotate secrets regularly
- ✅ Use different secrets for dev/staging/production
- ✅ Use a password manager for team secret sharing

### ❌ DON'T

- ❌ Commit `.env` to version control
- ❌ Share secrets via Slack/Email/SMS
- ❌ Use production secrets in development
- ❌ Put secrets in frontend code (visible to users!)
- ❌ Use weak or default passwords

## Production Deployment

### Environment Variables in Production

**For production, DON'T use `.env` files!** Instead:

#### Render.com / Railway / Heroku
```bash
# Set via dashboard or CLI
render env:set ALPHA_VANTAGE_API_KEY=xxx
railway variables:set ALPHA_VANTAGE_API_KEY=xxx
heroku config:set ALPHA_VANTAGE_API_KEY=xxx
```

#### Docker
```bash
# Pass via docker run
docker run -e ALPHA_VANTAGE_API_KEY=xxx ...

# Or use docker-compose with env_file
services:
  backend:
    env_file:
      - .env.production  # Different file, not committed
```

#### systemd (Linux server)
```bash
# In /etc/systemd/system/yappma.service
[Service]
Environment="ALPHA_VANTAGE_API_KEY=xxx"
EnvironmentFile=/etc/yappma/.env  # Secure location
```

## Migrating from Old Setup

If you had frontend-specific `.env` files:

```bash
# Old structure (removed)
frontend/.env.example
frontend/.env.development  
frontend/.env.production

# New structure (current)
.env.example              # Template
.env                      # Your secrets (not committed)
```

**Migration steps:**
1. Copy `.env.example` to `.env`
2. Transfer any custom values from old files
3. Delete old `frontend/.env.*` files
4. Source new `.env` and test

## Testing Your Setup

### Verify Frontend Variables

```bash
cd frontend
npm run dev

# In browser console:
console.log(import.meta.env.VITE_API_BASE_URL)  // Should print: /api
```

### Verify Backend Variables

```bash
source .env
cd backend
iex -S mix

# In IEx console:
System.get_env("ALPHA_VANTAGE_API_KEY")  # Should print your key or nil
```

### End-to-End Test

```bash
# Start both services
source .env
cd backend && mix phx.server &
cd ../frontend && npm run dev &

# Test API call
curl http://localhost:4000/api/securities/enrich \
  -H "Content-Type: application/json" \
  -d '{"identifier": "AAPL"}'

# Should return security data
```

## Additional Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Phoenix Configuration](https://hexdocs.pm/phoenix/config.html)
- [The Twelve-Factor App - Config](https://12factor.net/config)
- [direnv Documentation](https://direnv.net/)
- [Alpha Vantage Setup Guide](./backend/ALPHA_VANTAGE_SETUP.md)

## Need Help?

If environment variables aren't working:

1. Check this guide's "Common Issues" section
2. Verify `.env` file location and syntax
3. Restart your terminal/IDE/servers
4. Check logs for "not found" or "nil" errors
5. Open a GitHub issue with error details
