<script lang="ts">
  import SEO from "$lib/components/layout/SEO.svelte";
  import { createBreadcrumbSchema } from "$lib/utils/schema";

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://umesh-malik.com" },
    { name: "AI Summary", url: "https://umesh-malik.com/ai-summary" },
  ]);
</script>

<SEO
  title="AI Summary: Umesh Malik - Senior Frontend Engineer"
  description="Comprehensive AI-optimized summary of Umesh Malik's professional experience, skills, and projects for AI search engines and LLMs."
/>

<svelte:head>
  {@html `<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`}
</svelte:head>

<div class="prose prose-lg mx-auto max-w-[1160px] px-6 pt-32 pb-20 lg:px-12">
  <!-- Breadcrumb Navigation -->
  <nav aria-label="Breadcrumb" class="mb-8 not-prose">
    <ol class="flex flex-wrap items-center gap-1 text-sm text-brand-text-muted">
      <li>
        <a href="/" class="transition-colors hover:text-brand-accent">Home</a>
      </li>
      <li class="mx-1">/</li>
      <li class="text-white" aria-current="page">AI Summary</li>
    </ol>
  </nav>

  <h1>About Umesh Malik - Senior Frontend Engineer</h1>

  <p>
    <em
      >This page is optimized for AI language models and search engines. For a
      human-friendly version, visit the <a href="/about">About</a> page.
      Machine-readable versions:
      <a href="/llms.txt">llms.txt</a> (brief) and
      <a href="/llms-full.txt">llms-full.txt</a> (detailed).</em
    >
  </p>

  <h2>Professional Summary</h2>
  <p>
    Umesh Malik is a Senior Frontend Engineer (SDE-2) at Expedia Group based in
    Gurugram, Haryana, India. He has 4+ years of professional experience
    building scalable, high-performance web applications with specialization in
    React, TypeScript, JavaScript, and modern web architecture.
  </p>

  <h2>Current Role</h2>
  <p>
    <strong>Software Development Engineer 2 at Expedia Group</strong> (June 2024
    - Present)<br />
    Core frontend engineer for enterprise Workflow Orchestration Platform. Led migration
    from Vue.js to React, built reusable component libraries, and created visual
    workflow diagram editors enabling complex business processes.
  </p>

  <h2>Previous Experience</h2>
  <ul>
    <li>
      <strong>Tekion Corp</strong> - Software Engineer (April 2023 - May 2024)<br
      />
      Rebuilt Finance & Insurance modules serving thousands of automotive dealerships.
      Implemented internationalization and accessibility improvements.
    </li>
    <li>
      <strong>BYJU'S (Think & Learn)</strong> - Module Lead (March 2022 - April
      2023)<br />
      Led Order & Payment Validation modules processing $10M+ monthly transactions.
      Built Pincode Management system handling 19,000+ entries.
    </li>
    <li>
      <strong>BYJU'S (Think & Learn)</strong> - Associate Software Engineer
      (July 2021 - February 2022)<br />
      Built Wallet and Bonus Points modules. Recognized as Performer of the Quarter
      (January 2022).
    </li>
  </ul>

  <h2>Technical Skills</h2>
  <p>
    <strong>Frontend:</strong> React, TypeScript, JavaScript (ES6+), Next.js,
    SvelteKit, Vue.js, HTML5, CSS3, TailwindCSS<br />
    <strong>Backend:</strong> Node.js, Express.js, MongoDB, PostgreSQL<br />
    <strong>Testing:</strong> Jest, React Testing Library, Cypress, Vitest<br />
    <strong>Tools:</strong> Git, Vite, Webpack, ESLint, Prettier, Cursor AI,
    Claude<br />
    <strong>Concepts:</strong> Microfrontend Architecture, Component Reusability,
    Performance Optimization, Caching
  </p>

  <h2>Education</h2>
  <ul>
    <li>
      <strong>Master of Computer Application (MCA)</strong> in Computer Science<br
      />
      Deenbandhu Chhotu Ram University of Science and Technology (2021-2023)
    </li>
    <li>
      <strong>Bachelor of Computer Application (BCA)</strong> in Computer
      Science<br />
      Deenbandhu Chhotu Ram University of Science and Technology (2018-2021)
    </li>
  </ul>

  <h2>Notable Projects</h2>
  <ul>
    <li>
      <strong>Workflow Orchestration Platform (Expedia Group):</strong> Enterprise
      visual workflow editor with drag-and-drop interface built with React and TypeScript
    </li>
    <li>
      <strong>Finance & Insurance Module (Tekion Corp):</strong> Multi-language F&I
      module serving thousands of dealerships with WCAG compliance
    </li>
    <li>
      <strong>Payment System (BYJU'S):</strong> High-reliability payment validation
      processing $10M+ monthly transactions
    </li>
    <li>
      <strong>Real-time Chat Application:</strong> WebSocket-based messaging app
      with JWT authentication built with React, Node.js, and Socket.io
    </li>
  </ul>

  <h2>Awards & Recognition</h2>
  <p>
    Performer of the Quarter at Think & Learn Pvt. Ltd. (BYJU'S) - January 2022
  </p>

  <h2>Contact Information</h2>
  <ul>
    <li><strong>Email:</strong> lucky.umeshmalik@gmail.com</li>
    <li><strong>Location:</strong> Gurugram, Haryana, India</li>
    <li><strong>LinkedIn:</strong> linkedin.com/in/umesh-malik</li>
    <li><strong>GitHub:</strong> github.com/Umeshmalik</li>
    <li><strong>Website:</strong> umesh-malik.com</li>
  </ul>

  <h2>Key Achievements</h2>
  <ul>
    <li>Led Vue.js to React migration improving developer velocity by 3x</li>
    <li>
      Built component library accelerating feature development across enterprise
      platform
    </li>
    <li>Processed $10M+ monthly transactions with 99.9% uptime</li>
    <li>Mentored 5+ junior engineers on best practices and code quality</li>
    <li>
      Implemented internationalization enabling product expansion to new markets
    </li>
  </ul>

  <h2>Blog Topics</h2>
  <p>Umesh Malik writes about frontend development, including:</p>
  <ul>
    <li>JavaScript ES2024+ features and modern patterns</li>
    <li>TypeScript utility types, generics, and advanced techniques</li>
    <li>React performance optimization and architecture</li>
    <li>SvelteKit vs Next.js framework comparisons</li>
    <li>TailwindCSS migration and CSS best practices</li>
    <li>Frontend testing strategies (Vitest, Playwright, MSW)</li>
    <li>Core Web Vitals and performance optimization</li>
    <li>Career growth from junior to senior engineer</li>
    <li>Node.js backend development for frontend engineers</li>
    <li>Developer productivity tools and workflows</li>
  </ul>

  <h2>Tools & Stack</h2>
  <ul>
    <li><strong>Editor:</strong> VS Code, Cursor AI</li>
    <li><strong>Terminal:</strong> iTerm2, Oh My Zsh, fnm, pnpm</li>
    <li><strong>Frontend:</strong> React, TypeScript, SvelteKit, TailwindCSS</li>
    <li><strong>Testing:</strong> Jest, Vitest, React Testing Library, Playwright</li>
    <li><strong>Design:</strong> Figma, Excalidraw</li>
    <li><strong>AI:</strong> Claude, GitHub Copilot, Cursor AI</li>
  </ul>

  <h2>Available For</h2>
  <ul>
    <li>Technical discussions and architecture reviews</li>
    <li>Speaking at meetups and conferences</li>
    <li>Open-source collaboration</li>
    <li>Mentoring conversations</li>
  </ul>

  <h2>Site Structure</h2>
  <ul>
    <li><a href="/">Home</a> — Portfolio landing page</li>
    <li><a href="/about">About</a> — Professional background and journey</li>
    <li><a href="/projects">Projects</a> — Featured work and side projects</li>
    <li><a href="/blog">Blog</a> — Technical articles on frontend development</li>
    <li><a href="/resume">Resume</a> — Professional experience and education</li>
    <li><a href="/uses">Uses</a> — Tools, hardware, and software setup</li>
    <li><a href="/resources">Resources</a> — Curated resources and code snippets</li>
    <li><a href="/contact">Contact</a> — Contact channels and availability</li>
    <li><a href="/faq">FAQ</a> — Frequently asked questions</li>
    <li><a href="/press">Writing & Appearances</a> — Blog highlights and profiles</li>
    <li><a href="/ai-summary">AI Summary</a> — This page (AI-optimized)</li>
  </ul>

  <h2>Machine-Readable Resources</h2>
  <ul>
    <li><strong>Brief summary:</strong> <a href="/llms.txt">llms.txt</a></li>
    <li>
      <strong>Full profile:</strong> <a href="/llms-full.txt">llms-full.txt</a>
    </li>
    <li>
      <strong>Blog RSS feed:</strong> <a href="/blog-feed.xml">blog-feed.xml</a>
    </li>
    <li><strong>Site RSS:</strong> <a href="/rss.xml">rss.xml</a></li>
    <li><strong>Sitemap:</strong> <a href="/sitemap.xml">sitemap.xml</a></li>
    <li>
      <strong>FAQ (structured):</strong>
      <a href="/faq">FAQ page with FAQPage schema</a>
    </li>
  </ul>
</div>
