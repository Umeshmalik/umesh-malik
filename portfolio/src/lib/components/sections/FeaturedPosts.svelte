<script lang="ts">
  import { inview } from "svelte-inview";
  import { fly } from "svelte/transition";
  import type { BlogPost } from "$lib/types/blog";

  interface Props {
    posts: BlogPost[];
  }

  let { posts }: Props = $props();
  let hasBeenInView = $state(false);
</script>

{#if posts.length > 0}
  <section
    class="border-t border-brand-border px-6 py-20 md:py-32 lg:px-12"
    use:inview={{ threshold: 0.2 }}
    oninview_change={(e) => {
      if (e.detail.inView) hasBeenInView = true;
    }}
  >
    <div class="mx-auto max-w-[1160px]">
      {#if hasBeenInView}
        <div class="mb-20 flex items-end justify-between">
          <h2
            class="section-title text-white"
            in:fly={{ y: 30, duration: 600 }}
          >
            Latest articles
          </h2>
          <a
            href="/blog"
            class="label-mono text-brand-text-muted transition-colors hover:text-brand-accent"
            in:fly={{ y: 20, duration: 600, delay: 200 }}
          >
            View all &rarr;
          </a>
        </div>

        <div class="grid gap-8 md:grid-cols-3">
          {#each posts.slice(0, 3) as post, i}
            <a
              href="/blog/{post.slug}"
              class="group corner-brackets overflow-hidden border border-brand-card-border bg-brand-card transition-colors hover:border-brand-accent"
              in:fly={{ y: 30, duration: 600, delay: i * 150 }}
            >
              <article>
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
                  <div class="mb-4 flex items-center gap-3">
                    <span class="label-mono text-brand-accent"
                      >{post.category}</span
                    >
                    <span class="text-brand-text-muted">&bull;</span>
                    <time
                      class="label-mono text-brand-text-muted"
                      datetime={post.publishDate}
                    >
                      {new Date(post.publishDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <h3
                    class="mb-3 text-xl font-medium text-white transition-colors group-hover:text-brand-accent"
                  >
                    {post.title}
                  </h3>
                  <p class="body-medium line-clamp-2 text-brand-text-secondary">
                    {post.description}
                  </p>
                  <span
                    class="label-mono mt-4 inline-block text-brand-text-muted"
                  >
                    {post.readingTime}
                  </span>
                </div>
              </article>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </section>
{/if}
