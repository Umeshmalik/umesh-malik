<script lang="ts">
  import { page } from "$app/state";
  import { siteConfig } from "$lib/config/site";
  import {
    personSchema,
    websiteSchema,
    organizationSchema,
  } from "$lib/utils/schema";

  interface Props {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    imageAlt?: string;
    type?: string;
    publishDate?: string;
    modifiedDate?: string;
    noindex?: boolean;
  }

  let {
    title = "Umesh Malik | Senior Frontend Engineer at Expedia Group",
    description = "Senior Frontend Engineer specializing in React, TypeScript, and modern web architecture. Building scalable systems at Expedia Group. 4+ years experience in fintech, automotive, and travel domains.",
    keywords = "Umesh Malik, Frontend Engineer, React Developer, TypeScript Expert, Senior Software Engineer, Web Developer, Gurugram, India, Expedia Group, SvelteKit, Next.js",
    image = `${siteConfig.url}${siteConfig.ogImage}`,
    imageAlt = "Umesh Malik - Senior Frontend Engineer",
    type = "website",
    publishDate = "",
    modifiedDate = "",
    noindex = false,
  }: Props = $props();

  const canonicalUrl = $derived(page.url.origin + page.url.pathname);
  const currentUrl = $derived(page.url.href);
  const robotsContent = $derived(
    noindex
      ? "noindex, nofollow"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [personSchema, websiteSchema, organizationSchema],
  };
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="title" content={title} />
  <meta name="description" content={description} />
  <meta name="keywords" content={keywords} />
  <meta name="author" content="Umesh Malik" />
  <meta name="robots" content={robotsContent} />
  <meta name="googlebot" content={robotsContent} />
  <link rel="canonical" href={canonicalUrl} />

  <!-- Hreflang (self-referential for single-language site) -->
  <link rel="alternate" hreflang="en" href={canonicalUrl} />
  <link rel="alternate" hreflang="x-default" href={canonicalUrl} />

  <!-- Feed Discovery -->
  <link
    rel="alternate"
    type="application/rss+xml"
    title="Umesh Malik - RSS Feed"
    href="{siteConfig.url}/rss.xml"
  />
  <link
    rel="alternate"
    type="application/rss+xml"
    title="Umesh Malik's Blog - RSS Feed"
    href="{siteConfig.url}/blog-feed.xml"
  />
  <link
    rel="alternate"
    type="application/feed+json"
    title="Umesh Malik's Blog - JSON Feed"
    href="{siteConfig.url}/feed.json"
  />

  <!-- Sitemap Discovery -->
  <link rel="sitemap" type="application/xml" href="{siteConfig.url}/sitemap-index.xml" />

  <!-- Humans & Security -->
  <link rel="author" href="{siteConfig.url}/humans.txt" />

  <!-- Open Graph -->
  <meta property="og:type" content={type} />
  <meta property="og:url" content={currentUrl} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={image} />
  <meta property="og:image:alt" content={imageAlt} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:site_name" content="Umesh Malik" />

  <!-- Article-specific OG tags -->
  {#if type === "article" && publishDate}
    <meta property="article:published_time" content={publishDate} />
    {#if modifiedDate}
      <meta property="article:modified_time" content={modifiedDate} />
    {/if}
    <meta property="article:author" content="{siteConfig.url}/about" />
    <meta property="article:section" content="Technology" />
  {/if}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content={currentUrl} />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={image} />
  <meta name="twitter:image:alt" content={imageAlt} />
  <meta name="twitter:creator" content="@lumeshmalik" />
  <meta name="twitter:site" content="@lumeshmalik" />

  <!-- Geo Targeting -->
  <meta name="geo.region" content="IN-HR" />
  <meta name="geo.placename" content="Gurugram" />

  <!-- Structured Data -->
  {@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
</svelte:head>
