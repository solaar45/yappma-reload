# ============================================
# Build Stage
# ============================================
FROM hexpm/elixir:1.16.0-erlang-26.2.1-alpine-3.18.4 AS build

# Install build dependencies
RUN apk add --no-cache \
    build-base \
    git \
    nodejs \
    npm

# Set build environment
ENV MIX_ENV=prod

# Create app directory
WORKDIR /app

# Install hex and rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# Copy mix files
COPY mix.exs mix.lock ./

# Install dependencies
RUN mix deps.get --only prod && \
    mix deps.compile

# Copy application files
COPY config config
COPY lib lib
COPY priv priv

# Compile the application
RUN mix compile

# Build assets if needed
RUN mix phx.digest

# Build release
RUN mix release

# ============================================
# Runtime Stage
# ============================================
FROM alpine:3.18.4

# Install runtime dependencies
RUN apk add --no-cache \
    bash \
    openssl \
    ncurses-libs \
    libstdc++ \
    libgcc \
    postgresql-client

# Create non-root user
RUN addgroup -g 1000 app && \
    adduser -D -u 1000 -G app app

# Set working directory
WORKDIR /app

# Copy release from build stage
COPY --from=build --chown=app:app /app/_build/prod/rel/wealth_backend ./

# Copy entrypoint script
COPY --chown=app:app docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Switch to non-root user
USER app

# Expose port
EXPOSE 4000

# Set environment
ENV HOME=/app
ENV MIX_ENV=prod

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD ["bin/wealth_backend", "rpc", "1 + 1"]

# Use entrypoint script for automatic migrations
ENTRYPOINT ["/app/docker-entrypoint.sh"]
