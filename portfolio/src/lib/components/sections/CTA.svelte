<script lang="ts">
  import { inview } from "svelte-inview";
  import { fly } from "svelte/transition";
  import Button from "$lib/components/ui/Button.svelte";
  import { clipReveal } from "$lib/utils/transitions";

  let hasBeenInView = $state(false);
</script>

<section
  class="relative border-t border-brand-border px-6 py-20 md:py-32 lg:px-12"
  use:inview={{ threshold: 0.3 }}
  oninview_change={(e) => {
    if (e.detail.inView) hasBeenInView = true;
  }}
>
  <div class="pointer-events-none absolute inset-0 gold-glow"></div>

  <div class="relative z-10 mx-auto max-w-[1160px] text-center">
    {#if hasBeenInView}
      <h2
        class="section-title mb-8 text-brand-text-primary"
        in:clipReveal={{ duration: 800 }}
      >
        Let's build something <span class="text-brand-accent">great</span>
      </h2>
      <p
        class="body-large mx-auto mb-12 max-w-xl text-brand-text-secondary"
        in:fly={{ y: 30, duration: 600, delay: 150 }}
      >
        I'm always interested in discussing software development, new
        opportunities, or interesting projects. Let's connect.
      </p>
      <div
        class="flex flex-wrap justify-center gap-4"
        in:fly={{ y: 30, duration: 600, delay: 300 }}
      >
        <Button variant="primary" size="lg" href="mailto:ask@umesh-malik.com">
          Get in Touch
        </Button>
        <Button
          variant="secondary"
          size="lg"
          href="https://linkedin.com/in/umesh-malik"
        >
          LinkedIn
        </Button>
      </div>
    {/if}
  </div>
</section>
