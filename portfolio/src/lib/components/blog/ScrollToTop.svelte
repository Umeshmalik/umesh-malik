<script lang="ts">
  import { onMount } from "svelte";
  import Button from "$lib/components/ui/Button.svelte";

  let visible = $state(false);

  onMount(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        visible = window.scrollY > 400;
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  });

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
</script>

{#if visible}
  <div class="scroll-to-top fixed right-6 bottom-6 z-40">
    <Button
      variant="secondary"
      size="sm"
      onclick={scrollToTop}
      aria-label="Scroll to top"
      class="px-2.5! py-2.5!"
    >
      <svg
        class="h-4 w-4"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8 12V4m0 0L4 8m4-4l4 4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </Button>
  </div>
{/if}

<style>
  .scroll-to-top {
    animation: pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes pop-in {
    from {
      opacity: 0;
      transform: scale(0.5) translateY(8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
</style>
