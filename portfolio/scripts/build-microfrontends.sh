#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# Microfrontend Build Pipeline
# Builds sub-apps and copies their output into SvelteKit's
# static/ directory before building the main SvelteKit app.
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$PROJECT_ROOT")"

# ── Microfrontend registry ──────────────────────────────────
# Add future sub-apps here as: "source_dir:static_subpath"
MICROFRONTENDS=(
  "frontend:projects/retro-portfolio"
)

# ── Conflicting files to remove from sub-app output ─────────
# These files would conflict with the main SvelteKit app's files
CONFLICTING_FILES=(
  "robots.txt"
  "sitemap-index.xml"
  "sitemap-0.xml"
  "_headers"
  "_redirects"
)

echo "══════════════════════════════════════════════════"
echo "  Microfrontend Build Pipeline"
echo "══════════════════════════════════════════════════"
echo ""

# ── Phase 1: Build each microfrontend ───────────────────────
for entry in "${MICROFRONTENDS[@]}"; do
  IFS=':' read -r src_dir static_path <<< "$entry"
  src_path="$REPO_ROOT/$src_dir"
  dest_path="$PROJECT_ROOT/static/$static_path"

  echo "→ Installing dependencies: $src_dir"
  (cd "$src_path" && pnpm install --frozen-lockfile)

  echo "→ Building: $src_dir → static/$static_path"

  # Build the sub-app
  echo "  Building $src_dir..."
  (cd "$src_path" && pnpm build)

  # Clean destination
  echo "  Cleaning static/$static_path..."
  rm -rf "$dest_path"
  mkdir -p "$dest_path"

  # Copy build output
  echo "  Copying build output..."
  cp -r "$src_path/dist/"* "$dest_path/"

  # Remove conflicting files
  for file in "${CONFLICTING_FILES[@]}"; do
    if [ -f "$dest_path/$file" ]; then
      echo "  Removing conflicting: $file"
      rm "$dest_path/$file"
    fi
  done

  echo "  Done: $src_dir"
  echo ""
done

# ── Phase 2: Build SvelteKit ───────────────────────────────
echo "→ Installing dependencies in SvelteKit app..."
(cd "$PROJECT_ROOT" && pnpm install --frozen-lockfile)

echo "→ Building SvelteKit app..."
(cd "$PROJECT_ROOT" && pnpm build)

echo ""
echo "══════════════════════════════════════════════════"
echo "  Build complete!"
echo "══════════════════════════════════════════════════"
