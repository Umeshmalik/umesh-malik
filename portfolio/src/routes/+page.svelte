<script lang="ts">
  import SEO from "$lib/components/layout/SEO.svelte";
  import Hero from "$lib/components/sections/Hero.svelte";
  import TrustedBy from "$lib/components/sections/TrustedBy.svelte";
  import Expertise from "$lib/components/sections/Expertise.svelte";
  import Skills from "$lib/components/sections/Skills.svelte";
  import Projects from "$lib/components/sections/Projects.svelte";
  import Timeline from "$lib/components/sections/Timeline.svelte";
  // import Testimonials from '$lib/components/sections/Testimonials.svelte';
  import CTA from "$lib/components/sections/CTA.svelte";
  import FeaturedPosts from "$lib/components/sections/FeaturedPosts.svelte";
  import { siteNavigationSchema } from "$lib/utils/schema";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const navSchema = {
    "@context": "https://schema.org",
    ...siteNavigationSchema,
  };
</script>

<SEO />

<svelte:head>
  {@html `<script type="application/ld+json">${JSON.stringify(navSchema)}</script>`}
</svelte:head>

<Hero />
<TrustedBy />
<Expertise />
<Projects />
<Skills />
<Timeline />
<!-- <Testimonials /> -->
<FeaturedPosts posts={data.featuredPosts} />
<CTA />
