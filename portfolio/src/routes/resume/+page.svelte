<script lang="ts">
  import SEO from "$lib/components/layout/SEO.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import { experience, education } from "$lib/data/resume";
  import { skillCategories } from "$lib/data/skills";
  import { createBreadcrumbSchema } from "$lib/utils/schema";
  import { siteConfig } from "$lib/config/site";

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: siteConfig.url },
    { name: "Resume", url: `${siteConfig.url}/resume` },
  ]);
</script>

<SEO
  title="Resume - Umesh Malik | Senior Frontend Engineer"
  description="View Umesh Malik's professional resume. 4+ years of software engineering experience at Expedia Group, Tekion Corp, and BYJU'S with expertise in React and TypeScript."
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
      <li class="text-white" aria-current="page">Resume</li>
    </ol>
  </nav>

  <div class="mb-12 flex items-start justify-between">
    <div>
      <h1 class="section-title mb-4 text-white">Umesh Malik</h1>
      <p class="body-large text-brand-text-secondary">
        Senior Frontend Engineer
      </p>
      <p class="mt-1 text-sm text-brand-text-muted">Gurugram, Haryana, India</p>
    </div>
  </div>

  <!-- Contact -->
  <div class="mb-12 flex flex-wrap gap-4 text-sm text-brand-text-secondary">
    <a
      href="mailto:ask@umesh-malik.com"
      class="transition-colors hover:text-brand-accent">ask@umesh-malik.com</a
    >
    <span class="text-brand-border">|</span>
    <a
      href="https://linkedin.com/in/umesh-malik"
      target="_blank"
      rel="noopener noreferrer"
      class="transition-colors hover:text-brand-accent">LinkedIn</a
    >
    <span class="text-brand-border">|</span>
    <a
      href="https://github.com/Umeshmalik"
      target="_blank"
      rel="noopener noreferrer"
      class="transition-colors hover:text-brand-accent">GitHub</a
    >
  </div>

  <!-- Experience -->
  <section class="mb-16">
    <h2
      class="mb-10 border-b border-brand-accent pb-3 text-2xl font-medium text-white"
    >
      Experience
    </h2>
    <div class="space-y-10">
      {#each experience as job}
        <div class="border-l-2 border-brand-accent pl-6">
          <h3 class="text-lg font-medium text-white">{job.role}</h3>
          <p class="label-mono mt-1 text-brand-accent">{job.company}</p>
          <p class="mt-2 text-sm text-brand-text-muted">{job.period}</p>
          <p class="text-sm text-brand-text-muted">{job.location}</p>
          <ul class="mt-4 space-y-2">
            {#each job.highlights as highlight}
              <li class="text-sm font-light text-brand-text-secondary">
                <span class="mr-2 text-brand-accent">&bull;</span>{highlight}
              </li>
            {/each}
          </ul>
          <div class="mt-4 flex flex-wrap gap-2">
            {#each job.tech as tech}
              <Badge>{tech}</Badge>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Education -->
  <section class="mb-16">
    <h2
      class="mb-10 border-b border-brand-accent pb-3 text-2xl font-medium text-white"
    >
      Education
    </h2>
    <div class="space-y-6">
      {#each education as edu}
        <div class="border-l-2 border-brand-accent pl-6">
          <h3 class="font-medium text-white">{edu.degree}</h3>
          <p class="label-mono mt-1 text-brand-accent">{edu.field}</p>
          <p class="mt-2 text-sm text-brand-text-secondary">
            {edu.institution}
          </p>
          <p class="mt-1 text-sm text-brand-text-muted">{edu.period}</p>
        </div>
      {/each}
    </div>
  </section>

  <!-- Skills -->
  <section>
    <h2
      class="mb-10 border-b border-brand-accent pb-3 text-2xl font-medium text-white"
    >
      Skills
    </h2>
    <div class="space-y-6">
      {#each skillCategories as category}
        <div>
          <h3 class="label-mono mb-3 text-brand-text-muted">
            {category.name}
          </h3>
          <div class="flex flex-wrap gap-2">
            {#each category.skills as skill}
              <Badge>{skill}</Badge>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </section>
</section>
