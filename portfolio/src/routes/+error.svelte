<script lang="ts">
  import { page } from "$app/state";

  const links = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/projects", label: "Projects" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ];
</script>

<section class="mx-auto flex min-h-[80vh] max-w-[1160px] flex-col items-center justify-center px-6 pt-32 pb-20 text-center lg:px-12">
  <p class="label-mono mb-6 text-brand-accent">Error {page.status}</p>

  <h1 class="mb-4 text-[clamp(80px,15vw,180px)] font-light leading-none tracking-tighter text-white">
    {page.status}
  </h1>

  <p class="body-large mb-4 max-w-lg text-brand-text-secondary">
    {#if page.status === 404}
      The page you're looking for doesn't exist or has been moved.
    {:else}
      {page.error?.message || "Something went wrong."}
    {/if}
  </p>

  <p class="body-medium mb-12 text-brand-text-muted">
    {#if page.status === 404}
      Check the URL or navigate using the links below.
    {:else}
      Try refreshing the page or navigate elsewhere.
    {/if}
  </p>

  <!-- Corner bracket card with navigation -->
  <div class="corner-brackets w-full max-w-md border border-brand-card-border bg-brand-card p-8">
    <h2 class="mb-6 text-lg font-medium text-white">Quick Navigation</h2>
    <nav aria-label="Site navigation">
      <ul class="space-y-3">
        {#each links as link}
          <li>
            <a
              href={link.href}
              class="label-mono block py-2 text-brand-text-muted transition-colors hover:text-brand-accent"
            >
              {link.label}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  </div>

  <!-- Decorative accent line -->
  <div class="mt-12 h-px w-24 bg-brand-accent"></div>
</section>
