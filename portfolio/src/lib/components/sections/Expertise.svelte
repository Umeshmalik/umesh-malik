<script lang="ts">
  import { inview } from "svelte-inview";
  import { fly } from "svelte/transition";
  import { clipReveal } from "$lib/utils/transitions";

  let hasBeenInView = $state(false);

  const expertise = [
    {
      title: "Architecture & Scalability",
      description:
        "Building software systems that scale with business needs. From component libraries to microfrontend architectures.",
      metric: "Led Vue to React migration -- 3x velocity improvement",
    },
    {
      title: "Performance & Quality",
      description:
        "Writing fast, well-tested code that delivers exceptional user experiences. Deep focus on Core Web Vitals and reliability.",
      metric: "$10M+ monthly transactions with 99.9% uptime",
    },
    {
      title: "Leadership & Mentorship",
      description:
        "Growing teams through code reviews, pair programming, and knowledge sharing. Building engineering culture from the ground up.",
      metric: "Mentored 5+ junior engineers to senior-level contributions",
    },
  ];
</script>

<section
  id="expertise"
  class="relative px-6 py-20 md:py-32 lg:px-12"
  use:inview={{ threshold: 0.2 }}
  oninview_change={(e) => {
    if (e.detail.inView) hasBeenInView = true;
  }}
>
  <div class="pointer-events-none absolute inset-0 gold-glow"></div>

  <div class="relative z-10 mx-auto max-w-[1160px]">
    {#if hasBeenInView}
      <h2
        class="section-title mb-20 text-brand-text-primary"
        in:clipReveal={{ duration: 800 }}
      >
        What I do best
      </h2>

      <div class="grid gap-12 md:grid-cols-3">
        {#each expertise as item, i}
          <div
            class="border-t border-brand-accent pt-8"
            in:fly={{ y: 30, duration: 600, delay: i * 150 }}
          >
            <h3 class="mb-4 text-xl font-medium text-brand-text-primary">{item.title}</h3>
            <p class="body-medium mb-6 text-brand-text-secondary">
              {item.description}
            </p>
            <p class="label-mono text-brand-accent">
              {item.metric}
            </p>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>
