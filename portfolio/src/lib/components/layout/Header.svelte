<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";

  let menuOpen = $state(false);
  let scrolled = $state(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/projects", label: "Projects" },
    { href: "/blog", label: "Blog" },
    { href: "/resume", label: "Resume" },
  ];

  onMount(() => {
    const onScroll = () => {
      scrolled = window.scrollY > 10;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  });
</script>

<header
  class="fixed top-0 right-0 left-0 z-50 transition-all duration-300 {scrolled
    ? 'border-b border-brand-border bg-black/80 backdrop-blur-md'
    : 'bg-transparent'}"
>
  <nav
    class="mx-auto flex h-[81px] max-w-[1440px] items-center justify-between px-6 lg:px-12"
  >
    <!-- Logo -->
    <a href="/" class="flex items-center gap-3 text-white" aria-label="Umesh Malik - Home">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="32" height="32" rx="4" fill="currentColor" fill-opacity="0"/>
        <path d="M3 9 L3 3 L9 3" stroke="#C09E5A" stroke-width="1.5" stroke-linecap="square"/>
        <path d="M23 3 L29 3 L29 9" stroke="#C09E5A" stroke-width="1.5" stroke-linecap="square"/>
        <path d="M29 23 L29 29 L23 29" stroke="#C09E5A" stroke-width="1.5" stroke-linecap="square"/>
        <path d="M9 29 L3 29 L3 23" stroke="#C09E5A" stroke-width="1.5" stroke-linecap="square"/>
        <text x="9" y="23" font-family="Inter, system-ui, sans-serif" font-weight="600" font-size="17" fill="white">U</text>
        <circle cx="24" cy="22" r="2" fill="#C09E5A"/>
      </svg>
      <span class="text-xl font-medium tracking-tight">Umesh<span class="text-brand-accent">.</span></span>
    </a>

    <!-- Desktop Nav - Center -->
    <div class="hidden items-center gap-8 md:flex">
      {#each navLinks as link}
        <a
          href={link.href}
          class="label-mono transition-colors duration-200 {$page.url
            .pathname === link.href
            ? 'text-white'
            : 'text-brand-text-muted hover:text-white'}"
        >
          {link.label}
        </a>
      {/each}
    </div>

    <!-- CTA - Right -->
    <div class="hidden md:block">
      <a
        href="/contact"
        class="btn-brackets bg-white text-black hover:bg-[var(--color-brand-accent)] hover:text-black"
      >
        Contact
      </a>
    </div>

    <!-- Mobile Toggle -->
    <button
      class="text-white md:hidden"
      onclick={() => (menuOpen = !menuOpen)}
      aria-label="Toggle menu"
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
  </nav>

  <!-- Mobile Menu -->
  {#if menuOpen}
    <div class="border-t border-brand-border bg-black px-6 py-6 md:hidden">
      {#each navLinks as link}
        <a
          href={link.href}
          class="label-mono block py-3 transition-colors {$page.url.pathname ===
          link.href
            ? 'text-white'
            : 'text-brand-text-muted'}"
          onclick={() => (menuOpen = false)}
        >
          {link.label}
        </a>
      {/each}
      <a
        href="/contact"
        class="btn-brackets mt-6 block w-full bg-white text-center text-black"
        onclick={() => (menuOpen = false)}
      >
        Contact
      </a>
    </div>
  {/if}
</header>
