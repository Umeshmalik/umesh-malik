<script lang="ts">
  interface TagCount {
    name: string;
    slug: string;
    count: number;
  }

  interface Props {
    tags: TagCount[];
  }

  let { tags }: Props = $props();
</script>

{#if tags.length > 0}
  <div class="mt-12">
    <h2 class="mb-6 text-2xl font-medium text-white">Explore Topics</h2>
    <div class="flex flex-wrap gap-2">
      {#each tags as tag}
        <a
          href="/blog/tag/{tag.slug}"
          class="border border-brand-border bg-brand-surface px-3 py-1 font-mono text-xs uppercase tracking-wider text-brand-text-secondary transition-colors hover:border-brand-accent hover:text-brand-accent"
        >
          #{tag.name}
          <span class="ml-1 text-brand-text-muted">({tag.count})</span>
        </a>
      {/each}
    </div>
  </div>
{/if}
