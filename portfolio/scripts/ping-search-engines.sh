#!/bin/bash
# Post-deploy script: Notify search engines of new/changed content (both domains)
# Runs automatically via GitHub Actions after Cloudflare Pages deploy
# Can also be run manually: ./scripts/ping-search-engines.sh [--all | --urls "/blog/my-post,/about"]

SITE_COM="https://umesh-malik.com"
SITE_IN="https://umesh-malik.in"
INDEXNOW_KEY="b52fd35b0ee3234d8074e58fa2591da9"
WEBSUB_HUB="https://pubsubhubbub.appspot.com"

# ---------------------------------------------------------------------------
# URL Detection: git diff, manual args, or sitemap fallback
# ---------------------------------------------------------------------------

detect_urls() {
  # Option 1: Manual URLs passed via --urls flag
  if [ "$1" = "--urls" ] && [ -n "$2" ]; then
    echo "$2" | tr ',' '\n'
    return
  fi

  # Option 2: --all flag → fetch everything from sitemaps
  if [ "$1" = "--all" ]; then
    echo "[mode] Fetching all URLs from sitemaps..." >&2
    for SITEMAP in "/sitemap.xml" "/blog-sitemap.xml"; do
      curl -sf "${SITE_COM}${SITEMAP}" 2>/dev/null \
        | grep -o '<loc>[^<]*</loc>' \
        | sed 's/<[^>]*>//g' \
        | sed "s|${SITE_COM}||g"
    done
    return
  fi

  # Option 3: Smart git diff detection
  echo "[mode] Detecting changed pages from git diff..." >&2

  CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "")

  if [ -z "$CHANGED_FILES" ]; then
    echo "[warn] No git diff available, falling back to sitemap" >&2
    detect_urls "--all"
    return
  fi

  echo "Changed files:" >&2
  echo "$CHANGED_FILES" >&2

  SUBMIT_ALL_STATIC=false
  SUBMIT_ALL_BLOG=false

  while IFS= read -r file; do
    # Blog post changed/added
    if echo "$file" | grep -qE '^(portfolio/)?src/lib/posts/(.+)\.md$'; then
      SLUG=$(echo "$file" | sed -E 's|^(portfolio/)?src/lib/posts/(.+)\.md$|\2|')
      echo "/blog/$SLUG"
      echo "/blog"
    fi

    # Route page changed
    if echo "$file" | grep -qE '^(portfolio/)?src/routes/[^[]+/\+page\.(svelte|ts)$'; then
      ROUTE=$(echo "$file" | sed -E 's|^(portfolio/)?src/routes/(.+)/\+page\.(svelte|ts|server\.ts)$|\2|')
      if ! echo "$ROUTE" | grep -qE '\.(xml|json|txt)'; then
        echo "/$ROUTE"
      fi
    fi

    # Layout or config changed → all static pages
    if echo "$file" | grep -qE '(routes/\+layout|app\.(html|css)|lib/components/layout/|lib/config/site\.ts)'; then
      SUBMIT_ALL_STATIC=true
    fi

    # Blog infrastructure changed → all blog posts
    if echo "$file" | grep -qE 'lib/(utils/blog\.ts|components/blog/)'; then
      SUBMIT_ALL_BLOG=true
    fi

    # Frontend (retro-portfolio) changed
    if echo "$file" | grep -qE '^frontend/'; then
      echo "/projects/retro-portfolio"
      echo "/projects/retro-portfolio/about"
      echo "/projects/retro-portfolio/experience"
      echo "/projects/retro-portfolio/projects"
      echo "/projects/retro-portfolio/skills"
      echo "/projects/retro-portfolio/contact"
    fi
  done <<< "$CHANGED_FILES"

  if [ "$SUBMIT_ALL_STATIC" = "true" ]; then
    for page in "" "/blog" "/projects" "/about" "/resume" "/faq" "/contact" "/uses" "/resources" "/ai-summary" "/press" \
      "/projects/retro-portfolio" "/projects/retro-portfolio/about" "/projects/retro-portfolio/experience" \
      "/projects/retro-portfolio/projects" "/projects/retro-portfolio/skills" "/projects/retro-portfolio/contact"; do
      echo "$page"
    done
  fi

  if [ "$SUBMIT_ALL_BLOG" = "true" ]; then
    echo "/blog"
    # Find posts dir (works from repo root or portfolio/)
    POSTS_DIR="portfolio/src/lib/posts"
    [ ! -d "$POSTS_DIR" ] && POSTS_DIR="src/lib/posts"
    if [ -d "$POSTS_DIR" ]; then
      for md in "$POSTS_DIR"/*.md; do
        SLUG=$(basename "$md" .md)
        echo "/blog/$SLUG"
      done
    fi
  fi
}

# Collect and deduplicate URLs
URL_PATHS=$(detect_urls "$@" | sort -u | grep -v '^$')
URL_COUNT=$(echo "$URL_PATHS" | grep -c '[^[:space:]]' || echo "0")

if [ "$URL_COUNT" -eq 0 ]; then
  echo "No indexable page changes detected. Nothing to submit."
  exit 0
fi

echo ""
echo "=== Notifying search engines (both domains) ==="
echo "  $URL_COUNT unique URL paths to submit:"
echo "$URL_PATHS" | sed 's/^/    /'
echo ""

# ---------------------------------------------------------------------------
# 1. WebSub / PubSubHubbub — Google
# ---------------------------------------------------------------------------
echo "[WebSub] Notifying Google via PubSubHubbub hub..."

for DOMAIN in "umesh-malik.com" "umesh-malik.in"; do
  for FEED in "/rss.xml" "/blog-feed.xml" "/feed.json"; do
    RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WEBSUB_HUB" \
      -d "hub.mode=publish" \
      -d "hub.url=https://${DOMAIN}${FEED}")
    echo "  ${DOMAIN}${FEED} → HTTP $RESP"
  done
done

# ---------------------------------------------------------------------------
# 2. IndexNow — Bing, Yandex, DuckDuckGo, Seznam, Naver
# ---------------------------------------------------------------------------
echo ""
echo "[IndexNow] Submitting changed URLs..."

for DOMAIN in "umesh-malik.com" "umesh-malik.in"; do
  # Build JSON array of full URLs
  URL_JSON=""
  while IFS= read -r path; do
    [ -z "$path" ] && continue
    if [ "$path" = "" ] || [ "$path" = "/" ]; then
      FULL_URL="https://${DOMAIN}/"
    else
      FULL_URL="https://${DOMAIN}${path}"
    fi
    if [ -z "$URL_JSON" ]; then
      URL_JSON="\"${FULL_URL}\""
    else
      URL_JSON="${URL_JSON}, \"${FULL_URL}\""
    fi
  done <<< "$URL_PATHS"

  RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "https://api.indexnow.org/indexnow" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "{
      \"host\": \"${DOMAIN}\",
      \"key\": \"${INDEXNOW_KEY}\",
      \"keyLocation\": \"https://${DOMAIN}/${INDEXNOW_KEY}.txt\",
      \"urlList\": [${URL_JSON}]
    }")

  case $RESP in
    200) STATUS="OK — URLs submitted" ;;
    202) STATUS="Accepted — validation pending" ;;
    400) STATUS="Bad Request" ;;
    403) STATUS="Forbidden — key not valid" ;;
    422) STATUS="Unprocessable — URLs don't match host" ;;
    429) STATUS="Rate limited" ;;
    *)   STATUS="Unknown ($RESP)" ;;
  esac

  echo "  ${DOMAIN} → HTTP $RESP ($STATUS) [$URL_COUNT URLs]"
done

echo ""
echo "=== Done ==="
echo ""
echo "Expected responses:"
echo "  WebSub 204 = success (hub accepted the notification)"
echo "  IndexNow 200/202 = success (URLs queued for crawling)"
