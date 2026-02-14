<script lang="ts">
	import { onMount } from 'svelte';

	let progress = $state(0);

	onMount(() => {
		const handleScroll = () => {
			const windowHeight = window.innerHeight;
			const documentHeight = document.documentElement.scrollHeight;
			const scrollTop = window.scrollY;
			const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
			progress = Math.min(scrollPercentage, 100);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});
</script>

<div
	class="fixed top-0 right-0 left-0 z-50 h-[2px] bg-[var(--color-brand-accent)] transition-all"
	style="width: {progress}%"
></div>
