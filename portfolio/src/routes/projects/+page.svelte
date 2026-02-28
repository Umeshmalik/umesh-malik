<script lang="ts">
  import SEO from "$lib/components/layout/SEO.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import { projects } from "$lib/data/projects";
  import { createBreadcrumbSchema } from "$lib/utils/schema";
  import { siteConfig } from "$lib/config/site";
  import { tilt } from "$lib/utils/tilt";

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: siteConfig.url },
    { name: "Projects", url: `${siteConfig.url}/projects` },
  ]);
</script>

<SEO
  title="Projects - Umesh Malik | Software Engineering Work"
  description="Explore Umesh Malik's engineering projects including enterprise workflow platforms, finance modules, and payment systems built with React and TypeScript."
/>

<svelte:head>
  {@html `<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`}
</svelte:head>

<section class="mx-auto max-w-[1160px] px-6 pt-32 pb-20 lg:px-12">
  <!-- Breadcrumb Navigation -->
  <nav aria-label="Breadcrumb" class="mb-8">
    <ol class="flex flex-wrap items-center gap-1 text-sm text-brand-text-muted">
      <li>
        <a href="/" class="transition-colors hover:text-brand-accent">Home</a>
      </li>
      <li class="mx-1">/</li>
      <li class="text-brand-text-primary" aria-current="page">Projects</li>
    </ol>
  </nav>

  <h1 class="section-title mb-8 text-brand-text-primary">Projects</h1>
  <p class="body-large mb-20 max-w-2xl text-brand-text-secondary">
    A selection of projects I've built across fintech, automotive, and travel
    domains.
  </p>

  <div class="space-y-16">
    {#each projects as project}
      <article
        class="corner-brackets grid gap-8 border-t border-brand-border bg-brand-card p-8 md:grid-cols-3"
        use:tilt
      >
        <div class="md:col-span-1">
          <p class="label-mono text-brand-text-muted">
            {project.company}
          </p>
          <h2 class="mt-3 text-2xl font-medium text-brand-text-primary">
            {project.title}
          </h2>
          {#if project.featured}
            <span
              class="label-mono mt-3 inline-block border border-brand-accent px-2 py-1 text-brand-accent"
            >
              Featured
            </span>
          {/if}
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
          {#if project.href}
            <a
              href={project.href}
              class="label-mono mt-4 inline-flex items-center gap-1 border border-brand-accent px-3 py-1.5 text-brand-accent transition-colors hover:bg-brand-accent hover:text-brand-text-secondary"
            >
              View Live Demo &rarr;
            </a>
          {/if}
        </div>
      </article>
    {/each}
  </div>
</section>
