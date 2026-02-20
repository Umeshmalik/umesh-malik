<script lang="ts">
  import type { PageData } from "./$types";
  import SEO from "$lib/components/layout/SEO.svelte";
  import BlogCard from "$lib/components/blog/BlogCard.svelte";
  import Tag from "$lib/components/ui/Tag.svelte";
  import { slugify } from "$lib/utils/blog";
  import { siteConfig } from "$lib/config/site";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  let { data }: { data: PageData } = $props();

  let readCounts = $state<Record<string, number>>({});

  const blogListSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Umesh Malik's Blog",
    description:
      "Articles about JavaScript, TypeScript, React, SvelteKit, software development, and web performance by Umesh Malik",
    url: `${siteConfig.url}/blog`,
    author: {
      "@type": "Person",
      name: "Umesh Malik",
      url: siteConfig.url,
    },
  };

  onMount(() => {
    if (!browser) return;
    const allPosts = [...data.featuredPosts, ...data.posts];
    const paths = allPosts.map((p) => `/blog/${p.slug}`);
    if (paths.length === 0) return;

    fetch("/api/analytics/reads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.counts) readCounts = json.counts;
      })
      .catch(() => {});
  });
</script>

<SEO
  title="Blog - JavaScript, TypeScript & Software Development | Umesh Malik"
  description="Read articles about JavaScript, TypeScript, React, SvelteKit, software architecture, and web performance. Written by Umesh Malik, Software Engineer at Expedia Group."
  keywords="JavaScript blog, TypeScript tutorials, React best practices, SvelteKit guides, software development, web performance, Umesh Malik blog"
/>

<svelte:head>
  {@html `<script type="application/ld+json">${JSON.stringify(blogListSchema)}</script>`}
</svelte:head>

<section class="mx-auto max-w-[1160px] px-6 pt-32 pb-20 lg:px-12">
  <div class="mb-20 max-w-3xl">
    <h1 class="section-title mb-8 text-white">Blog</h1>
    <p class="body-large text-brand-text-secondary">
      Deep dives into JavaScript, TypeScript, React, SvelteKit, and modern
      software development. Practical tutorials, architecture patterns, and
      performance optimization.
    </p>
  </div>

  <!-- Categories -->
  {#if data.categories.length > 0}
    <div class="mb-12">
      <h2 class="label-mono mb-5 text-brand-text-muted">Categories</h2>
      <div class="flex flex-wrap gap-3">
        {#each data.categories as category}
          <Tag href="/blog/category/{category.slug}">
            {category.name} ({category.count})
          </Tag>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Featured Posts -->
  {#if data.featuredPosts.length > 0}
    <div class="mb-20">
      <h2 class="mb-10 text-2xl font-medium text-white">Featured Articles</h2>
      <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {#each data.featuredPosts as post}
          <BlogCard {post} featured={true} readCount={readCounts[`/blog/${post.slug}`]} />
        {/each}
      </div>
    </div>
  {/if}

  <!-- All Posts -->
  {#if data.posts.length > 0}
    <div>
      <h2 class="mb-10 text-2xl font-medium text-white">All Articles</h2>
      <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {#each data.posts as post}
          <BlogCard {post} readCount={readCounts[`/blog/${post.slug}`]} />
        {/each}
      </div>
    </div>
  {:else}
    <div class="py-20 text-center">
      <p class="body-large text-brand-text-muted">
        Blog posts coming soon. Stay tuned!
      </p>
    </div>
  {/if}

  <!-- Tags -->
  {#if data.tags.length > 0}
    <div class="mt-20">
      <h2 class="label-mono mb-5 text-brand-text-muted">Popular Tags</h2>
      <div class="flex flex-wrap gap-2">
        {#each data.tags as tag}
          <Tag href="/blog/tag/{slugify(tag)}">{tag}</Tag>
        {/each}
      </div>
    </div>
  {/if}
</section>
