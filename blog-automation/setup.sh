#!/usr/bin/env bash
# ============================================
# Blog Automation System — Setup Script
# ============================================
#
# This script prepares a fresh development environment:
#   1. Checks Node.js version
#   2. Installs npm dependencies
#   3. Creates .env from .env.example (if not present)
#   4. Generates Prisma client
#   5. Runs database migrations
#   6. Seeds initial topics
#   7. Validates configuration
#
# Usage:
#   chmod +x setup.sh
#   ./setup.sh
#
# ============================================

set -e  # Exit on first error

# ── Colours ──────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Colour

# ── Helpers ──────────────────────────────────────────────────────────

info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail()    { echo -e "${RED}[FAIL]${NC}  $1"; exit 1; }

# ── Banner ───────────────────────────────────────────────────────────

echo ""
echo "============================================"
echo "  Blog Automation System — Setup"
echo "============================================"
echo ""

# ── Step 1: Check Node.js ────────────────────────────────────────────

info "Checking Node.js version..."

if ! command -v node &> /dev/null; then
  fail "Node.js is not installed. Install Node.js 18+ from https://nodejs.org"
fi

NODE_VERSION=$(node -v | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)

if [ "$NODE_MAJOR" -lt 18 ]; then
  fail "Node.js $NODE_VERSION is too old. This project requires Node.js 18 or later."
fi

success "Node.js $NODE_VERSION"

# ── Step 1b: Check npm ───────────────────────────────────────────────

if ! command -v npm &> /dev/null; then
  fail "npm is not installed."
fi

success "npm $(npm -v)"

# ── Step 2: Install dependencies ─────────────────────────────────────

info "Installing npm dependencies..."
npm install

if [ $? -eq 0 ]; then
  success "Dependencies installed"
else
  fail "npm install failed"
fi

# ── Step 3: Create .env ─────────────────────────────────────────────

if [ -f .env ]; then
  warn ".env already exists — skipping copy (edit manually if needed)"
else
  info "Creating .env from .env.example..."
  cp .env.example .env
  success ".env created — EDIT THIS FILE with your actual values before starting"
fi

# ── Step 4: Generate Prisma client ───────────────────────────────────

info "Generating Prisma client..."
npx prisma generate

if [ $? -eq 0 ]; then
  success "Prisma client generated"
else
  fail "Prisma client generation failed"
fi

# ── Step 5: Run database migrations ──────────────────────────────────

info "Checking database connection and running migrations..."

# Test if DATABASE_URL is still the placeholder value
if grep -q "DATABASE_URL=postgresql://user:password" .env 2>/dev/null; then
  warn "DATABASE_URL is still the placeholder value in .env"
  warn "Skipping migrations — update DATABASE_URL and run: npx prisma migrate dev"
else
  # Try to run migrations
  if npx prisma migrate dev --name init 2>/dev/null; then
    success "Database migrations applied"
  else
    warn "Database migration failed — this is normal if the database isn't running yet"
    warn "Start PostgreSQL, update DATABASE_URL in .env, then run: npx prisma migrate dev"
  fi
fi

# ── Step 6: Seed initial topics ──────────────────────────────────────

info "Checking if initial topics should be seeded..."

if grep -q "DATABASE_URL=postgresql://user:password" .env 2>/dev/null; then
  warn "Skipping topic seeding — database is not configured yet"
  warn "After configuring, seed topics with: npm run topics:generate -- 30"
else
  info "You can seed initial topics after setup with:"
  echo "    npm run topics:generate -- 30"
  echo ""
fi

# ── Step 7: Build check ─────────────────────────────────────────────

info "Running TypeScript compilation check..."
if npx tsc --noEmit 2>/dev/null; then
  success "TypeScript compiles cleanly"
else
  warn "TypeScript compilation has issues — run 'npx tsc --noEmit' for details"
fi

# ── Done ─────────────────────────────────────────────────────────────

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "  Next steps:"
echo ""
echo "  1. Edit .env with your actual configuration:"
echo "     - ANTHROPIC_API_KEY  (from https://console.anthropic.com)"
echo "     - DATABASE_URL       (your PostgreSQL connection string)"
echo "     - WEBSITE_API_URL    (your CMS endpoint)"
echo "     - WEBSITE_API_KEY    (your CMS credentials)"
echo ""
echo "  2. Start PostgreSQL and run migrations:"
echo "     npx prisma migrate dev"
echo ""
echo "  3. Seed initial topics:"
echo "     npm run topics:generate -- 30"
echo ""
echo "  4. Test connections:"
echo "     npm run test-connection"
echo ""
echo "  5. Start the scheduler:"
echo "     npm run dev          # Development"
echo "     npm run build && npm start  # Production"
echo ""
echo "  For more info, see README.md"
echo ""
