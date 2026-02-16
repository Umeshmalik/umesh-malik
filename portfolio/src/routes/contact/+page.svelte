<script lang="ts">
  import SEO from "$lib/components/layout/SEO.svelte";
  import {
    createBreadcrumbSchema,
    createContactPageSchema,
  } from "$lib/utils/schema";
  import { contactChannels } from "$lib/data/contact";

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://umesh-malik.com" },
    { name: "Contact", url: "https://umesh-malik.com/contact" },
  ]);

  const contactPageSchema = createContactPageSchema();
</script>

<SEO
  title="Get in Touch - Umesh Malik"
  description="Contact Umesh Malik for professional inquiries, technical collaborations, speaking engagements, or open-source projects. Available via email, LinkedIn, GitHub, and X."
/>

<svelte:head>
  {@html `<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(contactPageSchema)}</script>`}
</svelte:head>

<section class="mx-auto max-w-[1160px] px-6 pt-32 pb-20 lg:px-12">
  <!-- Breadcrumb Navigation -->
  <nav aria-label="Breadcrumb" class="mb-8">
    <ol class="flex flex-wrap items-center gap-1 text-sm text-brand-text-muted">
      <li>
        <a href="/" class="transition-colors hover:text-brand-accent">Home</a>
      </li>
      <li class="mx-1">/</li>
      <li class="text-white" aria-current="page">Contact</li>
    </ol>
  </nav>

  <h1 class="section-title mb-4 text-white">Get in Touch</h1>
  <p class="body-large mb-16 text-brand-text-secondary">
    Whether it's a professional inquiry, open-source collaboration, or just a
    conversation about software architecture — I'd like to hear from you.
  </p>

  <div class="grid gap-6 md:grid-cols-2">
    {#each contactChannels as channel}
      <a
        href={channel.href}
        target={channel.label === "Email" ? undefined : "_blank"}
        rel={channel.label === "Email" ? undefined : "noopener noreferrer"}
        class="corner-brackets block border border-brand-card-border bg-brand-card p-8 transition-colors hover:border-brand-accent {channel.primary
          ? 'border-brand-accent'
          : ''}"
      >
        <div class="mb-1 flex items-center gap-3">
          <h3 class="text-xl font-medium text-white">{channel.label}</h3>
          {#if channel.primary}
            <span
              class="label-mono rounded bg-brand-accent/10 px-2 py-0.5 text-brand-accent"
            >
              Primary
            </span>
          {/if}
        </div>
        <p class="label-mono mb-3 text-brand-accent">{channel.value}</p>
        <p class="body-medium text-brand-text-secondary">
          {channel.description}
        </p>
      </a>
    {/each}
  </div>

  <!-- Response Time -->
  <div class="mt-16 border-b border-brand-border pb-8">
    <h2 class="mb-4 text-2xl font-medium text-white">Response Time</h2>
    <p class="body-medium text-brand-text-secondary">
      I check email daily on weekdays and aim to respond within 24-48 hours.
      LinkedIn messages may take a bit longer. For time-sensitive matters, email
      is the most reliable channel.
    </p>
  </div>

  <!-- Currently -->
  <div class="mt-8">
    <h2 class="mb-4 text-2xl font-medium text-white">Currently</h2>
    <div class="body-medium space-y-3 text-brand-text-secondary">
      <p>
        <span class="text-white">Open to:</span> Technical discussions, speaking
        opportunities, open-source collaboration, mentoring conversations, freelance/contract
        work
      </p>
      <p>
        <span class="text-white">Not available for:</span> Full-time role changes
      </p>
      <p>
        <span class="text-white">Location:</span> Based in Gurugram, India (IST /
        UTC+5:30)
      </p>
    </div>
  </div>
</section>
