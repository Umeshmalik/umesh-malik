<script lang="ts">
  import { onMount } from "svelte";

  interface TocHeading {
    id: string;
    text: string;
    level: number;
  }

  let headings = $state<TocHeading[]>([]);
  let activeId = $state("");
  let isExpanded = $state(true);

  onMount(() => {
    const container = document.querySelector(".prose");
    if (!container) return;

    const elements = Array.from(
      container.querySelectorAll<HTMLElement>("h2, h3"),
    );

    headings = elements
      .filter((el) => el.id)
      .map((el) => ({
        id: el.id,
        text: el.textContent?.trim() || "",
        level: parseInt(el.tagName[1]),
      }));

    if (headings.length === 0) return;

    let ticking = false;

    const updateActiveHeading = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;

      // If near the bottom of the page, activate the last heading
      if (scrollY + winHeight >= docHeight - 50) {
        const lastHeading = headings[headings.length - 1];
        if (lastHeading) activeId = lastHeading.id;
        ticking = false;
        return;
      }

      let current = "";
      for (const el of elements) {
        if (!el.id) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120) {
          current = el.id;
        }
      }
      if (current) activeId = current;
      ticking = false;
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateActiveHeading);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateActiveHeading();

    return () => window.removeEventListener("scroll", handleScroll);
  });
</script>

{#if headings.length > 1}
  <nav
    aria-label="Table of contents"
    class="corner-brackets mb-10 border border-brand-card-border bg-brand-card"
  >
    <button
      type="button"
      class="flex w-full items-center justify-between px-6 py-4"
      aria-expanded={isExpanded}
      onclick={() => (isExpanded = !isExpanded)}
    >
      <span class="label-mono text-brand-accent">Table of Contents</span>
      <svg
        class="h-4 w-4 text-brand-text-muted transition-transform duration-200 {isExpanded
          ? 'rotate-180'
          : ''}"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 6l4 4 4-4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    {#if isExpanded}
      <ol class="border-t border-brand-card-border px-6 pb-5 pt-3">
        {#each headings as heading (heading.id)}
          <li>
            <a
              href="#{heading.id}"
              class="flex items-start border-l-2 py-1.5 text-sm leading-relaxed transition-colors duration-200
                {heading.level === 3 ? 'pl-7' : 'pl-4'}
                {activeId === heading.id
                ? 'border-brand-accent text-brand-accent'
                : 'border-transparent text-brand-text-secondary hover:border-brand-text-muted hover:text-white'}"
            >
              {heading.text}
            </a>
          </li>
        {/each}
      </ol>
    {/if}
  </nav>
{/if}
