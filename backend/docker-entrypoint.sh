#!/bin/bash
set -e

echo "🚀 Starting YAPPMA Backend..."

# Wait for Postgres to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
while ! pg_isready -h "${DB_HOSTNAME:-postgres}" -U "${DB_USERNAME:-postgres}" -q; do
  sleep 1
done
echo "✅ PostgreSQL is ready!"

# Run database migrations
echo "🔄 Running database migrations..."
bin/wealth_backend eval "WealthBackend.Release.migrate()"
echo "✅ Migrations complete!"

# Start the application
echo "🎯 Starting application..."
exec bin/wealth_backend start
