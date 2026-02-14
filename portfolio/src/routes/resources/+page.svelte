<script lang="ts">
	import SEO from '$lib/components/layout/SEO.svelte';
	import { createBreadcrumbSchema } from '$lib/utils/schema';
	import { resources, codeSnippets, resourceCategories } from '$lib/data/resources';

	const breadcrumbSchema = createBreadcrumbSchema([
		{ name: 'Home', url: 'https://umesh-malik.com' },
		{ name: 'Resources', url: 'https://umesh-malik.com/resources' }
	]);

	let activeCategory = $state('All');

	const filteredResources = $derived(
		activeCategory === 'All'
			? resources
			: resources.filter((r) => r.category === activeCategory)
	);
</script>

<SEO
	title="Resources & Snippets - Umesh Malik"
	description="Curated collection of frontend development resources, tools, libraries, blogs, podcasts, and reusable code snippets that I use and recommend."
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
			<li class="text-white" aria-current="page">Resources</li>
		</ol>
	</nav>

	<h1 class="section-title mb-4 text-white">Resources & Snippets</h1>
	<p class="body-large mb-12 text-brand-text-secondary">
		Tools, libraries, blogs, and code snippets I find useful. A living collection that grows as I
		discover new things.
	</p>

	<!-- Category Filters -->
	<div class="mb-12 flex flex-wrap gap-3">
		{#each resourceCategories as category}
			<button
				type="button"
				aria-pressed={activeCategory === category}
				class="label-mono rounded border px-4 py-2 transition-colors {activeCategory ===
				category
					? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
					: 'border-brand-border text-brand-text-muted hover:border-brand-accent hover:text-brand-accent'}"
				onclick={() => (activeCategory = category)}
			>
				{category}
			</button>
		{/each}
	</div>

	<!-- Resources Grid -->
	<h2 class="sr-only">Resources</h2>
	<div class="mb-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each filteredResources as resource}
			<a
				href={resource.url}
				target="_blank"
				rel="noopener noreferrer"
				class="corner-brackets block border border-brand-card-border bg-brand-card p-6 transition-colors hover:border-brand-accent"
			>
				<h3 class="mb-2 text-lg font-medium text-white">
					{resource.name}
					<span class="text-brand-text-muted">↗</span>
				</h3>
				<p class="body-medium mb-4 text-brand-text-secondary">
					{resource.description}
				</p>
				<div class="flex flex-wrap gap-2">
					{#each resource.tags as tag}
						<span
							class="label-mono rounded bg-brand-surface px-2 py-0.5 text-brand-text-muted"
						>
							{tag}
						</span>
					{/each}
				</div>
			</a>
		{/each}
	</div>

	<!-- Code Snippets Section -->
	<div>
		<h2 class="mb-4 border-t border-brand-accent pt-4 text-2xl font-medium text-white">
			Code Snippets
		</h2>
		<p class="body-large mb-10 text-brand-text-secondary">
			Reusable patterns I reach for frequently. Copy, adapt, and use in your own projects.
		</p>

		<div class="space-y-10">
			{#each codeSnippets as snippet}
				<div class="border border-brand-card-border bg-brand-card p-6">
					<h3 class="mb-1 text-lg font-medium text-white">{snippet.title}</h3>
					<p class="body-medium mb-4 text-brand-text-secondary">
						{snippet.description}
					</p>
					<pre
						class="overflow-x-auto rounded bg-[rgba(43,43,43,0.5)] p-4 text-sm leading-relaxed text-brand-text-secondary"><code
							>{snippet.code}</code
						></pre>
				</div>
			{/each}
		</div>
	</div>
</section>
