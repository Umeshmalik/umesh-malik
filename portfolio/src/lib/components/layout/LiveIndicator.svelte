<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  const REFRESH_INTERVAL = 10_000;
  const GLYPHS = "0123456789#@$%&*!?+=";
  const SCRAMBLE_DURATION = 600;
  const SCRAMBLE_FPS = 24;

  let liveCount = $state(0);
  let displayText = $state("---");
  let visible = $state(false);
  let rafId: number | null = null;

  function randomChar(): string {
    return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  }

  function scrambleTo(target: string): void {
    if (rafId !== null) cancelAnimationFrame(rafId);

    const start = performance.now();
    const frameInterval = 1000 / SCRAMBLE_FPS;
    let lastFrame = 0;

    function tick(now: number): void {
      if (now - lastFrame < frameInterval) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      lastFrame = now;

      const progress = Math.min((now - start) / SCRAMBLE_DURATION, 1);
      const resolved = Math.floor(progress * target.length);

      displayText =
        target.slice(0, resolved) +
        Array.from({ length: target.length - resolved }, randomChar).join("");

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  async function fetchLive(): Promise<void> {
    try {
      const res = await fetch("/api/analytics/live");
      if (!res.ok) return;
      const data = await res.json();
      const newCount = data.count as number;
      if (newCount !== liveCount) {
        liveCount = newCount;
        scrambleTo(`${liveCount} online`);
      }
      visible = true;
    } catch {
      // Silently fail — no analytics API in dev is fine
    }
  }

  onMount(() => {
    if (!browser) return;
    fetchLive();
    const interval = setInterval(fetchLive, REFRESH_INTERVAL);
    return () => {
      clearInterval(interval);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  });
</script>

{#if visible}
  <div
    class="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-brand-card-border bg-brand-card/90 px-4 py-2 shadow-lg backdrop-blur-sm"
    aria-live="polite"
  >
    <span
      class="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500"
      aria-hidden="true"
    ></span>
    <span class="font-mono text-xs tracking-wider text-brand-text-secondary">
      {displayText}
    </span>
  </div>
{/if}
