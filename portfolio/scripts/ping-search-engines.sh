#!/bin/bash
# Post-deploy script: Notify search engines of new content (both domains)
# Runs automatically via GitHub Actions after Cloudflare Pages deploy
# Can also be run manually: ./scripts/ping-search-engines.sh

SITE_COM="https://umesh-malik.com"
SITE_IN="https://umesh-malik.in"
INDEXNOW_KEY="b52fd35b0ee3234d8074e58fa2591da9"
WEBSUB_HUB="https://pubsubhubbub.appspot.com"

echo "=== Notifying search engines (both domains) ==="

# 1. WebSub / PubSubHubbub — Google's recommended method since sitemap ping was deprecated
#    See: https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping
echo ""
echo "[WebSub] Notifying Google via PubSubHubbub hub..."

# Ping all feed URLs for .com
for FEED in "/rss.xml" "/blog-feed.xml" "/feed.json"; do
  RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WEBSUB_HUB" \
    -d "hub.mode=publish" \
    -d "hub.url=${SITE_COM}${FEED}")
  echo "  .com${FEED} → HTTP $RESP"
done

# Ping all feed URLs for .in
for FEED in "/rss.xml" "/blog-feed.xml" "/feed.json"; do
  RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WEBSUB_HUB" \
    -d "hub.mode=publish" \
    -d "hub.url=${SITE_IN}${FEED}")
  echo "  .in${FEED}  → HTTP $RESP"
done

# 2. IndexNow — instant indexing for Bing, Yandex, DuckDuckGo, Seznam, Naver
echo ""
echo "[IndexNow] Submitting .com URLs..."
RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json" \
  -d "{
    \"host\": \"umesh-malik.com\",
    \"key\": \"${INDEXNOW_KEY}\",
    \"keyLocation\": \"${SITE_COM}/${INDEXNOW_KEY}.txt\",
    \"urlList\": [
      \"${SITE_COM}/\",
      \"${SITE_COM}/blog\",
      \"${SITE_COM}/blog/ai-agent-attacks-developer-matplotlib-open-source\",
      \"${SITE_COM}/blog-sitemap.xml\"
    ]
  }")
echo "  .com IndexNow → HTTP $RESP"

echo "[IndexNow] Submitting .in URLs..."
RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json" \
  -d "{
    \"host\": \"umesh-malik.in\",
    \"key\": \"${INDEXNOW_KEY}\",
    \"keyLocation\": \"${SITE_IN}/${INDEXNOW_KEY}.txt\",
    \"urlList\": [
      \"${SITE_IN}/\",
      \"${SITE_IN}/blog\",
      \"${SITE_IN}/blog/ai-agent-attacks-developer-matplotlib-open-source\",
      \"${SITE_IN}/blog-sitemap.xml\"
    ]
  }")
echo "  .in  IndexNow → HTTP $RESP"

echo ""
echo "=== Done ==="
echo ""
echo "Expected responses:"
echo "  WebSub 204 = success (hub accepted the notification)"
echo "  IndexNow 200/202 = success (URLs queued for crawling)"
echo ""
echo "For fastest Google indexing, also do this manual step:"
echo "  Google Search Console → URL Inspection → paste URL → Request Indexing"
echo "  ${SITE_COM}/blog/ai-agent-attacks-developer-matplotlib-open-source"
