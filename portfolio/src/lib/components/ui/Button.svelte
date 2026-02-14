<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    variant?: "primary" | "secondary";
    size?: "sm" | "md" | "lg";
    href?: string;
    download?: boolean;
    children: Snippet;
  }

  let {
    variant = "primary",
    size = "md",
    href,
    download = false,
    children,
  }: Props = $props();

  const baseStyles = "btn-brackets transition-all duration-300";

  const variants = {
    primary:
      "bg-white text-black hover:bg-[var(--color-brand-accent)] hover:text-black",
    secondary: "bg-transparent text-white hover:text-brand-accent",
  };

  const sizes = {
    sm: "px-4 py-2 text-[11px]",
    md: "px-5 py-2.5",
    lg: "px-7 py-3",
  };

  const classes = $derived(`${baseStyles} ${variants[variant]} ${sizes[size]}`);
</script>

{#if href}
  <a {href} class={classes} {download}>
    {@render children()}
  </a>
{:else}
  <button class={classes}>
    {@render children()}
  </button>
{/if}
