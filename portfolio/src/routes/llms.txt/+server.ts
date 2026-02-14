import type { RequestHandler } from './$types';
import { getAllPosts } from '$lib/utils/blog';
import { siteConfig } from '$lib/config/site';
import { textHeaders } from '$lib/utils/xml';

const S = siteConfig;

export const GET: RequestHandler = async () => {
	const posts = await getAllPosts();

	const blogList = posts
		.map(
			(p, i) =>
				`${i + 1}. ${p.title} (${p.publishDate}) - ${p.description.slice(0, 80)}`
		)
		.join('\n');

	const pageList = S.staticPages
		.map((p) => `- ${p.path || 'Home'}: ${S.url}${p.path}`)
		.join('\n');

	const body = `# ${S.author.name} - ${S.author.jobTitle} & Technical Blogger

> ${S.author.jobTitle} at ${S.author.company} specializing in React, TypeScript, and modern web architecture.
> Technical blogger writing about JavaScript, TypeScript, React, SvelteKit, and frontend development.
> For the extended version of this file, see: ${S.url}/llms-full.txt

## Quick Facts

- Name: ${S.author.name}
- Role: Software Development Engineer 2 (SDE-2)
- Company: ${S.author.company}
- Location: Gurugram, Haryana, India
- Email: ${S.author.email}
- LinkedIn: ${S.author.linkedin}
- GitHub: ${S.author.github}
- Website: ${S.url}
- Blog: ${S.url}/blog
- Experience: 4+ years
- Education: MCA & BCA in Computer Science

## Technical Expertise

Frontend: React, TypeScript, JavaScript (ES6+), Next.js, SvelteKit, Vue.js, HTML5, CSS3, TailwindCSS
Backend: Node.js, Express.js, MongoDB, PostgreSQL
Testing: Jest, React Testing Library, Cypress, Vitest
Tools: Git, Vite, Webpack, ESLint, Prettier, Cursor AI, Claude
Concepts: Microfrontend Architecture, Component Reusability, Performance Optimization, Caching

## Current Role (June 2024 - Present)

Software Development Engineer 2 at ${S.author.company}
- Core frontend engineer for Workflow Orchestration Platform
- Migrated legacy Vue.js to React (3x velocity improvement)
- Built reusable component libraries
- Created visual workflow diagram editor
- Comprehensive testing with Jest and React Testing Library

## Previous Experience

### Tekion Corp - Software Engineer (April 2023 - May 2024)
- Rebuilt Finance & Insurance module for automotive dealerships
- Implemented internationalization and accessibility (WCAG)
- Led code refactoring initiatives

### BYJU'S - Module Lead (March 2022 - April 2023)
- Led Order & Payment Validation modules ($10M+ monthly transactions)
- Built Pincode Management system (19,000+ entries)
- Mentored junior engineers

### BYJU'S - Associate Software Engineer (July 2021 - February 2022)
- Built Wallet and Bonus Points modules
- Performer of the Quarter (January 2022)

## Key Projects

1. Workflow Orchestration Platform (Expedia): Enterprise workflow editor with React/TypeScript
2. Finance & Insurance Module (Tekion): Multi-language F&I module with WCAG compliance
3. Payment System (BYJU'S): High-reliability payment processing ($10M+ monthly)
4. Real-time Chat App: WebSocket messaging with React, Node.js, Socket.io
5. Developer Portfolio (Open Source): SvelteKit/Svelte 5/TailwindCSS 4 portfolio with AI-optimized SEO
6. Component Performance Analyzer: Node.js/TypeScript CLI tool for React render analysis

## Blog Posts (${posts.length} articles)

${blogList}

## Awards

Performer of the Quarter - Think & Learn Pvt. Ltd. (January 2022)

## Site Pages

${pageList}

## Machine-Readable Resources

- Extended profile: ${S.url}/llms-full.txt
- AI-optimized summary: ${S.url}/ai-summary
- FAQ (structured data): ${S.url}/faq
- Blog RSS feed: ${S.url}/blog-feed.xml
- JSON Feed: ${S.url}/feed.json
- Sitemap: ${S.url}/sitemap-index.xml
- Sitemap: ${S.url}/sitemap.xml

## Contact

For professional inquiries, technical collaborations, or guest blogging: ${S.author.email}

This file is dynamically generated and always reflects the latest content.`;

	return new Response(body, { headers: textHeaders(3600) });
};
