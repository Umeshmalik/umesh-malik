<script lang="ts">
  import { inview } from "svelte-inview";
  import { fly } from "svelte/transition";
  import { projects } from "$lib/data/projects";
  import Badge from "$lib/components/ui/Badge.svelte";

  let hasBeenInView = $state(false);

  const featuredProjects = projects.filter((p) => p.featured);
</script>

<section
  id="projects"
  class="relative px-6 py-20 md:py-32 lg:px-12"
  use:inview={{ threshold: 0.2 }}
  oninview_change={(e) => { if (e.detail.inView) hasBeenInView = true; }}
>
  <div class="pointer-events-none absolute inset-0 gold-glow"></div>

  <div class="relative z-10 mx-auto max-w-[1160px]">
    {#if hasBeenInView}
      <div class="mb-20 flex items-end justify-between">
        <h2 class="section-title text-brand-text-primary" in:fly={{ y: 30, duration: 600 }}>
          Selected work
        </h2>
        <a
          href="/projects"
          class="label-mono hidden text-brand-text-muted transition-colors hover:text-brand-accent md:block"
          in:fly={{ y: 20, duration: 600, delay: 200 }}
        >
          View all projects &rarr;
        </a>
      </div>

      <div class="space-y-16">
        {#each featuredProjects as project, i}
          <article
            class="corner-brackets grid items-start gap-8 border-t border-brand-border bg-brand-card p-8 md:grid-cols-3"
            in:fly={{ y: 30, duration: 600, delay: i * 150 }}
          >
            <div class="md:col-span-1">
              <p class="label-mono text-brand-text-muted">
                {project.company}
              </p>
              <h3 class="mt-3 text-2xl font-medium text-brand-text-primary">
                {project.title}
              </h3>
            </div>
            <div class="md:col-span-2">
              <p class="body-medium mb-4 text-brand-text-secondary">
                {project.description}
              </p>
              <p class="label-mono mb-4 text-brand-accent">{project.impact}</p>
              <div class="flex flex-wrap gap-2">
                {#each project.tech as tech}
                  <Badge>{tech}</Badge>
                {/each}
              </div>
            </div>
          </article>
        {/each}
      </div>

      <a
        href="/projects"
        class="label-mono mt-8 block text-center text-brand-text-muted transition-colors hover:text-brand-accent md:hidden"
      >
        View all projects &rarr;
      </a>
    {/if}
  </div>
</section>
