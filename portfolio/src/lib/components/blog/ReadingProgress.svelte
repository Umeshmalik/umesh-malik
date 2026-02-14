<script lang="ts">
  import { onMount } from "svelte";

  let progress = $state(0);

  onMount(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY;
        const scrollPercentage =
          (scrollTop / (documentHeight - windowHeight)) * 100;
        progress = Math.min(scrollPercentage, 100);
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  });
</script>

<div
  class="fixed top-0 right-0 left-0 z-50 h-[2px] bg-brand-accent transition-[width] duration-150"
  style="width: {progress}%"
></div>
