# ============================================
# YAPPMA Reload - Single Container
# Backend (Phoenix) + Frontend (React)
# ============================================

# ============================================
# Stage 1: Build Backend
# ============================================
FROM hexpm/elixir:1.16.0-erlang-26.2.1-alpine-3.18.4 AS backend-build

# Install build dependencies
RUN apk add --no-cache build-base git

# Set build environment
ENV MIX_ENV=prod

# Create app directory
WORKDIR /app

# Install hex and rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# Copy backend files
COPY backend/mix.exs backend/mix.lock ./
RUN mix deps.get --only prod && mix deps.compile

COPY backend/config config
COPY backend/lib lib
COPY backend/priv priv

# Compile and build release
RUN mix compile && \
    mix phx.digest && \
    mix release

# ============================================
# Stage 2: Build Frontend
# ============================================
FROM node:20-alpine AS frontend-build

WORKDIR /app

# Copy frontend files
COPY frontend/package.json frontend/package-lock.json ./

# Install ALL dependencies (including devDependencies for build tools)
RUN npm ci

COPY frontend/ .

# Build args for environment variables
ARG VITE_API_BASE_URL=/api
ARG VITE_LOGOKIT_TOKEN
ARG VITE_LOGO_DEV_TOKEN

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_LOGOKIT_TOKEN=${VITE_LOGOKIT_TOKEN}
ENV VITE_LOGO_DEV_TOKEN=${VITE_LOGO_DEV_TOKEN}

# Build frontend
RUN npm run build

# ============================================
# Stage 3: Runtime - Combined Container
# ============================================
FROM alpine:3.18.4

# Install runtime dependencies (including postgresql-client for auto-DB creation)
RUN apk add --no-cache \
    bash \
    openssl \
    ncurses-libs \
    libstdc++ \
    libgcc \
    nginx \
    supervisor \
    curl \
    postgresql-client

# Create app user
RUN addgroup -g 1000 app && \
    adduser -D -u 1000 -G app app

# Create necessary directories
RUN mkdir -p /app/backend /app/frontend /var/log/supervisor /var/log/nginx /var/lib/nginx/tmp && \
    chown -R app:app /app /var/log/supervisor /var/log/nginx /var/lib/nginx

# Copy backend from build stage
COPY --from=backend-build --chown=app:app /app/_build/prod/rel/wealth_backend /app/backend

# Copy frontend from build stage
COPY --from=frontend-build --chown=app:app /app/dist /app/frontend

# Copy nginx configuration
COPY --chown=app:app nginx-combined.conf /etc/nginx/nginx.conf

# Copy supervisor configuration
COPY --chown=app:app supervisord.conf /etc/supervisord.conf

# Copy startup script
COPY --chown=app:app docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to app user
USER app

# Expose ports
EXPOSE 8080 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Set environment
ENV HOME=/app
ENV MIX_ENV=prod
ENV PORT=4000

# Start supervisor
CMD ["/usr/local/bin/docker-entrypoint.sh"]
