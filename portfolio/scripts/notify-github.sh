#!/bin/bash
# Triggers the SEO ping GitHub Action after Cloudflare Pages build completes.
#
# Required environment variables (set in CF Pages dashboard → Settings → Environment variables):
#   GITHUB_PAT  — Fine-grained GitHub Personal Access Token (needs "Actions: write" permission)
#   GITHUB_REPO — Repository in "owner/repo" format, e.g. "Umeshmalik/umesh-malik"
#
# This script is safe to run locally — it silently skips if env vars are missing.

if [ -z "$GITHUB_PAT" ] || [ -z "$GITHUB_REPO" ]; then
  echo "[notify-github] Skipping — GITHUB_PAT or GITHUB_REPO not set (local build)"
  exit 0
fi

echo "[notify-github] Triggering SEO ping workflow on ${GITHUB_REPO}..."

RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: Bearer ${GITHUB_PAT}" \
  "https://api.github.com/repos/${GITHUB_REPO}/dispatches" \
  -d '{"event_type":"cf-pages-deployed"}')

if [ "$RESP" = "204" ]; then
  echo "[notify-github] GitHub Action triggered successfully"
else
  echo "[notify-github] GitHub API returned HTTP $RESP (expected 204)"
fi
