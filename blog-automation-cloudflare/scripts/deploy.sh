#!/usr/bin/env bash
# ============================================
# Cloudflare Workers Deployment Script
# ============================================
#
# Usage:
#   ./scripts/deploy.sh               # Deploy to production
#   ./scripts/deploy.sh --staging     # Deploy to staging
#   ./scripts/deploy.sh --init        # First-time infrastructure setup
#   ./scripts/deploy.sh --migrate     # Run D1 migrations only
#
# ============================================

set -euo pipefail

# ── Colors ───────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}ℹ${NC}  $1"; }
ok()    { echo -e "${GREEN}✓${NC}  $1"; }
warn()  { echo -e "${YELLOW}⚠${NC}  $1"; }
fail()  { echo -e "${RED}✗${NC}  $1"; exit 1; }

# ── Parse Arguments ──────────────────────────────────────────────────

STAGING=false
INIT=false
MIGRATE_ONLY=false

for arg in "$@"; do
  case $arg in
    --staging)    STAGING=true ;;
    --init)       INIT=true ;;
    --migrate)    MIGRATE_ONLY=true ;;
    --help|-h)
      echo "Usage: $0 [--staging] [--init] [--migrate]"
      echo ""
      echo "Options:"
      echo "  --staging    Deploy to staging environment"
      echo "  --init       First-time infrastructure setup (create D1, KV, R2, Queues)"
      echo "  --migrate    Run D1 migrations only (no code deploy)"
      exit 0
      ;;
    *) fail "Unknown argument: $arg" ;;
  esac
done

ENV_FLAG=""
if $STAGING; then
  ENV_FLAG="--env staging"
  info "Deploying to STAGING environment"
else
  info "Deploying to PRODUCTION environment"
fi

# ── Pre-flight Checks ───────────────────────────────────────────────

echo ""
echo "============================================"
echo "  Cloudflare Workers Deployment"
echo "============================================"
echo ""

# Check wrangler
if ! command -v wrangler &> /dev/null && ! npx wrangler --version &> /dev/null 2>&1; then
  fail "wrangler CLI not found. Install: npm install -g wrangler"
fi
ok "Wrangler CLI available"

# Check authentication
if ! wrangler whoami &> /dev/null 2>&1; then
  fail "Not logged in to Cloudflare. Run: wrangler login"
fi
ok "Authenticated with Cloudflare"

# ── First-Time Setup ────────────────────────────────────────────────

if $INIT; then
  echo ""
  info "=== Infrastructure Setup ==="
  echo ""

  # Create D1 database
  info "Creating D1 database..."
  wrangler d1 create blog-automation-db 2>/dev/null || warn "D1 database may already exist"
  ok "D1 database ready"

  # Create KV namespace
  info "Creating KV namespace..."
  wrangler kv namespace create CACHE 2>/dev/null || warn "KV namespace may already exist"
  ok "KV namespace ready"

  # Create R2 bucket
  info "Creating R2 bucket..."
  wrangler r2 bucket create blog-automation-assets 2>/dev/null || warn "R2 bucket may already exist"
  ok "R2 bucket ready"

  # Create Queue
  info "Creating Queue..."
  wrangler queues create blog-publish-queue 2>/dev/null || warn "Queue may already exist"
  wrangler queues create blog-publish-dlq 2>/dev/null || warn "DLQ may already exist"
  ok "Queues ready"

  echo ""
  warn "IMPORTANT: Update wrangler.toml with the IDs printed above!"
  echo ""
  info "Then set secrets:"
  echo "  wrangler secret put ANTHROPIC_API_KEY"
  echo "  wrangler secret put WEBSITE_API_URL"
  echo "  wrangler secret put WEBSITE_API_KEY"
  echo "  wrangler secret put SLACK_WEBHOOK_URL  (optional)"
  echo ""

  if ! $STAGING; then
    exit 0
  fi
fi

# ── Run D1 Migrations ───────────────────────────────────────────────

echo ""
info "Running D1 migrations..."
npx wrangler d1 migrations apply blog-automation-db $ENV_FLAG
ok "D1 migrations applied"

if $MIGRATE_ONLY; then
  echo ""
  ok "Migration-only run complete"
  exit 0
fi

# ── Type Check ──────────────────────────────────────────────────────

echo ""
info "Running TypeScript type check..."
npx tsc --noEmit
ok "Type check passed"

# ── Deploy Worker ────────────────────────────────────────────────────

echo ""
info "Deploying Worker..."
npx wrangler deploy $ENV_FLAG
ok "Worker deployed"

# ── Verify Deployment ────────────────────────────────────────────────

echo ""
info "Verifying deployment..."

if $STAGING; then
  WORKER_URL="https://blog-automation-staging.$(wrangler whoami 2>/dev/null | grep -oP 'workers\.dev' || echo 'workers.dev')"
else
  WORKER_URL="https://blog-automation.$(wrangler whoami 2>/dev/null | grep -oP 'workers\.dev' || echo 'workers.dev')"
fi

sleep 3

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL/health" 2>/dev/null || echo "000")
if [ "$HEALTH_STATUS" = "200" ]; then
  ok "Health check passed (HTTP $HEALTH_STATUS)"
else
  warn "Health check returned HTTP $HEALTH_STATUS (worker may need a moment to warm up)"
fi

# ── Summary ──────────────────────────────────────────────────────────

echo ""
echo "============================================"
echo "  Deployment Complete"
echo "============================================"
echo ""
echo "  Worker URL:  $WORKER_URL"
echo "  Health:      $WORKER_URL/health"
echo "  Status:      $WORKER_URL/status"
echo "  API Docs:    $WORKER_URL/api/blogs"
echo ""
echo "  Useful commands:"
echo "    wrangler tail $ENV_FLAG           # Live logs"
echo "    wrangler d1 execute blog-automation-db --command 'SELECT COUNT(*) FROM blogs;'"
echo ""
