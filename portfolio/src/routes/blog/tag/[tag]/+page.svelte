<script lang="ts">
  import type { PageData } from "./$types";
  import SEO from "$lib/components/layout/SEO.svelte";
  import BlogCard from "$lib/components/blog/BlogCard.svelte";
  import { createBreadcrumbSchema } from "$lib/utils/schema";

  let { data }: { data: PageData } = $props();

  const breadcrumbSchema = $derived(
    createBreadcrumbSchema([
      { name: "Home", url: "https://umesh-malik.com" },
      { name: "Blog", url: "https://umesh-malik.com/blog" },
      {
        name: data.tag,
        url: `https://umesh-malik.com/blog/tag/${data.tag.toLowerCase()}`,
      },
    ]),
  );

  const collectionSchema = $derived({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Articles tagged "${data.tag}"`,
    description: `Browse articles tagged with "${data.tag}" by Umesh Malik. Tutorials, guides, and insights on ${data.tag} for frontend developers.`,
    url: `https://umesh-malik.com/blog/tag/${data.tag.toLowerCase()}`,
    isPartOf: {
      "@type": "Blog",
      name: "Umesh Malik's Blog",
      url: "https://umesh-malik.com/blog",
    },
    author: {
      "@type": "Person",
      name: "Umesh Malik",
      "@id": "https://umesh-malik.com/#person",
    },
  });
</script>

<SEO
  title="{data.tag} Articles - Frontend Development Blog | Umesh Malik"
  description="Browse articles tagged with {data.tag} by Umesh Malik, Senior Frontend Engineer at Expedia Group. Tutorials, guides, and practical insights."
  keywords="{data.tag}, {data.tag} tutorials, frontend development, Umesh Malik blog"
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
