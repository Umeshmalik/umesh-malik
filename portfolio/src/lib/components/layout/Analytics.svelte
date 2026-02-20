<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  const HEARTBEAT_INTERVAL = 30_000;

  function isBot(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    return /bot|crawl|spider|slurp|baiduspider|yandex|duckduck|facebookexternalhit|twitterbot|linkedinbot|embedly|quora|pinterest|redditbot|applebot|semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider|gptbot|claude|chatgpt|anthropic|google-extended|ccbot|ia_archiver|archive\.org/i.test(
      ua,
    );
  }

  function getSource(): string {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source");
    if (utmSource) return utmSource.toLowerCase();

    const utmMedium = params.get("utm_medium");
    if (utmMedium) {
      const m = utmMedium.toLowerCase();
      if (m === "social") return "social";
      if (m === "email") return "email";
      if (m === "cpc" || m === "paid") return "paid";
    }

    const referrer = document.referrer;
    if (!referrer) return "direct";

    try {
      const host = new URL(referrer).hostname.toLowerCase();
      if (host.includes("google")) return "google";
      if (host.includes("bing")) return "bing";
      if (host.includes("duckduckgo")) return "duckduckgo";
      if (host.includes("yahoo")) return "yahoo";
      if (host.includes("linkedin")) return "linkedin";
      if (
        host.includes("twitter") ||
        host.includes("t.co") ||
        host.includes("x.com")
      )
        return "twitter";
      if (host.includes("facebook") || host.includes("fb.com"))
        return "facebook";
      if (host.includes("github")) return "github";
      if (host.includes("reddit")) return "reddit";
      if (host.includes("youtube")) return "youtube";
      if (host.includes("instagram")) return "instagram";
      return "referral";
    } catch {
      return "direct";
    }
  }

  function getSessionId(): string {
    const key = "analytics_session_id";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    return id;
  }

  function sendEvent(
    path: string,
    sessionId: string,
    source: string,
    type: "pageview" | "heartbeat",
  ): void {
    const payload = JSON.stringify({
      path,
      referrer: document.referrer,
      source,
      sessionId,
      type,
    });
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/event", blob);
  }

  onMount(() => {
    // Skip tracking for bots/crawlers entirely
    if (isBot()) return;

    const sessionId = getSessionId();
    const source = getSource();

    // Send initial page view
    sendEvent(page.url.pathname, sessionId, source, "pageview");

    // Heartbeat only keeps the live session alive — does NOT count as a page view
    const heartbeat = setInterval(() => {
      sendEvent(page.url.pathname, sessionId, source, "heartbeat");
    }, HEARTBEAT_INTERVAL);

    return () => clearInterval(heartbeat);
  });

  // Track client-side navigations
  let lastPath = $state("");

  $effect(() => {
    if (!browser) return;
    const currentPath = page.url.pathname;
    if (lastPath && lastPath !== currentPath) {
      if (!isBot()) {
        const sessionId = getSessionId();
        const source = getSource();
        sendEvent(currentPath, sessionId, source, "pageview");
      }
    }
    lastPath = currentPath;
  });
</script>
