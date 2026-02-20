<script lang="ts">
	import SEO from '$lib/components/layout/SEO.svelte';
	import { createBreadcrumbSchema } from '$lib/utils/schema';
	import { siteConfig } from '$lib/config/site';
	import { usesCategories } from '$lib/data/uses';
	import { inview } from 'svelte-inview';
	import { fly } from 'svelte/transition';

	const breadcrumbSchema = createBreadcrumbSchema([
		{ name: 'Home', url: siteConfig.url },
		{ name: 'Uses', url: `${siteConfig.url}/uses` }
	]);

	let visibleSections = $state<Record<number, boolean>>({});
</script>

<SEO
	title="My Setup & Tools - Umesh Malik"
	description="The tools, hardware, and software I use daily as a Senior Frontend Engineer. Editor setup, terminal config, browser extensions, and development stack."
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
			<li class="text-brand-text-primary" aria-current="page">Uses</li>
		</ol>
	</nav>

	<h1 class="section-title mb-4 text-brand-text-primary">My Setup & Tools</h1>
	<p class="body-large mb-16 text-brand-text-secondary">
		The hardware, software, and workflows I rely on every day. Updated periodically as things
		change.
	</p>

	<div class="space-y-16">
		{#each usesCategories as category, catIndex}
			<div
				use:inview={{ threshold: 0.15 }}
				oninview_change={(e) => {
					if (e.detail.inView) visibleSections[catIndex] = true;
				}}
			>
				{#if visibleSections[catIndex]}
					<h2
						class="mb-8 border-t border-brand-accent pt-4 text-2xl font-medium text-brand-text-primary"
						in:fly={{ y: 30, duration: 600 }}
					>
						{category.name}
					</h2>
					<div class="grid gap-6 md:grid-cols-2">
						{#each category.items as item, i}
							<div
								class="corner-brackets border border-brand-card-border bg-brand-card p-6"
								in:fly={{ y: 30, duration: 600, delay: i * 100 }}
							>
								<h3 class="mb-2 text-lg font-medium text-brand-text-primary">
									{#if item.url}
										<a
											href={item.url}
											target="_blank"
											rel="noopener noreferrer"
											class="transition-colors hover:text-brand-accent"
										>
											{item.name}
											<span class="text-brand-text-muted" aria-hidden="true">↗</span>
										</a>
									{:else}
										{item.name}
									{/if}
								</h3>
								<p class="body-medium text-brand-text-secondary">
									{item.description}
								</p>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<p class="label-mono mt-16 text-brand-text-muted">
		Last updated: February 2026
	</p>
</section>
