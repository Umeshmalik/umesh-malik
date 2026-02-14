<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    href?: string;
    children: Snippet;
  }

  let { href, children }: Props = $props();
</script>

{#if href}
  <a
    {href}
    class="inline-block border border-brand-border bg-brand-surface px-3 py-1 font-mono text-xs uppercase tracking-wider text-brand-text-secondary transition-colors hover:border-brand-accent hover:text-brand-accent"
  >
    {@render children()}
  </a>
{:else}
  <span
    class="inline-block border border-brand-border bg-brand-surface px-3 py-1 font-mono text-xs uppercase tracking-wider text-brand-text-secondary"
  >
    {@render children()}
  </span>
{/if}
