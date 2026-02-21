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
    const hashtags = tags
      .slice(0, 5)
      .map((t) => `#${t.replace(/[^a-zA-Z0-9]/g, "")}`)
      .join(" ");

    const parts = [title];
    if (description) parts.push(`\n${description}`);
    parts.push(`\nRead the full article:\n${url}`);
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
        LinkedIn
      </Button>
      <button
        type="button"
        class="btn-brackets cursor-pointer px-4 py-2 text-[11px] text-brand-text-secondary transition-colors hover:text-brand-accent"
        onclick={() => (showPreview = !showPreview)}
        aria-expanded={showPreview}
        aria-controls="linkedin-preview"
      >
        {showPreview ? "Hide" : "Preview"} Post
      </button>
    </div>
  </div>

  {#if showPreview}
    <div
      id="linkedin-preview"
      class="mt-4 rounded-lg border border-brand-card-border bg-brand-card p-5"
    >
      <div class="mb-3 flex items-center justify-between">
        <span class="label-mono text-brand-text-muted"
          >LinkedIn Post Preview</span
        >
        <button
          type="button"
          class="label-mono cursor-pointer transition-colors {copied
            ? 'text-green-400'
            : 'text-brand-accent hover:underline'}"
          onclick={copyLinkedinPost}
        >
          {copied ? "Copied!" : "Copy Text"}
        </button>
      </div>
      <pre
        class="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-brand-text-secondary font-sans">{linkedinPostText}</pre>
    </div>
  {/if}
</div>
