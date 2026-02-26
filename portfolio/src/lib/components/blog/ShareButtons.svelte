<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";

  interface Props {
    title: string;
    url: string;
    description?: string;
    tags?: string[];
  }

  let { title, url, description = "", tags = [] }: Props = $props();

  const xUrl = $derived(
    `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  );

  /** Build a pre-formatted LinkedIn post from the article metadata. */
  const linkedinPostText = $derived.by(() => {
    const cleanDescription = description.replace(/\s+/g, " ").trim();
    const hashtags = tags
      .slice(0, 5)
      .map((t) => `#${t.replace(/[^a-zA-Z0-9]/g, "")}`)
      .join(" ");

    const highlights = tags
      .slice(0, 3)
      .map((t) => `- ${t}`)
      .join("\n");

    const parts = [
      `New post: ${title}`,
      cleanDescription
        ? `\n${cleanDescription}`
        : "\nI shared practical lessons, mistakes to avoid, and a production-ready approach.",
    ];

    if (highlights) {
      parts.push(`\nWhat you'll find inside:\n${highlights}`);
    }

    parts.push("\nCurious how you'd approach this. Drop your take in the comments.");
    parts.push(`\nRead the full post:\n${url}`);
    if (hashtags) parts.push(`\n${hashtags}`);
    return parts.join("\n");
  });

  const linkedinUrl = $derived(
    `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(linkedinPostText)}`,
  );

  let copied = $state(false);
  let showPreview = $state(false);

  function copyLinkedinPost() {
    navigator.clipboard.writeText(linkedinPostText);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<div class="border-y border-brand-border py-6">
  <div class="flex items-center gap-4">
    <span class="font-medium text-brand-text-primary">Share this article:</span>
    <div class="flex gap-3">
      <Button
        href={xUrl}
        variant="primary"
        size="sm"
        target="_blank"
        rel="noopener noreferrer"
      >
        X
      </Button>
      <Button
        href={linkedinUrl}
        variant="secondary"
        size="sm"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span class="inline-flex items-center gap-1.5">
          <svg
            viewBox="0 0 24 24"
            class="h-3.5 w-3.5"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M6.94 8.5a1.44 1.44 0 1 1 0-2.88 1.44 1.44 0 0 1 0 2.88ZM5.68 18.3h2.52V9.53H5.68V18.3ZM9.78 9.53h2.42v1.2h.03c.34-.64 1.17-1.32 2.4-1.32 2.56 0 3.03 1.68 3.03 3.86v5.03h-2.52v-4.46c0-1.06-.02-2.43-1.48-2.43-1.49 0-1.72 1.16-1.72 2.35v4.54H9.78V9.53Z"
            />
          </svg>
          LinkedIn
          <svg
            viewBox="0 0 24 24"
            class="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M7 17 17 7" />
            <path d="M8 7h9v9" />
          </svg>
        </span>
      </Button>
      <button
        type="button"
        class="btn-brackets cursor-pointer px-4 py-2 text-[11px] text-brand-text-secondary transition-colors hover:text-brand-accent"
        onclick={() => (showPreview = !showPreview)}
        aria-expanded={showPreview}
        aria-controls="linkedin-preview"
      >
        <span class="inline-flex items-center gap-1.5">
          <svg
            viewBox="0 0 24 24"
            class="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
          >
            <path d="M2 12s3.8-6 10-6 10 6 10 6-3.8 6-10 6-10-6-10-6Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {showPreview ? "Hide" : "Preview"} LinkedIn Post
        </span>
      </button>
    </div>
  </div>

  {#if showPreview}
    <div
      id="linkedin-preview"
      class="mt-4 rounded-lg border border-brand-card-border bg-brand-card p-5 md:p-6"
    >
      <div class="mb-4 flex items-center justify-between">
        <span class="label-mono text-brand-text-muted">LinkedIn Post Preview</span>
        <button
          type="button"
          class="label-mono inline-flex cursor-pointer items-center gap-1.5 transition-colors {copied
            ? 'text-green-400'
            : 'text-brand-accent hover:underline'}"
          onclick={copyLinkedinPost}
        >
          <svg
            viewBox="0 0 24 24"
            class="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a1 1 0 0 1 1-1h10" />
          </svg>
          {copied ? "Copied!" : "Copy Text"}
        </button>
      </div>

      <div class="rounded-md border border-brand-card-border/70 bg-brand-surface p-4">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full border border-brand-accent/40 bg-brand-black text-sm font-medium text-brand-accent">
            UM
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-brand-text-primary">Umesh Malik</p>
            <p class="label-mono text-[10px] text-brand-text-muted">LinkedIn Draft</p>
          </div>
          <div class="ml-auto text-brand-accent" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              class="h-5 w-5"
              fill="currentColor"
            >
              <path
                d="M6.94 8.5a1.44 1.44 0 1 1 0-2.88 1.44 1.44 0 0 1 0 2.88ZM5.68 18.3h2.52V9.53H5.68V18.3ZM9.78 9.53h2.42v1.2h.03c.34-.64 1.17-1.32 2.4-1.32 2.56 0 3.03 1.68 3.03 3.86v5.03h-2.52v-4.46c0-1.06-.02-2.43-1.48-2.43-1.49 0-1.72 1.16-1.72 2.35v4.54H9.78V9.53Z"
              />
            </svg>
          </div>
        </div>

        <pre
          class="whitespace-pre-wrap wrap-break-word text-[15px] leading-relaxed text-brand-text-secondary font-sans"
        >{linkedinPostText}</pre>
      </div>
    </div>
  {/if}
</div>
