<script lang="ts">
  import { inview } from "svelte-inview";
  import { fly } from "svelte/transition";
  import { testimonials } from "$lib/data/testimonials";

  let isInView = $state(false);
</script>

<section
  class="relative px-6 py-20 md:py-32 lg:px-12"
  use:inview={{ threshold: 0.2 }}
  oninview_change={(e) => (isInView = e.detail.inView)}
>
  <div class="pointer-events-none absolute inset-0 gold-glow"></div>

  <div class="relative z-10 mx-auto max-w-[1160px]">
    {#if isInView}
      <h2
        class="section-title mb-20 text-white"
        in:fly={{ y: 30, duration: 600 }}
      >
        What people say
      </h2>

      <div class="grid gap-8 md:grid-cols-3">
        {#each testimonials as testimonial, i}
          <blockquote
            class="corner-brackets border border-brand-card-border bg-brand-card p-8"
            in:fly={{ y: 30, duration: 600, delay: i * 150 }}
          >
            <p
              class="mb-6 font-light leading-relaxed text-brand-text-secondary italic"
            >
              &ldquo;{testimonial.quote}&rdquo;
            </p>
            <footer>
              <p class="font-medium text-white">{testimonial.author}</p>
              <p class="label-mono mt-1 text-brand-text-muted">
                {testimonial.role}
              </p>
            </footer>
          </blockquote>
        {/each}
      </div>
    {/if}
  </div>
</section>
