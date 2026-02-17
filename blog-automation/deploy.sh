#!/usr/bin/env bash
# ============================================
# Blog Automation System — Production Deployment
# ============================================
#
# Deploys the blog automation system with:
#   1. Pre-flight checks (env, dependencies)
#   2. Git pull (optional)
#   3. Dependency install
#   4. TypeScript build
#   5. Database migrations
#   6. PM2 restart with zero-downtime
#   7. Health check verification
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh                    # Standard deploy
#   ./deploy.sh --skip-pull        # Skip git pull
#   ./deploy.sh --docker           # Deploy with Docker
#
# ============================================

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────

APP_NAME="blog-automation"
HEALTH_PORT="${HEALTH_CHECK_PORT:-3000}"
HEALTH_URL="http://localhost:${HEALTH_PORT}/health"
MAX_HEALTH_RETRIES=10
HEALTH_RETRY_DELAY=5
SKIP_PULL=false
USE_DOCKER=false

# ── Colours ──────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Helpers ──────────────────────────────────────────────────────────

step()    { echo -e "\n${CYAN}[$1/${TOTAL_STEPS}]${NC} ${BLUE}$2${NC}"; }
info()    { echo -e "    ${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "    ${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "    ${YELLOW}[WARN]${NC}  $1"; }
fail()    { echo -e "    ${RED}[FAIL]${NC}  $1"; exit 1; }

# ── Parse Arguments ──────────────────────────────────────────────────

for arg in "$@"; do
  case $arg in
    --skip-pull) SKIP_PULL=true ;;
    --docker)    USE_DOCKER=true ;;
    --help)
      echo "Usage: ./deploy.sh [options]"
      echo "  --skip-pull   Skip git pull"
      echo "  --docker      Deploy with Docker Compose"
      echo "  --help        Show this message"
      exit 0 ;;
    *) warn "Unknown argument: $arg" ;;
  esac
done

# ── Banner ───────────────────────────────────────────────────────────

echo ""
echo "============================================"
echo "  Blog Automation — Production Deployment"
echo "============================================"
echo ""
echo "  Timestamp: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "  Mode:      $([ "$USE_DOCKER" = true ] && echo 'Docker' || echo 'PM2')"
echo ""

# =====================================================================
# Docker Deployment
# =====================================================================

if [ "$USE_DOCKER" = true ]; then
  TOTAL_STEPS=5

  step 1 "Pre-flight checks"
  if ! command -v docker &> /dev/null; then fail "Docker is not installed"; fi
  if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    fail "Docker Compose is not installed"
  fi
  if [ ! -f .env ]; then fail ".env file not found — copy from .env.example"; fi
  success "Prerequisites verified"

  step 2 "Pulling latest code"
  if [ "$SKIP_PULL" = false ]; then
    git pull --ff-only origin main || warn "Git pull failed — using current code"
  else
    info "Skipping git pull (--skip-pull)"
  fi

  step 3 "Building Docker images"
  docker compose build --no-cache app
  success "Docker images built"

  step 4 "Running migrations and starting services"
  docker compose up -d postgres
  info "Waiting for PostgreSQL to be healthy..."
  sleep 5
  docker compose run --rm migrate
  success "Migrations complete"

  docker compose up -d app
  success "Application started"

  step 5 "Health check verification"
  RETRIES=0
  while [ $RETRIES -lt $MAX_HEALTH_RETRIES ]; do
    if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
      success "Health check passed"
      echo ""
      echo "============================================"
      echo "  Deployment Complete!"
      echo "============================================"
      echo ""
      echo "  Health: $HEALTH_URL"
      echo "  Status: http://localhost:${HEALTH_PORT}/status"
      echo "  Logs:   docker compose logs -f app"
      echo ""
      exit 0
    fi
    RETRIES=$((RETRIES + 1))
    info "Waiting for health check... (${RETRIES}/${MAX_HEALTH_RETRIES})"
    sleep $HEALTH_RETRY_DELAY
  done

  fail "Health check failed after ${MAX_HEALTH_RETRIES} attempts"
fi

# =====================================================================
# PM2 Deployment (default)
# =====================================================================

TOTAL_STEPS=7

# ── Step 1: Pre-flight Checks ───────────────────────────────────────

step 1 "Pre-flight checks"

if ! command -v node &> /dev/null; then fail "Node.js is not installed"; fi
if ! command -v npm &> /dev/null; then fail "npm is not installed"; fi
if ! command -v pm2 &> /dev/null; then
  warn "PM2 not found — installing globally"
  npm install -g pm2
fi

NODE_VERSION=$(node -v | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then fail "Node.js $NODE_VERSION is too old (need 18+)"; fi

if [ ! -f .env ]; then fail ".env file not found — copy from .env.example"; fi

success "Node.js $NODE_VERSION, npm $(npm -v), PM2 $(pm2 -v)"

# ── Step 2: Pull Latest Code ────────────────────────────────────────

step 2 "Pulling latest code"

if [ "$SKIP_PULL" = false ]; then
  PREV_COMMIT=$(git rev-parse HEAD)
  git pull --ff-only origin main || warn "Git pull failed — using current code"
  NEW_COMMIT=$(git rev-parse HEAD)

  if [ "$PREV_COMMIT" = "$NEW_COMMIT" ]; then
    info "Already up to date ($PREV_COMMIT)"
  else
    info "Updated: ${PREV_COMMIT:0:7} → ${NEW_COMMIT:0:7}"
  fi
else
  info "Skipping git pull (--skip-pull)"
fi

# ── Step 3: Install Dependencies ────────────────────────────────────

step 3 "Installing dependencies"
npm ci --omit=dev 2>/dev/null || npm install --omit=dev
success "Dependencies installed"

# ── Step 4: Build ────────────────────────────────────────────────────

step 4 "Building TypeScript"
npm run build
success "Build complete"

# ── Step 5: Database Migrations ──────────────────────────────────────

step 5 "Running database migrations"
npx prisma generate
npx prisma migrate deploy
success "Migrations applied"

# ── Step 6: Restart PM2 ─────────────────────────────────────────────

step 6 "Restarting with PM2"

if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  info "Reloading existing process..."
  pm2 reload ecosystem.config.js --update-env
else
  info "Starting new process..."
  pm2 start ecosystem.config.js
fi

pm2 save
success "PM2 process running"

# ── Step 7: Health Check ────────────────────────────────────────────

step 7 "Health check verification"

RETRIES=0
while [ $RETRIES -lt $MAX_HEALTH_RETRIES ]; do
  if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
    success "Health check passed"
    echo ""
    echo "============================================"
    echo "  Deployment Complete!"
    echo "============================================"
    echo ""
    echo "  Health: $HEALTH_URL"
    echo "  Status: http://localhost:${HEALTH_PORT}/status"
    echo "  PM2:    pm2 monit"
    echo "  Logs:   pm2 logs $APP_NAME"
    echo ""
    exit 0
  fi

  RETRIES=$((RETRIES + 1))
  info "Waiting for health check... (${RETRIES}/${MAX_HEALTH_RETRIES})"
  sleep $HEALTH_RETRY_DELAY
done

warn "Health check failed after ${MAX_HEALTH_RETRIES} attempts"
warn "Check logs: pm2 logs $APP_NAME --lines 50"
exit 1
