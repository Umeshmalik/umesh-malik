<script lang="ts">
  import { onMount } from "svelte";
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

  <div class="relative z-10 mx-auto w-full max-w-[1160px] hero-stagger" class:mounted>
    <p
      class="label-mono mb-8 text-brand-accent hero-item"
    >
      Senior Frontend Engineer
    </p>
    <h1
      class="hero-headline mb-10 text-brand-text-primary hero-item"
    >
      I build scalable<br class="hidden md:block" />
      software <span class="text-brand-accent">systems</span>.
    </h1>
    <p
      class="body-large mb-14 max-w-2xl text-brand-text-secondary hero-item"
    >
      From $10M payment systems to enterprise workflow platforms — I build
      software systems that handle real-world scale at
      <span class="text-brand-text-primary">Expedia Group</span>.
    </p>
    <div
      class="flex flex-wrap gap-4 hero-item"
    >
      <Button variant="primary" size="lg" href="/resume">View Resume</Button>
      <Button variant="secondary" size="lg" href="/projects">
        View Work
      </Button>
    </div>
  </div>
</section>
