<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<!-- Skip to content link for accessibility & SEO -->
<a
	href="#main-content"
	class="fixed top-0 left-0 z-[100] -translate-y-full bg-[var(--color-brand-accent)] px-4 py-2 text-sm font-medium text-black transition-transform focus:translate-y-0"
>
	Skip to main content
</a>

<Header />
<main id="main-content" class="min-h-screen">
	{@render children()}
</main>
<Footer />
