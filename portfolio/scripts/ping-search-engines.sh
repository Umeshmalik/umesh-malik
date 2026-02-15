#!/bin/bash
# Post-deploy script: Ping search engines for both domains
# Runs automatically via GitHub Actions after Cloudflare Pages deploy
# Can also be run manually: ./scripts/ping-search-engines.sh

SITE_COM="https://umesh-malik.com"
SITE_IN="https://umesh-malik.in"
INDEXNOW_KEY="b52fd35b0ee3234d8074e58fa2591da9"

echo "=== Pinging search engines for both domains ==="

# 1. Google sitemap pings
echo ""
echo "[Google] Pinging sitemaps..."
curl -sf "https://www.google.com/ping?sitemap=${SITE_COM}/sitemap-index.xml" > /dev/null && echo "  .com sitemap-index OK"
curl -sf "https://www.google.com/ping?sitemap=${SITE_COM}/blog-sitemap.xml" > /dev/null && echo "  .com blog-sitemap OK"
curl -sf "https://www.google.com/ping?sitemap=${SITE_IN}/sitemap-index.xml" > /dev/null && echo "  .in  sitemap-index OK"
curl -sf "https://www.google.com/ping?sitemap=${SITE_IN}/blog-sitemap.xml" > /dev/null && echo "  .in  blog-sitemap OK"

# 2. IndexNow — instant indexing for Bing, Yandex, DuckDuckGo, Seznam, Naver
echo ""
echo "[IndexNow] Submitting .com URLs..."
curl -sf -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json" \
  -d "{
    \"host\": \"umesh-malik.com\",
    \"key\": \"${INDEXNOW_KEY}\",
    \"keyLocation\": \"${SITE_COM}/${INDEXNOW_KEY}.txt\",
    \"urlList\": [
      \"${SITE_COM}/blog/ai-agent-attacks-developer-matplotlib-open-source\",
      \"${SITE_COM}/blog\",
      \"${SITE_COM}/\",
      \"${SITE_COM}/blog-sitemap.xml\"
    ]
  }" && echo "  .com IndexNow OK" || echo "  .com IndexNow submitted (may take time to propagate)"

echo "[IndexNow] Submitting .in URLs..."
curl -sf -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json" \
  -d "{
    \"host\": \"umesh-malik.in\",
    \"key\": \"${INDEXNOW_KEY}\",
    \"keyLocation\": \"${SITE_IN}/${INDEXNOW_KEY}.txt\",
    \"urlList\": [
      \"${SITE_IN}/blog/ai-agent-attacks-developer-matplotlib-open-source\",
      \"${SITE_IN}/blog\",
      \"${SITE_IN}/\",
      \"${SITE_IN}/blog-sitemap.xml\"
    ]
  }" && echo "  .in  IndexNow OK" || echo "  .in  IndexNow submitted (may take time to propagate)"

# 3. Bing sitemap pings
echo ""
echo "[Bing] Pinging sitemaps..."
curl -sf "https://www.bing.com/ping?sitemap=${SITE_COM}/sitemap-index.xml" > /dev/null && echo "  .com sitemap OK"
curl -sf "https://www.bing.com/ping?sitemap=${SITE_IN}/sitemap-index.xml" > /dev/null && echo "  .in  sitemap OK"

echo ""
echo "=== Done ==="
echo ""
echo "For fastest Google indexing, also do these manual steps:"
echo "1. Google Search Console → URL Inspection → Request Indexing"
echo "   ${SITE_COM}/blog/ai-agent-attacks-developer-matplotlib-open-source"
echo "2. Bing Webmaster Tools → URL Submission"
echo "3. Share on X, LinkedIn, Reddit — backlinks accelerate crawling"
