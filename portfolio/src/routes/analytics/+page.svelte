<script lang="ts">
  import SEO from "$lib/components/layout/SEO.svelte";
  import { createBreadcrumbSchema } from "$lib/utils/schema";
  import { siteConfig } from "$lib/config/site";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: siteConfig.url },
    { name: "Analytics", url: `${siteConfig.url}/analytics` },
  ]);

  interface DailyView {
    date: string;
    views: number;
  }

  interface TopPage {
    path: string;
    views: number;
  }

  interface StatsData {
    dailyViews: DailyView[];
    sources: Record<string, number>;
    topPages: TopPage[];
    totalViews: number;
  }

  let secret = $state("");
  let authenticated = $state(false);
  let loading = $state(false);
  let initializing = $state(false);
  let error = $state("");

  let liveCount = $state(0);
  let stats = $state<StatsData | null>(null);
  let days = $state(7);

  // --- Text scramble effect ---
  const GLYPHS =
    "!@#$%^&*()_+-={}[]|;:<>?/0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const SCRAMBLE_DURATION = 800;
  const SCRAMBLE_FPS = 30;

  let scrambledLines = $state<string[]>([]);
  let scrambleRafId: number | null = null;

  function randomChar(): string {
    return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  }

  function startScramble(targets: string[]): void {
    const start = performance.now();
    const frameInterval = 1000 / SCRAMBLE_FPS;
    let lastFrame = 0;

    scrambledLines = targets.map((t) =>
      Array.from({ length: t.length }, randomChar).join(""),
    );

    function tick(now: number): void {
      if (now - lastFrame < frameInterval) {
        scrambleRafId = requestAnimationFrame(tick);
        return;
      }
      lastFrame = now;

      const elapsed = now - start;
      const progress = Math.min(elapsed / SCRAMBLE_DURATION, 1);

      scrambledLines = targets.map((target) => {
        const resolved = Math.floor(progress * target.length);
        return (
          target.slice(0, resolved) +
          Array.from({ length: target.length - resolved }, randomChar).join("")
        );
      });

      if (progress < 1) {
        scrambleRafId = requestAnimationFrame(tick);
      }
    }

    scrambleRafId = requestAnimationFrame(tick);
  }

  function stopScramble(): void {
    if (scrambleRafId !== null) {
      cancelAnimationFrame(scrambleRafId);
      scrambleRafId = null;
    }
    scrambledLines = [];
  }

  function getHeaders(): HeadersInit {
    return { Authorization: `Bearer ${secret}` };
  }

  async function fetchLive(): Promise<void> {
    try {
      const res = await fetch("/api/analytics/live");
      if (!res.ok) throw new Error("Failed to fetch live count");
      const data = await res.json();
      liveCount = data.count;
    } catch (e) {
      console.error("Live fetch error:", e);
    }
  }

  async function fetchStats(): Promise<void> {
    loading = true;
    error = "";
    try {
      const res = await fetch(`/api/analytics/stats?days=${days}`, {
        headers: getHeaders(),
      });
      if (res.status === 401) {
        authenticated = false;
        error = "Invalid secret. Please try again.";
        sessionStorage.removeItem("analytics_secret");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch stats");
      stats = await res.json();
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown error";
    } finally {
      loading = false;
    }
  }

  async function handleLogin(): Promise<void> {
    if (!secret.trim()) return;
    sessionStorage.setItem("analytics_secret", secret);
    authenticated = true;
    initializing = true;
    startScramble([
      "Authenticating...",
      "Decrypting analytics data...",
      "Loading dashboard...",
    ]);
    await Promise.all([fetchStats(), fetchLive()]);
    stopScramble();
    initializing = false;
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter") handleLogin();
  }

  function maxViews(dailyViews: DailyView[]): number {
    return Math.max(...dailyViews.map((d) => d.views), 1);
  }

  function totalSourceCount(sources: Record<string, number>): number {
    return Object.values(sources).reduce((a, b) => a + b, 0);
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  onMount(() => {
    if (!browser) return;
    const saved = sessionStorage.getItem("analytics_secret");
    if (saved) {
      secret = saved;
      authenticated = true;
      initializing = true;
      startScramble([
        "Verifying session...",
        "Decrypting analytics data...",
        "Loading dashboard...",
      ]);
      Promise.all([fetchStats(), fetchLive()]).then(() => {
        stopScramble();
        initializing = false;
      });
    }
  });

  // Auto-refresh live count every 10 seconds
  $effect(() => {
    if (!authenticated || !browser) return;
    const interval = setInterval(fetchLive, 10_000);
    return () => clearInterval(interval);
  });

  // Refetch stats only when user changes the day range (not on initial mount)
  let prevDays = $state(7);
  $effect(() => {
    const currentDays = days;
    if (!authenticated || !browser) return;
    if (currentDays !== prevDays) {
      prevDays = currentDays;
      fetchStats();
    }
  });
</script>

<SEO
  title="Analytics Dashboard | Umesh Malik"
  description="Private analytics dashboard for umesh-malik.com"
  noindex={true}
/>

<svelte:head>
  {@html `<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`}
</svelte:head>

<section class="mx-auto max-w-[1160px] px-6 pt-32 pb-20 lg:px-12">
  <!-- Breadcrumb Navigation -->
  <nav aria-label="Breadcrumb" class="mb-8">
    <ol class="flex flex-wrap items-center gap-1 text-sm text-brand-text-muted">
      <li>
        <a href="/" class="transition-colors hover:text-brand-accent">Home</a>
      </li>
      <li class="mx-1">/</li>
      <li class="text-brand-text-primary" aria-current="page">Analytics</li>
    </ol>
  </nav>

  <h1 class="section-title mb-10 text-brand-text-primary">Analytics</h1>

  {#if !authenticated}
    <!-- Login form -->
    <div class="mx-auto max-w-md">
      <div
        class="corner-brackets rounded-lg border border-brand-card-border bg-brand-card p-8"
      >
        <label for="analytics-secret" class="label-mono mb-6 block text-brand-text-muted">Enter Secret</label>
        <input
          id="analytics-secret"
          type="password"
          bind:value={secret}
          onkeydown={handleKeydown}
          placeholder="Analytics secret"
          autocomplete="current-password"
          class="mb-4 w-full rounded border border-brand-border bg-brand-black px-4 py-3 font-mono text-sm text-brand-text-primary placeholder-brand-text-muted focus:border-brand-accent focus:outline-none"
        />
        {#if error}
          <p class="mb-4 text-sm text-red-400">{error}</p>
        {/if}
        <button
          type="button"
          onclick={handleLogin}
          class="btn-brackets w-full rounded border border-brand-accent px-6 py-3 font-mono text-sm text-brand-accent transition-colors hover:bg-brand-accent hover:text-brand-black"
        >
          Authenticate
        </button>
      </div>
    </div>
  {:else}
    <!-- Dashboard -->
    <div class="space-y-8">
      <!-- Top bar: Live count + day selector -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div
          class="corner-brackets flex items-center gap-3 rounded-lg border border-brand-card-border bg-brand-card px-6 py-4"
        >
          <span
            class="inline-block h-2.5 w-2.5 rounded-full bg-green-500"
            aria-hidden="true"
          ></span>
          <span class="label-mono text-brand-text-muted">Live Users</span>
          <span class="font-mono text-2xl font-semibold text-brand-text-primary"
            >{liveCount}</span
          >
        </div>

        <div class="flex items-center gap-2">
          <span class="label-mono text-brand-text-muted">Period</span>
          {#each [7, 14, 30] as d}
            <button
              type="button"
              aria-pressed={days === d}
              onclick={() => (days = d)}
              class="rounded border px-3 py-1.5 font-mono text-xs transition-colors {days ===
              d
                ? 'border-brand-accent bg-brand-accent text-brand-black'
                : 'border-brand-border text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent'}"
            >
              {d}d
            </button>
          {/each}
        </div>
      </div>

      {#if initializing}
        <!-- Text scramble loading animation -->
        <div class="flex flex-col items-center justify-center gap-4 py-20">
          {#each scrambledLines as line}
            <span class="font-mono text-sm tracking-widest text-brand-accent"
              >{line}</span
            >
          {/each}
          <div class="mt-4 h-px w-48 overflow-hidden bg-brand-border">
            <div class="h-full w-1/3 animate-pulse bg-brand-accent"></div>
          </div>
        </div>
      {:else if loading && !stats}
        <div class="flex justify-center py-20">
          <span class="label-mono text-brand-text-muted">Loading...</span>
        </div>
      {:else if stats}
        <!-- Total views -->
        <div
          class="corner-brackets rounded-lg border border-brand-card-border bg-brand-card p-6"
        >
          <span class="label-mono text-brand-text-muted"
            >Total Views ({days}d)</span
          >
          <p class="mt-2 font-mono text-4xl font-semibold text-brand-text-primary">
            {stats.totalViews.toLocaleString()}
          </p>
        </div>

        <!-- Daily views chart -->
        <div
          class="corner-brackets rounded-lg border border-brand-card-border bg-brand-card p-6"
        >
          <h2 class="label-mono mb-6 text-brand-text-muted">Daily Views</h2>
          <div class="flex items-end gap-1" style="height: 200px;">
            {#each stats.dailyViews as day}
              {@const pct = (day.views / maxViews(stats.dailyViews)) * 100}
              <div
                class="group relative flex flex-1 flex-col items-center justify-end"
                style="height: 100%;"
              >
                <div
                  class="w-full rounded-t bg-brand-accent transition-[height] duration-300"
                  style="height: {Math.max(pct, 2)}%;"
                ></div>
                <span
                  class="mt-2 text-center font-mono text-[10px] text-brand-text-muted"
                >
                  {formatDate(day.date)}
                </span>
                <!-- Tooltip -->
                <span
                  class="pointer-events-none absolute -top-8 rounded bg-brand-black px-2 py-1 font-mono text-xs text-brand-text-primary opacity-0 transition-opacity group-hover:opacity-100"
                >
                  {day.views}
                </span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Traffic sources & Top pages side by side -->
        <div class="grid gap-8 md:grid-cols-2">
          <!-- Traffic sources -->
          <div
            class="corner-brackets rounded-lg border border-brand-card-border bg-brand-card p-6"
          >
            <h2 class="label-mono mb-6 text-brand-text-muted">
              Traffic Sources
            </h2>
            {#if Object.keys(stats.sources).length === 0}
              <p class="body-medium text-brand-text-secondary">No data yet.</p>
            {:else}
              <div class="space-y-3">
                {#each Object.entries(stats.sources).sort((a, b) => b[1] - a[1]) as [source, count]}
                  {@const pct = (
                    (count / totalSourceCount(stats.sources)) *
                    100
                  ).toFixed(1)}
                  <div>
                    <div
                      class="mb-1 flex items-center justify-between font-mono text-sm"
                    >
                      <span class="capitalize text-brand-text-primary">{source}</span>
                      <span class="text-brand-text-secondary"
                        >{count}
                        <span class="text-brand-text-muted">({pct}%)</span
                        ></span
                      >
                    </div>
                    <div
                      class="h-1.5 w-full overflow-hidden rounded-full bg-brand-border"
                    >
                      <div
                        class="h-full rounded-full bg-brand-accent transition-[width] duration-300"
                        style="width: {pct}%;"
                      ></div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>

          <!-- Top pages -->
          <div
            class="corner-brackets rounded-lg border border-brand-card-border bg-brand-card p-6"
          >
            <h2 class="label-mono mb-6 text-brand-text-muted">Top Pages</h2>
            {#if stats.topPages.length === 0}
              <p class="body-medium text-brand-text-secondary">No data yet.</p>
            {:else}
              <div class="space-y-2">
                {#each stats.topPages as pg, i}
                  <div
                    class="flex items-center justify-between rounded px-3 py-2 font-mono text-sm {i %
                      2 ===
                    0
                      ? 'bg-white/2'
                      : ''}"
                  >
                    <span class="truncate text-brand-text-primary" title={pg.path}
                      >{pg.path}</span
                    >
                    <span class="ml-4 shrink-0 text-brand-text-secondary"
                      >{pg.views}</span
                    >
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        {#if error}
          <p class="text-sm text-red-400">{error}</p>
        {/if}
      {/if}
    </div>
  {/if}
</section>
