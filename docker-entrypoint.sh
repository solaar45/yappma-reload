#!/bin/bash
set -e

echo "========================================"
echo "YAPPMA Reload - Starting..."
echo "========================================"

# Wait for database to be ready
echo "Waiting for database..."
max_retries=30
retry=0

while [ $retry -lt $max_retries ]; do
    if /app/backend/bin/wealth_backend rpc "1 + 1" &>/dev/null; then
        echo "✓ Backend connection test passed"
        break
    fi
    retry=$((retry + 1))
    echo "Waiting for database... ($retry/$max_retries)"
    sleep 2
done

if [ $retry -eq $max_retries ]; then
    echo "⚠ Warning: Could not verify backend connectivity, continuing anyway..."
fi

# Run database migrations
echo "Running database migrations..."
if /app/backend/bin/wealth_backend eval "WealthBackend.Release.migrate" 2>/dev/null; then
    echo "✓ Migrations completed"
else
    echo "⚠ Warning: Migrations failed or not needed"
fi

# Create necessary directories
mkdir -p /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp

echo "========================================"
echo "Starting services..."
echo "  Backend API: http://localhost:4000"
echo "  Frontend UI: http://localhost:8080"
echo "========================================"

# Start supervisord
exec /usr/bin/supervisord -c /etc/supervisord.conf
