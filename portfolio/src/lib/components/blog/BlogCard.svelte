<script lang="ts">
  import type { BlogPost } from "$lib/types/blog";

  interface Props {
    post: BlogPost;
    featured?: boolean;
    readCount?: number;
  }

  let { post, featured = false, readCount }: Props = $props();
</script>

<article class="group">
  <a
    href="/blog/{post.slug}"
    class="corner-brackets block overflow-hidden border border-brand-card-border bg-brand-card transition-[color,border-color,transform,box-shadow] duration-300 hover:border-brand-accent hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(192,158,90,0.08)]"
  >
    <div class="aspect-video overflow-hidden">
      <img
        src={post.image}
        alt={post.imageAlt || post.title}
        width="600"
        height="338"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
    <div class="space-y-3 p-6">
      <div class="flex items-center gap-3">
        <span class="label-mono text-brand-accent">{post.category}</span>
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
        class="font-medium text-brand-text-primary transition-colors group-hover:text-brand-accent {featured
          ? 'text-2xl'
          : 'text-xl'}"
      >
        {post.title}
      </h3>

      <p class="body-medium line-clamp-3 text-brand-text-secondary">
        {post.description}
      </p>

      <div class="flex items-center justify-between pt-2">
        <div class="flex items-center gap-3">
          <span class="label-mono text-brand-text-muted">{post.readingTime}</span>
          {#if readCount !== undefined && readCount > 0}
            <span class="label-mono text-brand-text-muted">
              &bull; {readCount.toLocaleString()} reads
            </span>
          {/if}
        </div>
        <span class="label-mono text-brand-accent group-hover:underline">
          Read more &rarr;
        </span>
      </div>
    </div>
  </a>
</article>
