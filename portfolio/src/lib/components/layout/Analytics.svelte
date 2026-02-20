<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  const HEARTBEAT_INTERVAL = 30_000;

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
      if (host.includes("twitter") || host.includes("t.co") || host.includes("x.com"))
        return "twitter";
      if (host.includes("facebook") || host.includes("fb.com")) return "facebook";
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

  function sendEvent(path: string, sessionId: string, source: string): void {
    const payload = JSON.stringify({
      path,
      referrer: document.referrer,
      source,
      sessionId,
    });
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/event", blob);
  }

  onMount(() => {
    const sessionId = getSessionId();
    const source = getSource();

    // Send initial page view
    sendEvent(page.url.pathname, sessionId, source);

    // Heartbeat to keep live session alive
    const heartbeat = setInterval(() => {
      sendEvent(page.url.pathname, sessionId, source);
    }, HEARTBEAT_INTERVAL);

    return () => clearInterval(heartbeat);
  });

  // Track client-side navigations
  let lastPath = $state("");

  $effect(() => {
    if (!browser) return;
    const currentPath = page.url.pathname;
    if (lastPath && lastPath !== currentPath) {
      const sessionId = getSessionId();
      const source = getSource();
      sendEvent(currentPath, sessionId, source);
    }
    lastPath = currentPath;
  });
</script>
