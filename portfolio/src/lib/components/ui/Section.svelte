<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		id?: string;
		class?: string;
		children: Snippet;
	}

	let { id, class: className = '', children }: Props = $props();
</script>

<section {id} class="px-6 py-20 md:py-32 lg:px-12 {className}">
	<div class="mx-auto max-w-[1160px]">
		{@render children()}
	</div>
</section>
