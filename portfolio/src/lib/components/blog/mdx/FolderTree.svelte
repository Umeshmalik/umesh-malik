<script lang="ts">
  interface Props {
    title?: string;
    children?: import("svelte").Snippet;
  }

  let { title = "Folder Structure", children }: Props = $props();
</script>

<section
  class="corner-brackets my-8 rounded-sm border border-brand-card-border bg-brand-card p-4 md:p-5"
>
  <div class="mb-3 flex items-center gap-2">
    <span class="inline-block h-2 w-2 rounded-full bg-brand-accent"></span>
    <p class="label-mono text-brand-accent">{title}</p>
  </div>

  <div class="rounded-sm border border-brand-card-border/70 bg-brand-surface">
    <pre class="m-0!"><code
        class="font-mono text-sm leading-7 whitespace-pre text-brand-text-primary"
        >{@render children?.()}</code
      ></pre>
  </div>
</section>
