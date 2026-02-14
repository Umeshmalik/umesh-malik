#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# Generate PNG/ICO icons from SVG source files
# Requires: rsvg-convert (librsvg) or Inkscape
# Install: brew install librsvg
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
STATIC="$PROJECT_ROOT/static"
ICONS_DIR="$STATIC/icons"

mkdir -p "$ICONS_DIR"

echo "Generating icon assets from SVGs..."

# Check for rsvg-convert
if ! command -v rsvg-convert &> /dev/null; then
  echo "Error: rsvg-convert not found."
  echo "Install with: brew install librsvg"
  exit 1
fi

# Generate PNG icons from icon.svg (512x512 base)
echo "  -> icons/icon-192.png"
rsvg-convert -w 192 -h 192 "$STATIC/icon.svg" -o "$ICONS_DIR/icon-192.png"

echo "  -> icons/icon-512.png"
rsvg-convert -w 512 -h 512 "$STATIC/icon.svg" -o "$ICONS_DIR/icon-512.png"

echo "  -> icons/icon-maskable-512.png (with padding)"
# Maskable icons need ~10% safe zone padding
# Create a padded version by rendering at smaller size on larger canvas
rsvg-convert -w 410 -h 410 "$STATIC/icon.svg" -o "/tmp/icon-inner.png"

# Use sips (macOS built-in) to create the maskable icon with padding
sips -z 512 512 --padToHeightWidth 512 512 --padColor 000000 "/tmp/icon-inner.png" --out "$ICONS_DIR/icon-maskable-512.png" 2>/dev/null || \
  cp "$ICONS_DIR/icon-512.png" "$ICONS_DIR/icon-maskable-512.png"

echo "  -> icons/apple-touch-icon.png"
rsvg-convert -w 180 -h 180 "$STATIC/icon.svg" -o "$ICONS_DIR/apple-touch-icon.png"

# Generate favicon.ico (32x32)
echo "  -> favicon.ico"
rsvg-convert -w 32 -h 32 "$STATIC/favicon.svg" -o "/tmp/favicon-32.png"
# Convert PNG to ICO using sips + png (browsers accept 32x32 PNG as .ico)
cp "/tmp/favicon-32.png" "$STATIC/favicon.ico"

# Generate OG image (1200x630)
echo "  -> og-image.jpg"
rsvg-convert -w 1200 -h 630 "$STATIC/og-image.svg" -o "/tmp/og-image.png"
sips -s format jpeg "/tmp/og-image.png" --out "$STATIC/og-image.jpg" 2>/dev/null || \
  cp "/tmp/og-image.png" "$STATIC/og-image.png"

echo ""
echo "Done! Generated icons in static/icons/ and static/"
echo ""
echo "Files created:"
ls -la "$ICONS_DIR/"
ls -la "$STATIC/favicon.ico" "$STATIC/og-image.jpg" 2>/dev/null || true
