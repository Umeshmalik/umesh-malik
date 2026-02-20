<script lang="ts">
  import { inview } from "svelte-inview";
  import { fly } from "svelte/transition";
  import { skillCategories } from "$lib/data/skills";
  import { clipReveal } from "$lib/utils/transitions";

  let hasBeenInView = $state(false);
</script>

<section
  id="skills"
  class="border-y border-brand-border px-6 py-20 md:py-32 lg:px-12"
  use:inview={{ threshold: 0.2 }}
  oninview_change={(e) => { if (e.detail.inView) hasBeenInView = true; }}
>
  <div class="mx-auto max-w-[1160px]">
    {#if hasBeenInView}
      <h2
        class="section-title mb-20 text-brand-text-primary"
        in:clipReveal={{ duration: 800 }}
      >
        Technical skills
      </h2>

      <div class="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
        {#each skillCategories as category, i}
          <div in:fly={{ y: 30, duration: 600, delay: i * 100 }}>
            <h3 class="label-mono mb-5 text-brand-text-muted">
              {category.name}
            </h3>
            <div class="flex flex-wrap gap-2">
              {#each category.skills as skill}
                <span
                  class="border border-brand-border bg-brand-card px-3 py-2 text-sm font-light text-brand-text-secondary"
                >
                  {skill}
                </span>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>
