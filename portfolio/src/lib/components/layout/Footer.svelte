<script lang="ts">
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { href: "https://linkedin.com/in/umesh-malik", label: "LinkedIn" },
    { href: "https://github.com/Umeshmalik", label: "GitHub" },
    { href: "https://twitter.com/umeshmalik", label: "Twitter" },
  ];

  const siteLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/projects", label: "Projects" },
    { href: "/blog", label: "Blog" },
    { href: "/resume", label: "Resume" },
    { href: "/faq", label: "FAQ" },
    { href: "/uses", label: "Uses" },
    { href: "/resources", label: "Resources" },
    { href: "/contact", label: "Contact" },
  ];
</script>

<footer class="border-t border-brand-border bg-black">
  <div class="mx-auto max-w-[1440px] px-6 py-20 lg:px-12">
    <div class="grid gap-12 md:grid-cols-3">
      <div>
        <h2 class="mb-4 flex items-center gap-2 text-lg font-medium text-white">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M3 9 L3 3 L9 3" stroke="#C09E5A" stroke-width="1.5" stroke-linecap="square"/>
            <path d="M23 3 L29 3 L29 9" stroke="#C09E5A" stroke-width="1.5" stroke-linecap="square"/>
            <path d="M29 23 L29 29 L23 29" stroke="#C09E5A" stroke-width="1.5" stroke-linecap="square"/>
            <path d="M9 29 L3 29 L3 23" stroke="#C09E5A" stroke-width="1.5" stroke-linecap="square"/>
            <text x="9" y="23" font-family="Inter, system-ui, sans-serif" font-weight="600" font-size="17" fill="white">U</text>
            <circle cx="24" cy="22" r="2" fill="#C09E5A"/>
          </svg>
          Umesh Malik<span class="text-brand-accent">.</span>
        </h2>
        <p class="body-medium text-brand-text-secondary">
          Senior Frontend Engineer at Expedia Group. Building scalable web
          applications with React, TypeScript, and modern architecture.
        </p>
      </div>

      <div>
        <h3 class="label-mono mb-6 text-brand-text-muted">Pages</h3>
        <ul class="space-y-3">
          {#each siteLinks as link}
            <li>
              <a
                href={link.href}
                class="body-medium text-brand-text-secondary transition-colors hover:text-brand-accent"
              >
                {link.label}
              </a>
            </li>
          {/each}
        </ul>
      </div>

      <div>
        <h3 class="label-mono mb-6 text-brand-text-muted">Connect</h3>
        <ul class="space-y-3">
          {#each socialLinks as link}
            <li>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                class="body-medium text-brand-text-secondary transition-colors hover:text-brand-accent"
              >
                {link.label}
              </a>
            </li>
          {/each}
          <li>
            <a
              href="mailto:lucky.umeshmalik@gmail.com"
              class="body-medium text-brand-text-secondary transition-colors hover:text-brand-accent"
            >
              Email
            </a>
          </li>
        </ul>
      </div>
    </div>

    <div class="mt-16 border-t border-brand-border pt-8 text-center">
      <p class="label-mono text-brand-text-muted">
        &copy; {currentYear} Umesh Malik. All rights reserved.
      </p>
    </div>
  </div>
</footer>
