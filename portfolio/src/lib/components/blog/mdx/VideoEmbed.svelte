<script lang="ts">
	interface Props {
		src: string;
		title: string;
		caption?: string;
	}

	let { src, title, caption }: Props = $props();
</script>

<figure class="corner-brackets my-8 overflow-hidden rounded-sm border border-brand-card-border bg-brand-card p-3 md:p-4">
	<div class="overflow-hidden rounded-sm border border-brand-card-border/70">
		<div class="relative w-full pt-[56.25%]">
			<iframe
				class="absolute inset-0 h-full w-full"
				src={src}
				title={title}
				frameborder="0"
				allowfullscreen
				loading="lazy"
				referrerpolicy="strict-origin-when-cross-origin"
			></iframe>
		</div>
	</div>

	{#if caption}
		<figcaption class="label-mono mt-3 text-brand-text-secondary">{caption}</figcaption>
	{/if}
</figure>
