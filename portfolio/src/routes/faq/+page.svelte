<script lang="ts">
  import SEO from "$lib/components/layout/SEO.svelte";
  import { createBreadcrumbSchema } from "$lib/utils/schema";
  import { siteConfig } from "$lib/config/site";
  import { slide } from "svelte/transition";
  import ScrollToTop from "$lib/components/blog/ScrollToTop.svelte";

  const faqs = [
    {
      question: "What does a typical workday look like for you at Expedia?",
      answer:
        "Most days start with reviewing PRs and catching up on async discussions. The core of my day is focused development work on the Workflow Orchestration Platform — building components, writing tests, and collaborating with designers and backend engineers. I usually block 2-3 hours of uninterrupted coding time in the morning. Afternoons tend to be more collaborative: code reviews, architecture discussions, and sprint ceremonies.",
    },
    {
      question: "What framework would you recommend for a new project in 2025?",
      answer:
        "It depends on your team and constraints. For teams already proficient in React, Next.js is the safe, productive choice — the ecosystem is unmatched. For new projects where you control the stack, I'd strongly recommend SvelteKit. The developer experience is superior, bundle sizes are smaller, and Svelte 5's runes make reactivity intuitive. For simple content sites, Astro is excellent. There's no single right answer — pick the tool that fits your team's skills and your project's needs.",
    },
    {
      question: "How do you prepare for software engineering interviews?",
      answer:
        "Focus on JavaScript fundamentals first — closures, the event loop, promises, and prototypes still come up regularly. For mid-to-senior roles, practice system design: how would you build a component library, a real-time dashboard, or a form builder? Know your framework deeply — for React, understand reconciliation, hooks rules, and performance patterns. Prepare 5-6 behavioral stories using the STAR method covering leadership, technical challenges, and failures. Finally, practice building small apps under time pressure.",
    },
    {
      question: "What's the most challenging technical problem you've solved?",
      answer:
        "At BYJU's, our payment validation system was experiencing silent failures on certain edge cases — transactions would appear successful but the validation state was inconsistent. The root cause was a race condition between concurrent API calls updating shared state. I mapped out all the edge cases, implemented optimistic locking with retry logic, and added comprehensive monitoring. The fix brought us from sporadic failures to 99.9% uptime on a system processing $10M+ monthly.",
    },
    {
      question: "Do you prefer remote or in-office work?",
      answer:
        "I work best in a hybrid setup. Deep coding work benefits from the focus of a home office — no commute, fewer interruptions, and better control over my environment. But collaborative work like design reviews, architecture discussions, and onboarding new team members is genuinely better in person. The ideal split for me is 2-3 days in office for collaboration, with the rest remote for focused work.",
    },
    {
      question:
        "What resources do you recommend for learning software engineering?",
      answer:
        "MDN Web Docs is the best reference for fundamentals. For React, the official docs and Kent C. Dodds' blog are excellent. For TypeScript, the official handbook is the best starting point. I maintain a curated list of resources, tools, and code snippets on my resources page at umesh-malik.com/resources — check it out for specific recommendations across learning, tools, libraries, and podcasts.",
    },
    {
      question: "Are you available for freelance or consulting work?",
      answer:
        "I'm not currently available for freelance or contract work — my role at Expedia Group keeps me fully engaged. However, I'm open to technical discussions, speaking at meetups or conferences, mentoring conversations, and open-source collaboration. The best way to reach me is through my contact page at umesh-malik.com/contact.",
    },
    {
      question: "What does your code review process look like?",
      answer:
        "I start with the PR description and linked ticket to understand the context. Then I read the tests first — they tell me what the code should do before I see how it does it. I focus on logic correctness, edge cases, and architectural alignment rather than style (that's what linters handle). I ask questions instead of making demands: 'What happens if X?' rather than 'Change this.' I also look for missing test coverage and potential performance issues.",
    },
    {
      question: "How do you stay current with frontend technology?",
      answer:
        "I follow a few high-signal sources rather than trying to track everything: the TC39 proposals for JavaScript evolution, the Svelte and React blogs for framework updates, and a handful of developers like Josh Comeau and Dan Abramov for deep technical content. Podcasts like Syntax.fm fill commute time. Most importantly, I learn by building — this portfolio is built with the latest SvelteKit and TailwindCSS specifically to stay hands-on with new tools.",
    },
    {
      question: "Why did you choose SvelteKit for this portfolio?",
      answer:
        "Three reasons: performance, developer experience, and learning. SvelteKit compiles to vanilla JavaScript with no runtime overhead, which makes it ideal for a content-heavy site where every kilobyte matters. The developer experience with Svelte 5 runes is the best I've used — reactivity feels natural. And building a real project is the best way to learn a framework deeply. My day job uses React, so this portfolio keeps my Svelte skills sharp and gives me a different perspective on frontend architecture.",
    },
  ];

  let openIndex = $state<number | null>(null);

  function toggle(index: number) {
    openIndex = openIndex === index ? null : index;
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: siteConfig.url },
    { name: "FAQ", url: `${siteConfig.url}/faq` },
  ]);
</script>

<SEO
  title="FAQ - Umesh Malik | Frequently Asked Questions"
  description="Frequently asked questions about Umesh Malik — work at Expedia, framework recommendations, interview tips, code review approach, and career advice for frontend engineers."
/>

<svelte:head>
  {@html `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`}
</svelte:head>

<section class="mx-auto max-w-[1160px] px-6 pt-32 pb-20 lg:px-12">
  <!-- Breadcrumb Navigation -->
  <nav aria-label="Breadcrumb" class="mb-8">
    <ol class="flex flex-wrap items-center gap-1 text-sm text-brand-text-muted">
      <li>
        <a href="/" class="transition-colors hover:text-brand-accent">Home</a>
      </li>
      <li class="mx-1">/</li>
      <li class="text-brand-text-primary" aria-current="page">FAQ</li>
    </ol>
  </nav>

  <h1 class="section-title mb-4 text-brand-text-primary">
    Frequently Asked Questions
  </h1>
  <p class="body-large mb-16 text-brand-text-secondary">
    Real questions from developers, recruiters, and people who've reached out
  </p>

  <div class="space-y-0">
    {#each faqs as faq, i}
      <div class="border-b border-brand-border">
        <button
          type="button"
          class="flex w-full items-center justify-between py-6 text-left transition-colors hover:text-brand-accent"
          onclick={() => toggle(i)}
          aria-expanded={openIndex === i}
        >
          <h2
            class="pr-8 text-xl font-medium {openIndex === i
              ? 'text-brand-accent'
              : 'text-brand-text-primary'}"
          >
            {faq.question}
          </h2>
          <svg
            class="h-5 w-5 shrink-0 text-brand-accent transition-transform duration-300 {openIndex ===
            i
              ? 'rotate-180'
              : ''}"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {#if openIndex === i}
          <div transition:slide={{ duration: 300 }}>
            <p class="body-medium pb-6 text-brand-text-secondary">
              {faq.answer}
            </p>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</section>

<ScrollToTop />
