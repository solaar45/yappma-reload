# ============================================
# Build Stage
# ============================================
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build args for environment variables
ARG VITE_API_BASE_URL=/api
ARG VITE_LOGOKIT_TOKEN
ARG VITE_LOGO_DEV_TOKEN

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_LOGOKIT_TOKEN=${VITE_LOGOKIT_TOKEN}
ENV VITE_LOGO_DEV_TOKEN=${VITE_LOGO_DEV_TOKEN}

# Build application
RUN npm run build

# ============================================
# Runtime Stage - Nginx
# ============================================
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1000 app && \
    adduser -D -u 1000 -G app app && \
    chown -R app:app /usr/share/nginx/html && \
    chown -R app:app /var/cache/nginx && \
    chown -R app:app /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R app:app /var/run/nginx.pid

# Switch to non-root user
USER app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
