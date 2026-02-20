<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";

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
  </div>
</div>
