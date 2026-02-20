<script lang="ts">
  import Button from "./Button.svelte";

  interface Props {
    text: string;
  }

  let { text }: Props = $props();
  let copied = $state(false);
  let timeout: ReturnType<typeof setTimeout> | null = null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        copied = false;
      }, 2000);
    } catch {
      // Fallback: do nothing if clipboard API is unavailable
    }
  }
</script>

<Button
  variant="secondary"
  size="sm"
  class="label-mono flex items-center gap-2"
  onclick={copy}
  aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
>
  {#if copied}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class="scale-110 transition-transform"
      style="transition: transform 0.2s ease-out;"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
    Copied
  {:else}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
    Copy
  {/if}
</Button>
