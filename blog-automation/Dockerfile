# ============================================
# Blog Automation System — Dockerfile
# ============================================
#
# Multi-stage build for minimal production image.
#
# Build:
#   docker build -t blog-automation .
#
# Run:
#   docker run --env-file .env blog-automation
#
# ============================================

# ── Stage 1: Build ───────────────────────────────────────────────────

FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first (Docker layer caching)
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy Prisma schema and generate the client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source and build
COPY tsconfig.json ./
COPY src ./src/

RUN npm run build

# ── Stage 2: Production ─────────────────────────────────────────────

FROM node:20-alpine AS production

# Add labels
LABEL maintainer="umesh-malik"
LABEL description="Automated blog posting system powered by Claude AI"

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy Prisma schema and generated client from builder
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma/

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist/

# Copy runtime config files
COPY ecosystem.config.js ./

# Create logs directory with correct permissions
RUN mkdir -p logs && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose health check port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Default command: run the scheduler daemon
CMD ["node", "dist/index.js"]
