<script lang="ts">
  import "../app.css";
  import Header from "$lib/components/layout/Header.svelte";
  import Footer from "$lib/components/layout/Footer.svelte";
  import Analytics from "$lib/components/layout/Analytics.svelte";
  import LiveIndicator from "$lib/components/layout/LiveIndicator.svelte";
  import { onNavigate, beforeNavigate } from "$app/navigation";
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  // Track navigation direction for slide animations
  beforeNavigate(({ type }) => {
    const dir = type === "popstate" ? "back" : "forward";
    document.documentElement.dataset.navDirection = dir;
  });

  // Wrap client-side navigations in a View Transition
  onNavigate((navigation) => {
    if (!document.startViewTransition) return;

    // Skip slide animation when navigating to the same page
    const from = navigation.from?.url.pathname;
    const to = navigation.to?.url.pathname;
    if (from === to) return;

    return new Promise((resolve) => {
      document.documentElement.dataset.transition = "page";

      const transition = document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });

      transition.finished.then(() => {
        delete document.documentElement.dataset.transition;
        delete document.documentElement.dataset.navDirection;
      });
    });
  });
</script>

<!-- Skip to content link for accessibility & SEO -->
<a
  href="#main-content"
  class="fixed top-0 left-0 z-100 -translate-y-full bg-brand-accent px-4 py-2 text-sm font-medium text-brand-black transition-transform focus:translate-y-0"
>
  Skip to main content
</a>

<Header />
<main id="main-content" class="min-h-screen">
  {@render children()}
</main>
<Footer />
<Analytics />
<LiveIndicator />
