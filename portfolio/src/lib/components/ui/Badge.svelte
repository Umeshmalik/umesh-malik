<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<span
  class="inline-block border border-brand-border bg-brand-surface px-3 py-1 font-mono text-xs uppercase tracking-wider text-brand-text-secondary"
>
  {@render children()}
</span>
