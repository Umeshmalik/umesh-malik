<script lang="ts">
  interface Props {
    title: string;
    url: string;
  }

  let { title, url }: Props = $props();

  const xUrl = $derived(
    `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  );
  const linkedinUrl = $derived(
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  );
</script>

<div class="flex items-center gap-4 border-y border-brand-border py-6">
  <span class="font-medium text-white">Share this article:</span>
  <div class="flex gap-3">
    <a
      href={xUrl}
      target="_blank"
      rel="noopener noreferrer"
      class="btn-brackets bg-white px-4 py-2 text-black transition-colors hover:bg-brand-accent"
    >
      X
    </a>
    <a
      href={linkedinUrl}
      target="_blank"
      rel="noopener noreferrer"
      class="btn-brackets border border-brand-border bg-transparent px-4 py-2 text-white transition-colors hover:border-brand-accent hover:text-brand-accent"
    >
      LinkedIn
    </a>
  </div>
</div>
