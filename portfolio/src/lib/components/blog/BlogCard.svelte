<script lang="ts">
  import type { BlogPost } from "$lib/types/blog";

  interface Props {
    post: BlogPost;
    featured?: boolean;
  }

  let { post, featured = false }: Props = $props();
</script>

<article class="group">
  <a
    href="/blog/{post.slug}"
    class="corner-brackets block border border-brand-card-border bg-brand-card p-8 transition-colors hover:border-brand-accent"
  >
    <div class="space-y-3">
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
        class="font-medium text-white transition-colors group-hover:text-brand-accent {featured
          ? 'text-2xl'
          : 'text-xl'}"
      >
        {post.title}
      </h3>

      <p class="body-medium line-clamp-3 text-brand-text-secondary">
        {post.description}
      </p>

      <div class="flex items-center justify-between pt-2">
        <span class="label-mono text-brand-text-muted">{post.readingTime}</span>
        <span class="label-mono text-brand-accent group-hover:underline">
          Read more &rarr;
        </span>
      </div>
    </div>
  </a>
</article>
