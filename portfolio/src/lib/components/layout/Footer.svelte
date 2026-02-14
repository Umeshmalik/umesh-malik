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
        <h3 class="mb-4 text-lg font-medium text-white">
          Umesh Malik<span class="text-brand-accent">.</span>
        </h3>
        <p class="body-medium text-brand-text-secondary">
          Senior Frontend Engineer at Expedia Group. Building scalable web
          applications with React, TypeScript, and modern architecture.
        </p>
      </div>

      <div>
        <h4 class="label-mono mb-6 text-brand-text-muted">Pages</h4>
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
        <h4 class="label-mono mb-6 text-brand-text-muted">Connect</h4>
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
