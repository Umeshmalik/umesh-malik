<script lang="ts">
  import Tag from "$lib/components/ui/Tag.svelte";

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
    <h2 class="mb-6 text-2xl font-medium text-brand-text-primary">Explore Topics</h2>
    <div class="flex flex-wrap gap-2">
      {#each tags as tag}
        <Tag href="/blog/tag/{tag.slug}">
          #{tag.name}
          <span class="ml-1 text-brand-text-muted">({tag.count})</span>
        </Tag>
      {/each}
    </div>
  </div>
{/if}
