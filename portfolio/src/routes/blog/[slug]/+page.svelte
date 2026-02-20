<script lang="ts">
  import type { PageData } from "./$types";
  import SEO from "$lib/components/layout/SEO.svelte";
  import ShareButtons from "$lib/components/blog/ShareButtons.svelte";
  import RelatedPosts from "$lib/components/blog/RelatedPosts.svelte";
  import PostNavigation from "$lib/components/blog/PostNavigation.svelte";
  import ExploreTags from "$lib/components/blog/ExploreTags.svelte";
  import ReadingProgress from "$lib/components/blog/ReadingProgress.svelte";
  import BlogStats from "$lib/components/blog/BlogStats.svelte";
  import TableOfContents from "$lib/components/blog/TableOfContents.svelte";
  import ScrollToTop from "$lib/components/blog/ScrollToTop.svelte";
  import Tag from "$lib/components/ui/Tag.svelte";
  import {
    createArticleSchema,
    createBreadcrumbSchema,
  } from "$lib/utils/schema";
  import { slugify } from "$lib/utils/blog";
  import { siteConfig } from "$lib/config/site";

  let { data }: { data: PageData } = $props();

  const articleSchema = $derived(
    createArticleSchema({
      title: data.post.title,
      description: data.post.description,
      slug: data.post.slug,
      publishDate: data.post.publishDate,
      updatedDate: data.post.updatedDate,
      keywords: data.post.keywords,
      category: data.post.category,
      tags: data.post.tags,
      image: data.post.image,
      imageAlt: data.post.imageAlt,
      readingTime: data.post.readingTime,
    }),
  );

  const breadcrumbSchema = $derived(
    createBreadcrumbSchema([
      { name: "Home", url: siteConfig.url },
      { name: "Blog", url: `${siteConfig.url}/blog` },
      {
        name: data.post.category,
        url: `${siteConfig.url}/blog/category/${slugify(data.post.category)}`,
      },
      {
        name: data.post.title,
        url: `${siteConfig.url}/blog/${data.post.slug}`,
      },
    ]),
  );

  const PostContent = $derived(data.post.content);
</script>

<SEO
  title="{data.post.title} | Umesh Malik"
  description={data.post.description}
  keywords={data.post.keywords}
  image={data.post.image}
  imageAlt={data.post.imageAlt || data.post.title}
  type="article"
  publishDate={data.post.publishDate}
  modifiedDate={data.post.updatedDate || data.post.publishDate}
/>

<svelte:head>
  {@html `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`}
</svelte:head>

<ReadingProgress />

<article class="mx-auto max-w-[1160px] px-6 pt-32 pb-20 lg:px-12">
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
      <li>
        <a
          href="/blog/category/{slugify(data.post.category)}"
          class="transition-colors hover:text-brand-accent"
        >
          {data.post.category}
        </a>
      </li>
      <li class="mx-1">/</li>
      <li class="text-brand-text-primary" aria-current="page">{data.post.title}</li>
    </ol>
  </nav>

  <header class="mb-12">
    <div class="mb-6">
      <a
        href="/blog/category/{slugify(data.post.category)}"
        class="label-mono text-brand-accent hover:underline"
      >
        {data.post.category}
      </a>
    </div>

    <h1 class="mb-6 text-4xl font-medium leading-tight text-brand-text-primary md:text-5xl">
      {data.post.title}
    </h1>

    <div class="mb-6 flex items-center gap-4 text-brand-text-secondary">
      <time datetime={data.post.publishDate}>
        {new Date(data.post.publishDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </time>
      <span class="text-brand-text-muted">&bull;</span>
      <span>{data.post.readingTime}</span>
    </div>

    <div class="flex flex-wrap gap-2">
      {#each data.post.tags as tag}
        <Tag href="/blog/tag/{slugify(tag)}">#{tag}</Tag>
      {/each}
    </div>

    <div class="mt-6">
      <BlogStats path="/blog/{data.post.slug}" />
    </div>
  </header>

  {#key data.post.slug}
    <TableOfContents headings={data.post.headings ?? []} />
  {/key}

  <div class="prose prose-lg max-w-none mb-12">
    {#if PostContent}
      <PostContent />
    {/if}
  </div>

  <ShareButtons
    title={data.post.title}
    url="{siteConfig.url}/blog/{data.post.slug}"
  />

  <!-- Author Bio -->
  <div
    class="corner-brackets mt-12 border border-brand-card-border bg-brand-card p-8"
  >
    <div>
      <h2 class="mb-1 text-lg font-medium text-brand-text-primary">
        Written by Umesh Malik
      </h2>
      <p class="body-medium mb-3 text-brand-text-secondary">
        Senior Frontend Engineer at Expedia Group. Passionate about React,
        TypeScript, and building scalable web applications.
      </p>
      <div class="flex gap-3">
        <a
          href="https://x.com/lumeshmalik"
          class="label-mono text-brand-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer">X</a
        >
        <a
          href="https://linkedin.com/in/umesh-malik"
          class="label-mono text-brand-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer">LinkedIn</a
        >
        <a
          href="https://github.com/Umeshmalik"
          class="label-mono text-brand-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer">GitHub</a
        >
      </div>
    </div>
  </div>

  {#if data.relatedPosts.length > 0}
    <RelatedPosts posts={data.relatedPosts} />
  {/if}

  <ExploreTags tags={data.tagCounts} />

  <PostNavigation prevPost={data.prevPost} nextPost={data.nextPost} />
</article>

<ScrollToTop />
