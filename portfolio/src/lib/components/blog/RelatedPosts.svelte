<script lang="ts">
  import type { BlogPost } from "$lib/types/blog";

  interface Props {
    posts: BlogPost[];
  }

  let { posts }: Props = $props();
</script>

{#if posts.length > 0}
  <div class="mt-16">
    <h3 class="mb-8 text-2xl font-medium text-white">Related Articles</h3>
    <div class="grid gap-6 md:grid-cols-3">
      {#each posts as post}
        <a
          href="/blog/{post.slug}"
          class="group corner-brackets border border-brand-card-border bg-brand-card p-6 transition-colors hover:border-brand-accent"
        >
          <p class="label-mono mb-2 text-brand-accent">{post.category}</p>
          <h4
            class="mb-2 font-medium text-white transition-colors group-hover:text-brand-accent"
          >
            {post.title}
          </h4>
          <p class="body-medium line-clamp-2 text-brand-text-secondary">
            {post.description}
          </p>
        </a>
      {/each}
    </div>
  </div>
{/if}
