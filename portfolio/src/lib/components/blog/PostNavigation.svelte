<script lang="ts">
  import type { BlogPost } from "$lib/types/blog";

  interface Props {
    prevPost: BlogPost | null;
    nextPost: BlogPost | null;
  }

  let { prevPost, nextPost }: Props = $props();
</script>

{#if prevPost || nextPost}
  <nav aria-label="Post navigation" class="mt-12">
    <h2 class="mb-6 text-2xl font-medium text-brand-text-primary">Continue Reading</h2>
    <div class="grid gap-6 md:grid-cols-2">
      {#if nextPost}
        <a
          href="/blog/{nextPost.slug}"
          class="group corner-brackets border border-brand-card-border bg-brand-card p-6 transition-colors hover:border-brand-accent"
        >
          <p class="label-mono mb-2 text-brand-text-muted">Older</p>
          <h3 class="font-medium text-brand-text-primary transition-colors group-hover:text-brand-accent">
            {nextPost.title}
          </h3>
        </a>
      {:else}
        <div></div>
      {/if}
      {#if prevPost}
        <a
          href="/blog/{prevPost.slug}"
          class="group corner-brackets border border-brand-card-border bg-brand-card p-6 text-right transition-colors hover:border-brand-accent"
        >
          <p class="label-mono mb-2 text-brand-text-muted">Newer</p>
          <h3 class="font-medium text-brand-text-primary transition-colors group-hover:text-brand-accent">
            {prevPost.title}
          </h3>
        </a>
      {:else}
        <div></div>
      {/if}
    </div>
  </nav>
{/if}
