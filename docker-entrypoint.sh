#!/bin/bash
set -e

echo "========================================"
echo "YAPPMA Reload - Starting..."
echo "========================================"

# Parse DB_HOSTNAME to extract host and port
DB_HOST="${DB_HOSTNAME:-postgres}"
DB_PORT="5432"

# If DB_HOSTNAME contains a port (e.g., "192.168.0.161:5439")
if [[ $DB_HOST == *":"* ]]; then
  DB_PORT="${DB_HOST##*:}"
  DB_HOST="${DB_HOST%:*}"
fi

DB_USER="${DB_USERNAME:-postgres}"
DB_NAME="${DB_DATABASE:-wealth_backend_prod}"

echo "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Wait for PostgreSQL to be ready (max 10 seconds)
echo "Waiting for database..."
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -q; then
    echo "✅ PostgreSQL is ready!"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Waiting for database... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 1
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "⚠ Warning: Could not verify backend connectivity, continuing anyway..."
fi

# Create database if it doesn't exist
echo "Checking if database exists..."
if ! PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo "📦 Database '$DB_NAME' does not exist, creating..."
  PGPASSWORD="${DB_PASSWORD}" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
  echo "✅ Database created!"
else
  echo "✅ Database '$DB_NAME' already exists"
fi

# Run database migrations
echo "Running database migrations..."
cd /app/backend
if bin/wealth_backend eval "WealthBackend.Release.migrate()"; then
  echo "✅ Migrations complete!"
else
  echo "⚠ Warning: Migrations failed or not needed"
fi

# Generate runtime configuration for frontend
echo "Generating runtime configuration..."
cat <<EOF > /app/frontend/config.js
window.APP_CONFIG = {
  "VITE_API_BASE_URL": "${VITE_API_BASE_URL:-/api}",
  "VITE_LOGOKIT_TOKEN": "${VITE_LOGOKIT_TOKEN:-}",
  "VITE_LOGO_DEV_TOKEN": "${VITE_LOGO_DEV_TOKEN:-}"
};
EOF
echo "✅ Runtime configuration generated with following vars: $(echo "VITE_API_BASE_URL VITE_LOGOKIT_TOKEN VITE_LOGO_DEV_TOKEN" | xargs -n1 | grep -v '^$' | paste -sd,)"

echo "========================================"
echo "Starting services..."
echo "  Backend API: http://localhost:4000"
echo "  Frontend UI: http://localhost:8080"
echo "========================================"

# Start supervisord (manages backend + nginx)
exec /usr/bin/supervisord -c /etc/supervisord.conf
