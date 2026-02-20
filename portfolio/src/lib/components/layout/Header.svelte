<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import ThemeToggle from "$lib/components/ui/ThemeToggle.svelte";

  let menuOpen = $state(false);
  let scrolled = $state(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/projects", label: "Projects" },
    { href: "/blog", label: "Blog" },
    { href: "/resume", label: "Resume" },
  ];

  let navContainer: HTMLDivElement;
  let linkEls: HTMLAnchorElement[] = [];
  let indicatorLeft = $state(0);
  let indicatorWidth = $state(0);
  let indicatorVisible = $state(false);
  let mounted = $state(false);

  function updateIndicator() {
    if (!navContainer) return;
    const activeIndex = navLinks.findIndex((l) => {
      if (l.href === "/") return page.url.pathname === "/";
      return page.url.pathname.startsWith(l.href);
    });
    if (activeIndex === -1) {
      indicatorVisible = false;
      return;
    }
    const el = linkEls[activeIndex];
    if (!el) return;
    const containerRect = navContainer.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    indicatorLeft = elRect.left - containerRect.left;
    indicatorWidth = elRect.width;
    indicatorVisible = true;
  }

  onMount(() => {
    const onScroll = () => {
      scrolled = window.scrollY > 10;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    // Wait a frame for layout to settle
    requestAnimationFrame(() => {
      updateIndicator();
      mounted = true;
    });
    return () => window.removeEventListener("scroll", onScroll);
  });

  $effect(() => {
    // Re-run when pathname changes
    page.url.pathname;
    updateIndicator();
  });
</script>

<header
  class="fixed top-0 right-0 left-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 {scrolled
    ? 'border-b border-brand-border bg-brand-black/80 backdrop-blur-md'
    : 'bg-transparent'}"
>
  <nav
    class="mx-auto flex h-[81px] max-w-[1440px] items-center justify-between px-6 lg:px-12"
  >
    <!-- Logo -->
    <a
      href="/"
      class="flex items-center gap-3 text-brand-text-primary"
      aria-label="Umesh Malik - Home"
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect
          width="32"
          height="32"
          rx="4"
          fill="currentColor"
          fill-opacity="0"
        />
        <path
          d="M3 9 L3 3 L9 3"
          stroke="#C09E5A"
          stroke-width="1.5"
          stroke-linecap="square"
        />
        <path
          d="M23 3 L29 3 L29 9"
          stroke="#C09E5A"
          stroke-width="1.5"
          stroke-linecap="square"
        />
        <path
          d="M29 23 L29 29 L23 29"
          stroke="#C09E5A"
          stroke-width="1.5"
          stroke-linecap="square"
        />
        <path
          d="M9 29 L3 29 L3 23"
          stroke="#C09E5A"
          stroke-width="1.5"
          stroke-linecap="square"
        />
        <text
          x="9"
          y="23"
          font-family="Inter, system-ui, sans-serif"
          font-weight="600"
          font-size="17"
          fill="currentColor">U</text
        >
        <circle cx="24" cy="22" r="2" fill="#C09E5A" />
      </svg>
      <span class="text-xl font-medium tracking-tight"
        >Umesh<span class="text-brand-accent">.</span></span
      >
    </a>

    <!-- Desktop Nav - Center -->
    <div class="nav-container hidden items-center gap-8 md:flex" bind:this={navContainer}>
      {#each navLinks as link, i}
        <a
          bind:this={linkEls[i]}
          href={link.href}
          class="nav-link label-mono transition-colors duration-200 {page.url.pathname === link.href || (link.href !== '/' && page.url.pathname.startsWith(link.href))
            ? 'text-brand-text-primary'
            : 'text-brand-text-muted hover:text-brand-text-primary'}"
        >
          {link.label}
        </a>
      {/each}
      <!-- Sliding indicator -->
      {#if indicatorVisible}
        <span
          class="nav-indicator"
          class:animated={mounted}
          style="left: {indicatorLeft}px; width: {indicatorWidth}px;"
          aria-hidden="true"
        ></span>
      {/if}
    </div>

    <!-- CTA - Right -->
    <div class="hidden items-center gap-2 md:flex">
      <ThemeToggle />
      <Button href="/contact" variant="primary">Contact</Button>
    </div>

    <!-- Mobile Toggle -->
    <div class="flex items-center gap-1 md:hidden">
      <ThemeToggle />
      <button
        class="text-brand-text-primary"
        onclick={() => (menuOpen = !menuOpen)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        type="button"
      >
        <svg
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {#if menuOpen}
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M6 18L18 6M6 6l12 12"
            />
          {:else}
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M4 6h16M4 12h16M4 18h16"
            />
          {/if}
        </svg>
      </button>
    </div>
  </nav>

  <!-- Mobile Menu -->
  {#if menuOpen}
    <div class="border-t border-brand-border bg-brand-black px-6 py-6 md:hidden">
      {#each navLinks as link}
        <a
          href={link.href}
          class="label-mono block py-3 transition-colors {page.url.pathname ===
          link.href
            ? 'text-brand-text-primary'
            : 'text-brand-text-muted'}"
          onclick={() => (menuOpen = false)}
        >
          {link.label}
        </a>
      {/each}
      <Button
        href="/contact"
        variant="primary"
        class="mt-6 w-full"
        onclick={() => (menuOpen = false)}
      >
        Contact
      </Button>
    </div>
  {/if}
</header>

<style>
  .nav-container {
    position: relative;
  }

  .nav-link {
    position: relative;
    padding-bottom: 4px;
  }

  .nav-indicator {
    position: absolute;
    bottom: -2px;
    height: 2px;
    background-color: var(--color-brand-accent);
    border-radius: 1px;
    pointer-events: none;
  }

  .nav-indicator.animated {
    transition: left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
</style>
