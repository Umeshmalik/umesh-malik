<script lang="ts">
	import { inview } from 'svelte-inview';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { clipReveal } from '$lib/utils/transitions';

	let hasBeenInView = $state(false);
	let reducedMotion = $state(false);

	const stats = [
		{ value: 4, suffix: '+', label: 'Years Experience' },
		{ value: 3, suffix: '', label: 'Companies' },
		{ value: 10, prefix: '$', suffix: 'M+', label: 'Transactions Processed' },
		{ value: 98, suffix: '+', label: 'Lighthouse Score' },
	];

	let displayValues = $state(stats.map(() => 0));
	let countStarted = $state(false);

	onMount(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reducedMotion) {
			displayValues = stats.map((s) => s.value);
		}
	});

	function countUp(index: number, target: number, duration: number) {
		const start = performance.now();
		function tick(now: number) {
			const elapsed = now - start;
			const progress = Math.min(elapsed / duration, 1);
			// Ease-out cubic deceleration
			const eased = 1 - Math.pow(1 - progress, 3);
			displayValues[index] = Math.round(eased * target);
			if (progress < 1) {
				requestAnimationFrame(tick);
			}
		}
		requestAnimationFrame(tick);
	}

	$effect(() => {
		if (hasBeenInView && !countStarted && !reducedMotion) {
			countStarted = true;
			stats.forEach((stat, i) => {
				countUp(i, stat.value, 1500 + i * 200);
			});
		}
	});
</script>

<section
	class="border-y border-brand-border px-6 py-20 md:py-32 lg:px-12"
	use:inview={{ threshold: 0.3 }}
	oninview_change={(e) => {
		if (e.detail.inView) hasBeenInView = true;
	}}
>
	<div class="mx-auto max-w-[1160px]">
		{#if hasBeenInView}
			<h2
				class="section-title mb-20 text-brand-text-primary"
				in:clipReveal={{ duration: 800 }}
			>
				By the numbers
			</h2>

			<div class="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
				{#each stats as stat, i}
					<div
						class="text-center"
						in:fly={{ y: 30, duration: 600, delay: i * 200 }}
					>
						<p class="font-mono text-4xl font-medium text-brand-accent md:text-5xl lg:text-6xl">
							{stat.prefix ?? ''}{displayValues[i]}{stat.suffix}
						</p>
						<p class="label-mono mt-4 text-brand-text-muted">
							{stat.label}
						</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>
