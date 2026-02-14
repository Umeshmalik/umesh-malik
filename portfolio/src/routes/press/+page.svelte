<script lang="ts">
  import SEO from "$lib/components/layout/SEO.svelte";
  import { createBreadcrumbSchema } from "$lib/utils/schema";

  const blogHighlights = [
    {
      title: "TypeScript Utility Types: A Complete Guide",
      url: "/blog/typescript-utility-types-complete-guide",
      year: "2024",
      description:
        "Comprehensive walkthrough of TypeScript utility types with real-world examples",
    },
    {
      title: "React Performance Optimization: 10 Proven Techniques",
      url: "/blog/react-performance-optimization-techniques",
      year: "2024",
      description:
        "Battle-tested optimization strategies from enterprise React applications",
    },
    {
      title: "Frontend Testing Strategies That Actually Work in 2025",
      url: "/blog/frontend-testing-strategies-2025",
      year: "2025",
      description:
        "Pragmatic guide to the testing trophy model for frontend teams",
    },
    {
      title: "Frontend Career Growth: From Junior to Senior Engineer",
      url: "/blog/frontend-career-growth-junior-to-senior",
      year: "2026",
      description:
        "Lessons from Associate Engineer to SDE-2 across three companies",
    },
  ];

  const profiles = [
    {
      title: "Umesh Malik - Professional Profile",
      outlet: "LinkedIn",
      url: "https://linkedin.com/in/umesh-malik",
      description: "Professional background, career updates, and networking",
    },
    {
      title: "Umesh Malik - Open Source",
      outlet: "GitHub",
      url: "https://github.com/Umeshmalik",
      description: "Open-source contributions, side projects, and code samples",
    },
    {
      title: "@lumeshmalik",
      outlet: "Twitter",
      url: "https://twitter.com/umeshmalik",
      description:
        "Frontend tips, tech opinions, and occasional threads on web architecture",
    },
  ];

  const community = [
    {
      title: "Vue.js to React Migration at Enterprise Scale",
      type: "Internal Tech Talk",
      context: "Expedia Group",
      year: "2024",
      description:
        "Presented migration strategy and lessons learned from converting a large Vue.js codebase to React",
    },
    {
      title: "Building Accessible Frontend Applications",
      type: "Knowledge Sharing Session",
      context: "Tekion Corp",
      year: "2023",
      description:
        "Led a session on WCAG compliance patterns and testing strategies for the frontend team",
    },
  ];

  const openSource = [
    {
      title: "Developer Portfolio (SvelteKit)",
      url: "https://github.com/Umeshmalik",
      year: "2025",
      description:
        "Open-source portfolio built with SvelteKit, Svelte 5, TailwindCSS 4, and MDsveX with AI-optimized SEO",
    },
  ];

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://umesh-malik.com" },
    { name: "Writing & Appearances", url: "https://umesh-malik.com/press" },
  ]);
</script>

<SEO
  title="Writing & Appearances - Umesh Malik"
  description="Blog highlights, professional profiles, speaking engagements, and open-source work by Umesh Malik, Senior Frontend Engineer at Expedia Group."
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
      <li class="text-white" aria-current="page">Writing & Appearances</li>
    </ol>
  </nav>

  <h1 class="section-title mb-10 text-white">Writing & Appearances</h1>

  <!-- Blog Highlights -->
  <div class="mb-16">
    <h2
      class="mb-8 border-t border-brand-accent pt-4 text-2xl font-medium text-white"
    >
      Blog Highlights
    </h2>
    <div class="space-y-6">
      {#each blogHighlights as post}
        <article class="border-b border-brand-border pb-6">
          <div class="mb-1 flex items-center gap-3">
            <h3 class="text-xl font-medium text-white">
              <a
                href={post.url}
                class="transition-colors hover:text-brand-accent"
              >
                {post.title}
              </a>
            </h3>
            <span class="label-mono text-brand-text-muted">{post.year}</span>
          </div>
          <p class="body-medium text-brand-text-secondary">
            {post.description}
          </p>
        </article>
      {/each}
    </div>
  </div>

  <!-- Professional Profiles -->
  <div class="mb-16">
    <h2
      class="mb-8 border-t border-brand-accent pt-4 text-2xl font-medium text-white"
    >
      Professional Profiles
    </h2>
    <div class="space-y-6">
      {#each profiles as profile}
        <article class="border-b border-brand-border pb-6">
          <h3 class="mb-2 text-xl font-medium text-white">
            <a
              href={profile.url}
              class="transition-colors hover:text-brand-accent"
              target="_blank"
              rel="noopener noreferrer"
            >
              {profile.title}
              <span class="text-brand-text-muted">↗</span>
            </a>
          </h3>
          <p class="label-mono mb-2 text-brand-accent">{profile.outlet}</p>
          <p class="body-medium text-brand-text-secondary">
            {profile.description}
          </p>
        </article>
      {/each}
    </div>
  </div>

  <!-- Speaking & Community -->
  <div class="mb-16">
    <h2
      class="mb-8 border-t border-brand-accent pt-4 text-2xl font-medium text-white"
    >
      Speaking & Community
    </h2>
    <div class="space-y-6">
      {#each community as item}
        <article class="border-b border-brand-border pb-6">
          <div class="mb-1 flex items-center gap-3">
            <h3 class="text-xl font-medium text-white">{item.title}</h3>
            <span class="label-mono text-brand-text-muted">{item.year}</span>
          </div>
          <p class="label-mono mb-2 text-brand-accent">
            {item.type} — {item.context}
          </p>
          <p class="body-medium text-brand-text-secondary">
            {item.description}
          </p>
        </article>
      {/each}
    </div>
  </div>

  <!-- Open Source -->
  <div class="mb-16">
    <h2
      class="mb-8 border-t border-brand-accent pt-4 text-2xl font-medium text-white"
    >
      Open Source
    </h2>
    <div class="space-y-6">
      {#each openSource as project}
        <article class="border-b border-brand-border pb-6">
          <div class="mb-1 flex items-center gap-3">
            <h3 class="text-xl font-medium text-white">
              <a
                href={project.url}
                class="transition-colors hover:text-brand-accent"
                target="_blank"
                rel="noopener noreferrer"
              >
                {project.title}
                <span class="text-brand-text-muted">↗</span>
              </a>
            </h3>
            <span class="label-mono text-brand-text-muted">{project.year}</span>
          </div>
          <p class="body-medium text-brand-text-secondary">
            {project.description}
          </p>
        </article>
      {/each}
    </div>
  </div>

  <div
    class="corner-brackets border border-brand-card-border bg-brand-card p-8"
  >
    <h2 class="mb-4 text-xl font-medium text-white">Media Inquiries</h2>
    <p class="body-medium mb-4 text-brand-text-secondary">
      For interviews, speaking engagements, or media requests, please get in
      touch:
    </p>
    <p class="font-medium text-white">
      <a href="/contact" class="text-brand-accent hover:underline"
        >Contact page</a
      >
      or email
      <a
        href="mailto:lucky.umeshmalik@gmail.com"
        class="text-brand-accent hover:underline"
      >
        lucky.umeshmalik@gmail.com
      </a>
    </p>
  </div>
</section>
