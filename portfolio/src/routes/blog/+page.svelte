<script lang="ts">
  import type { PageData } from "./$types";
  import SEO from "$lib/components/layout/SEO.svelte";
  import BlogCard from "$lib/components/blog/BlogCard.svelte";
  import Tag from "$lib/components/ui/Tag.svelte";
  import { slugify } from "$lib/utils/blog";
  import { siteConfig } from "$lib/config/site";
  import { onMount } from "svelte";
  import { browser, dev } from "$app/environment";
  import { inview } from "svelte-inview";
  import { fly } from "svelte/transition";

  let { data }: { data: PageData } = $props();

  let readCounts = $state<Record<string, number>>({});
  let featuredVisible = $state(false);
  let allVisible = $state(false);
  let tagsVisible = $state(false);

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
    if (!browser || dev) return;
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
    <h1 class="section-title mb-8 text-brand-text-primary">Blog</h1>
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
    <div
      class="mb-20"
      use:inview={{ threshold: 0.1 }}
      oninview_change={(e) => { if (e.detail.inView) featuredVisible = true; }}
    >
      <h2 class="mb-10 text-2xl font-medium text-brand-text-primary">Featured Articles</h2>
      {#if featuredVisible}
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {#each data.featuredPosts as post, i}
            <div in:fly={{ y: 30, duration: 500, delay: i * 100 }}>
              <BlogCard {post} featured={true} readCount={readCounts[`/blog/${post.slug}`]} />
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- All Posts -->
  {#if data.posts.length > 0}
    <div
      use:inview={{ threshold: 0.05 }}
      oninview_change={(e) => { if (e.detail.inView) allVisible = true; }}
    >
      <h2 class="mb-10 text-2xl font-medium text-brand-text-primary">All Articles</h2>
      {#if allVisible}
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {#each data.posts as post, i}
            <div in:fly={{ y: 30, duration: 500, delay: Math.min(i * 80, 400) }}>
              <BlogCard {post} readCount={readCounts[`/blog/${post.slug}`]} />
            </div>
          {/each}
        </div>
      {/if}
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
    <div
      class="mt-20"
      use:inview={{ threshold: 0.2 }}
      oninview_change={(e) => { if (e.detail.inView) tagsVisible = true; }}
    >
      {#if tagsVisible}
        <h2 class="label-mono mb-5 text-brand-text-muted" in:fly={{ y: 20, duration: 500 }}>Popular Tags</h2>
        <div class="flex flex-wrap gap-2">
          {#each data.tags as tag, i}
            <span in:fly={{ y: 15, duration: 400, delay: Math.min(i * 30, 300) }}>
              <Tag href="/blog/tag/{slugify(tag)}">{tag}</Tag>
            </span>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</section>
