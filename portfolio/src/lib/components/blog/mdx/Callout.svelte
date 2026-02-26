<script lang="ts">
	interface Props {
		title?: string;
		tone?: 'info' | 'success' | 'warning';
		children?: import('svelte').Snippet;
	}

	let { title = 'Note', tone = 'info', children }: Props = $props();

	const toneClasses = {
		info: 'border-brand-accent/60 bg-brand-card',
		success: 'border-emerald-400/60 bg-emerald-950/20',
		warning: 'border-amber-400/60 bg-amber-950/20'
	} as const;
</script>

<aside class={`my-8 rounded-sm border p-4 md:p-5 ${toneClasses[tone]}`}>
	<p class="label-mono mb-2 text-sm text-brand-accent">{title}</p>
	<div class="body-medium text-brand-text-secondary">
		{@render children?.()}
	</div>
</aside>
