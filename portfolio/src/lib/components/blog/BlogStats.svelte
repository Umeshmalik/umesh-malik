<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  interface Props {
    path: string;
  }

  let { path }: Props = $props();

  const GLYPHS = "0123456789#@$%&*!?";
  const SCRAMBLE_DURATION = 500;
  const SCRAMBLE_FPS = 24;
  const LIVE_REFRESH = 10_000;

  let readingNow = $state(0);
  let totalReads = $state(0);
  let readingDisplay = $state("--");
  let readsDisplay = $state("--");
  let loaded = $state(false);

  let rafReading: number | null = null;
  let rafReads: number | null = null;

  function randomChar(): string {
    return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  }

  function scrambleTo(
    target: string,
    setDisplay: (v: string) => void,
    rafRef: { id: number | null },
  ): void {
    if (rafRef.id !== null) cancelAnimationFrame(rafRef.id);

    const start = performance.now();
    const frameInterval = 1000 / SCRAMBLE_FPS;
    let lastFrame = 0;

    function tick(now: number): void {
      if (now - lastFrame < frameInterval) {
        rafRef.id = requestAnimationFrame(tick);
        return;
      }
      lastFrame = now;

      const progress = Math.min((now - start) / SCRAMBLE_DURATION, 1);
      const resolved = Math.floor(progress * target.length);

      setDisplay(
        target.slice(0, resolved) +
          Array.from({ length: target.length - resolved }, randomChar).join(""),
      );

      if (progress < 1) {
        rafRef.id = requestAnimationFrame(tick);
      } else {
        rafRef.id = null;
      }
    }

    rafRef.id = requestAnimationFrame(tick);
  }

  const rafReadingRef = { get id() { return rafReading; }, set id(v) { rafReading = v; } };
  const rafReadsRef = { get id() { return rafReads; }, set id(v) { rafReads = v; } };

  async function fetchLiveReaders(): Promise<void> {
    try {
      const res = await fetch(
        `/api/analytics/live?path=${encodeURIComponent(path)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      const newCount = data.count as number;
      if (newCount !== readingNow) {
        readingNow = newCount;
        scrambleTo(String(readingNow), (v) => (readingDisplay = v), rafReadingRef);
      }
    } catch {
      // silent
    }
  }

  async function fetchTotalReads(): Promise<void> {
    try {
      const res = await fetch(
        `/api/analytics/reads?path=${encodeURIComponent(path)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      const newCount = data.count as number;
      if (newCount !== totalReads) {
        totalReads = newCount;
        scrambleTo(
          totalReads.toLocaleString(),
          (v) => (readsDisplay = v),
          rafReadsRef,
        );
      }
    } catch {
      // silent
    }
  }

  onMount(() => {
    if (!browser) return;

    Promise.all([fetchLiveReaders(), fetchTotalReads()]).then(() => {
      loaded = true;
    });

    const interval = setInterval(fetchLiveReaders, LIVE_REFRESH);

    return () => {
      clearInterval(interval);
      if (rafReading !== null) cancelAnimationFrame(rafReading);
      if (rafReads !== null) cancelAnimationFrame(rafReads);
    };
  });
</script>

{#if loaded}
  <div class="flex items-center gap-4 text-brand-text-secondary">
    <!-- Live reading now -->
    <span class="flex items-center gap-1.5">
      <span
        class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"
        aria-hidden="true"
      ></span>
      <span class="font-mono text-sm">
        <span class="text-white">{readingDisplay}</span> reading now
      </span>
    </span>

    <span class="text-brand-text-muted">&bull;</span>

    <!-- Total reads -->
    <span class="font-mono text-sm">
      <span class="text-white">{readsDisplay}</span> total reads
    </span>
  </div>
{/if}
