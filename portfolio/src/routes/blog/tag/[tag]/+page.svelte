<script lang="ts">
  import type { PageData } from "./$types";
  import SEO from "$lib/components/layout/SEO.svelte";
  import BlogCard from "$lib/components/blog/BlogCard.svelte";
  import { createBreadcrumbSchema } from "$lib/utils/schema";
  import { slugify } from "$lib/utils/blog";
  import { siteConfig } from "$lib/config/site";

  let { data }: { data: PageData } = $props();

  const breadcrumbSchema = $derived(
    createBreadcrumbSchema([
      { name: "Home", url: siteConfig.url },
      { name: "Blog", url: `${siteConfig.url}/blog` },
      {
        name: data.tag,
        url: `${siteConfig.url}/blog/tag/${slugify(data.tag)}`,
      },
    ]),
  );

  const collectionSchema = $derived({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Articles tagged "${data.tag}"`,
    description: `Explore articles tagged with "${data.tag}" by Umesh Malik, Senior Engineer at Expedia Group. Learn {data.tag} best practices, practical tips, and in-depth guides.`,
    url: `${siteConfig.url}/blog/tag/${slugify(data.tag)}`,
    isPartOf: {
      "@type": "Blog",
      name: "Umesh Malik's Blog",
      url: `${siteConfig.url}/blog`,
    },
    author: {
      "@type": "Person",
      name: "Umesh Malik",
      "@id": `${siteConfig.url}/#person`,
    },
  });
</script>

<SEO
  title="Umesh Malik's Blog - {data.tag} Articles | {data.tag} Tutorials"
  description="Explore articles tagged with {data.tag} by Umesh Malik, Senior Engineer at Expedia Group. Learn {data.tag} best practices, practical tips, and in-depth guides."
  keywords="{data.tag}, {data.tag} tutorials, {data.tag} best practices, Umesh Malik blog, {data.tag} guides"
/>

<svelte:head>
  {@html `<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(collectionSchema)}</script>`}
</svelte:head>

<section class="mx-auto max-w-[1160px] px-6 pt-32 pb-20 lg:px-12">
  <!-- Breadcrumb Navigation -->
  <nav aria-label="Breadcrumb" class="mb-8">
    <ol class="flex flex-wrap items-center gap-1 text-sm text-brand-text-muted">
      <li>
        <a href="/" class="transition-colors hover:text-brand-accent">Home</a>
      </li>
      <li class="mx-1">/</li>
      <li>
        <a href="/blog" class="transition-colors hover:text-brand-accent"
          >Blog</a
        >
      </li>
      <li class="mx-1">/</li>
      <li class="text-white" aria-current="page">{data.tag}</li>
    </ol>
  </nav>

  <div class="mb-16">
    <a
      href="/blog"
      class="label-mono mb-4 inline-block text-brand-text-muted transition-colors hover:text-brand-accent"
      >&larr; Back to Blog</a
    >
    <h1 class="section-title text-white">{data.tag}</h1>
    <p class="body-large mt-4 text-brand-text-secondary">
      {data.posts.length} article{data.posts.length !== 1 ? "s" : ""}
    </p>
  </div>

  {#if data.posts.length > 0}
    <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {#each data.posts as post}
        <BlogCard {post} />
      {/each}
    </div>
  {:else}
    <p class="text-brand-text-muted">No articles with this tag yet.</p>
  {/if}
</section>
