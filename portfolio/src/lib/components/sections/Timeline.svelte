<script lang="ts">
  import { inview } from "svelte-inview";
  import { fly } from "svelte/transition";
  import { experience } from "$lib/data/resume";

  let isInView = $state(false);
</script>

<section
  id="experience"
  class="border-y border-brand-border px-6 py-20 md:py-32 lg:px-12"
  use:inview={{ threshold: 0.1 }}
  oninview_change={(e) => (isInView = e.detail.inView)}
>
  <div class="mx-auto max-w-[1160px]">
    {#if isInView}
      <h2
        class="section-title mb-20 text-white"
        in:fly={{ y: 30, duration: 600 }}
      >
        Experience
      </h2>

      <div class="space-y-12">
        {#each experience as job, i}
          <div
            class="grid gap-4 border-l border-brand-accent pl-8 md:grid-cols-4 md:border-l-0 md:pl-0"
            in:fly={{ y: 30, duration: 600, delay: i * 100 }}
          >
            <div class="md:col-span-1">
              <p class="label-mono text-brand-text-muted">
                {job.period}
              </p>
              <p class="mt-1 text-sm text-brand-text-muted">
                {job.location}
              </p>
            </div>
            <div class="md:col-span-3">
              <h3 class="text-lg font-medium text-white">{job.role}</h3>
              <p class="label-mono mt-1 text-brand-accent">{job.company}</p>
              <p class="body-medium mt-3 text-brand-text-secondary">
                {job.description}
              </p>
              <ul class="mt-4 space-y-2">
                {#each job.highlights as highlight}
                  <li class="text-sm font-light text-brand-text-secondary">
                    <span class="mr-2 text-brand-accent">&bull;</span
                    >{highlight}
                  </li>
                {/each}
              </ul>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>
