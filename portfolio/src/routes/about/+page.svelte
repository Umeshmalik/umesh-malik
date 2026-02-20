<script lang="ts">
  import SEO from "$lib/components/layout/SEO.svelte";
  import {
    personSchema,
    createBreadcrumbSchema,
    createProfilePageSchema,
  } from "$lib/utils/schema";
  import { siteConfig } from "$lib/config/site";

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: siteConfig.url },
    { name: "About", url: `${siteConfig.url}/about` },
  ]);

  const profileSchema = createProfilePageSchema();
</script>

<SEO
  title="About Umesh Malik - Software Engineer"
  description="Learn about Umesh Malik's journey as a Software Engineer. 4+ years experience building scalable software applications at Expedia Group, Tekion, and BYJU'S."
/>

<svelte:head>
  {@html `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", ...personSchema })}</script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(profileSchema)}</script>`}
</svelte:head>

<article class="mx-auto max-w-[1160px] px-6 pt-32 pb-20 lg:px-12">
  <!-- Breadcrumb Navigation -->
  <nav aria-label="Breadcrumb" class="mb-8">
    <ol class="flex flex-wrap items-center gap-1 text-sm text-brand-text-muted">
      <li>
        <a href="/" class="transition-colors hover:text-brand-accent">Home</a>
      </li>
      <li class="mx-1">/</li>
      <li class="text-brand-text-primary" aria-current="page">About</li>
    </ol>
  </nav>

  <h1 class="section-title mb-10 text-brand-text-primary">About Umesh Malik</h1>

  <div class="prose prose-lg max-w-none">
    <h2>Who I Am</h2>
    <p>
      I'm <strong>Umesh Malik</strong>, a Senior Frontend Engineer based in
      <strong>Gurugram, Haryana, India</strong>. I specialize in building
      scalable, high-performance web applications with a focus on React,
      TypeScript, and modern web architecture.
    </p>

    <h2>My Journey</h2>
    <p>
      My professional journey started in July 2021 when I joined BYJU'S (Think &
      Learn Pvt. Ltd.) as an Associate Software Engineer. Within just 6 months,
      I was promoted to Module Lead, where I led the development of critical
      payment systems processing over $10 million in monthly transactions.
    </p>
    <p>
      In April 2023, I joined Tekion Corp as a Software Engineer, where I
      rebuilt the Finance & Insurance module serving thousands of automotive
      dealerships. This role deepened my expertise in building accessible,
      internationalized applications.
    </p>
    <p>
      Currently, I serve as a Software Development Engineer 2 at Expedia Group,
      where I'm a core member of the Workflow Orchestration Platform team. I
      recently led a major migration from Vue.js to React, improving developer
      velocity by 3x and establishing new standards for component architecture.
    </p>

    <h2>What Drives Me</h2>
    <ul>
      <li>
        <strong>Building Scalable Systems:</strong> Creating software architectures
        that can handle millions of users and evolve with business needs
      </li>
      <li>
        <strong>Performance & Quality:</strong> Writing fast, maintainable, well-tested
        code that delivers exceptional user experiences
      </li>
      <li>
        <strong>Mentorship:</strong> Sharing knowledge and helping junior engineers
        grow into confident developers
      </li>
    </ul>

    <h2>Beyond Code</h2>
    <p>
      When I'm not coding, you'll find me exploring new software frameworks,
      contributing to open-source projects, or experimenting with AI-assisted
      development tools like Claude and Cursor AI.
    </p>

    <h2>Currently</h2>
    <ul>
      <li>
        <strong>Working on:</strong> Workflow Orchestration Platform at Expedia Group
        — building visual editors and reusable software libraries
      </li>
      <li>
        <strong>Learning:</strong> Svelte 5 runes, advanced TypeScript patterns,
        and system design at scale
      </li>
      <li>
        <strong>Reading:</strong> "Designing Data-Intensive Applications" by Martin
        Kleppmann
      </li>
      <li>
        <strong>Side project:</strong> This portfolio — built with SvelteKit, TailwindCSS
        4, and MDsveX
      </li>
      <li>
        <strong>Exploring:</strong> AI-assisted development workflows with Claude
        and Cursor AI
      </li>
    </ul>

    <h2>Fun Facts</h2>
    <ul>
      <li>
        Promoted from Associate Engineer to Module Lead in just 8 months at
        BYJU'S — one of the fastest promotions in the team's history
      </li>
      <li>
        Consistently hit 95+ Lighthouse scores across production applications
      </li>
      <li>
        Worked across 3 industries in 4 years: fintech (BYJU'S), automotive
        (Tekion), and travel (Expedia)
      </li>
      <li>
        Built payment systems that processed over $10 million monthly with zero
        critical incidents over 12 months
      </li>
      <li>
        This portfolio scores 98+ on Lighthouse and is fully optimized for AI
        search engines with structured data, llms.txt, and RSS feeds
      </li>
    </ul>

    <h2>Let's Connect</h2>
    <p>
      I'm always interested in connecting with fellow engineers, discussing
      software architecture, or exploring new opportunities. Reach out via
      <a href="mailto:ask@umesh-malik.com">email</a> or connect with me on
      <a
        href="https://linkedin.com/in/umesh-malik"
        target="_blank"
        rel="noopener noreferrer">LinkedIn</a
      >.
    </p>
  </div>
</article>
