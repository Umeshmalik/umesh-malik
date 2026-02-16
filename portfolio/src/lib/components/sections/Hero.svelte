<script lang="ts">
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import Button from "$lib/components/ui/Button.svelte";

  let mounted = $state(false);

  onMount(() => {
    mounted = true;
  });
</script>

<section
  class="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-24 lg:px-12"
>
  <!-- Subtle gold radial glow -->
  <div class="pointer-events-none absolute inset-0 gold-glow"></div>

  <div class="relative z-10 mx-auto w-full max-w-[1160px]">
    {#if mounted}
      <p
        class="label-mono mb-8 text-brand-accent"
        in:fly={{ y: 20, duration: 600, delay: 0 }}
      >
        Senior Frontend Engineer
      </p>
      <h1
        class="hero-headline mb-10 text-white"
        in:fly={{ y: 30, duration: 600, delay: 50 }}
      >
        I build scalable<br class="hidden md:block" />
        software <span class="text-brand-accent">systems</span>.
      </h1>
      <p
        class="body-large mb-14 max-w-2xl text-brand-text-secondary"
        in:fly={{ y: 30, duration: 600, delay: 100 }}
      >
        From $10M payment systems to enterprise workflow platforms — I build
        software systems that handle real-world scale at
        <span class="text-white">Expedia Group</span>.
      </p>
      <div
        class="flex flex-wrap gap-4"
        in:fly={{ y: 30, duration: 600, delay: 150 }}
      >
        <Button variant="primary" size="lg" href="/resume">View Resume</Button>
        <Button variant="secondary" size="lg" href="#projects">
          View Work
        </Button>
      </div>
    {/if}
  </div>
</section>
