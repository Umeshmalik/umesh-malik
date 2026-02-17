<script lang="ts">
  import type { BlogPost } from "$lib/types/blog";

  interface Props {
    posts: BlogPost[];
  }

  let { posts }: Props = $props();
</script>

{#if posts.length > 0}
  <div class="mt-16">
    <h2 class="mb-8 text-2xl font-medium text-white">Related Articles</h2>
    <div class="grid gap-6 md:grid-cols-3">
      {#each posts as post}
        <a
          href="/blog/{post.slug}"
          class="group corner-brackets overflow-hidden border border-brand-card-border bg-brand-card transition-colors hover:border-brand-accent"
        >
          <div class="aspect-video overflow-hidden">
            <img
              src={post.image}
              alt={post.imageAlt || post.title}
              width="400"
              height="225"
              loading="lazy"
              class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div class="p-6">
            <p class="label-mono mb-2 text-brand-accent">{post.category}</p>
            <h3
              class="mb-2 font-medium text-white transition-colors group-hover:text-brand-accent"
            >
              {post.title}
            </h3>
            <p class="body-medium line-clamp-2 text-brand-text-secondary">
              {post.description}
            </p>
          </div>
        </a>
      {/each}
    </div>
  </div>
{/if}
