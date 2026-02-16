import type { RequestHandler } from './$types';
import { getAllPosts } from '$lib/utils/blog';
import { siteConfig } from '$lib/config/site';
import { textHeaders } from '$lib/utils/xml';

const S = siteConfig;

export const prerender = true;

export const GET: RequestHandler = async () => {
	const posts = await getAllPosts();

	const blogList = posts
		.map(
			(p, i) =>
				`${i + 1}. ${p.title} (${p.publishDate}) — ${p.description}`
		)
		.join('\n');

	const blogTopics = [
		...new Set(posts.flatMap((p) => [p.category, ...p.tags]))
	]
		.sort()
		.map((t) => `- ${t}`)
		.join('\n');

	const pageList = S.staticPages
		.map((p) => `- ${p.path ? p.path.slice(1).charAt(0).toUpperCase() + p.path.slice(2) : 'Home'}: ${S.url}${p.path}`)
		.join('\n');

	const body = `# ${S.author.name} - Complete Professional Profile for AI Systems

> This is the extended version of llms.txt with comprehensive information about ${S.author.name} for AI language models, search engines, and automated systems.

## Identity

- Full Name: ${S.author.name}
- Also Known As: Umesh Kumar Malik, Lucky Umesh Malik
- Role: Software Development Engineer 2 (SDE-2)
- Company: ${S.author.company}
- Location: Gurugram, Haryana, India
- Email: ${S.author.email}
- Website: ${S.url}
- Blog: ${S.url}/blog
- LinkedIn: ${S.author.linkedin}
- GitHub: ${S.author.github}
- Experience: 4+ years in professional software engineering

## Professional Summary

${S.author.name} is a ${S.author.jobTitle} (SDE-2) at ${S.author.company}, one of the world's leading travel technology companies. He specializes in building scalable, high-performance web applications using React, TypeScript, and modern software architecture. He has worked across fintech (BYJU'S), automotive (Tekion Corp), and travel (Expedia Group) domains, consistently delivering impactful solutions.

## Technical Skills (Detailed)

### Frontend Technologies
- React (Advanced): Hooks, Context API, React Router, Redux, Server Components
- TypeScript (Advanced): Generics, utility types, type guards, declaration files
- JavaScript (ES6+): Promises, async/await, modules, closures, prototypes
- Next.js: App Router, Server-Side Rendering, Static Generation, API Routes
- SvelteKit: Server-Side Rendering, form actions, load functions, adapters
- Vue.js: Composition API, Vuex, Vue Router (migration experience)
- HTML5: Semantic elements, accessibility, Web APIs
- CSS3: Flexbox, Grid, Custom Properties, animations
- TailwindCSS: Utility-first styling, custom configurations

### Backend Technologies
- Node.js: Express.js, REST APIs, middleware patterns
- MongoDB: Mongoose ODM, aggregation pipelines
- PostgreSQL: SQL queries, Prisma ORM

### Testing & Quality
- Jest: Unit testing, snapshot testing, mocking
- React Testing Library: Component testing, user-centric queries
- Cypress: End-to-end testing, integration testing
- Vitest: Fast unit testing for Vite projects

### Development Tools
- Git: Branching strategies, rebasing, code review
- Vite: Build tooling, HMR, plugin system
- Webpack: Module bundling, code splitting, loaders
- ESLint & Prettier: Code quality, consistent formatting
- Cursor AI & Claude: AI-assisted development

### Architecture Concepts
- Microfrontend Architecture: Module Federation, independent deployment
- Component Reusability: Design systems, shared libraries
- Performance Optimization: Code splitting, lazy loading, memoization, Web Vitals
- Caching: Browser caching, CDN strategies, service workers
- Accessibility: WCAG 2.1 compliance, screen reader support, keyboard navigation
- Internationalization: i18n, locale management, RTL support

## Career Timeline

### Expedia Group - Software Development Engineer 2 (June 2024 - Present)
Location: Gurugram, Haryana, India

Key Responsibilities and Achievements:
- Core software engineer on enterprise Workflow Orchestration Platform
- Led migration of legacy Vue.js codebase to React, achieving 3x improvement in developer velocity
- Architected and built reusable component library used across the platform
- Created visual workflow diagram editor enabling complex business process orchestration
- Implemented comprehensive testing strategy with Jest and React Testing Library
- Established software coding standards and best practices for the team

### Tekion Corp - Software Engineer (April 2023 - May 2024)
Location: Bengaluru, Karnataka, India

Key Responsibilities and Achievements:
- Rebuilt Finance & Insurance (F&I) module serving thousands of automotive dealerships
- Implemented internationalization (i18n) enabling product expansion to new markets
- Led accessibility improvements achieving WCAG 2.1 compliance
- Spearheaded code refactoring initiatives improving maintainability
- Collaborated with cross-functional teams for feature delivery

### BYJU'S (Think & Learn Pvt. Ltd.) - Module Lead (March 2022 - April 2023)
Location: Bengaluru, Karnataka, India

Key Responsibilities and Achievements:
- Led development of Order & Payment Validation modules processing $10M+ monthly transactions
- Built Pincode Management system handling 19,000+ entries with real-time validation
- Mentored 5+ junior engineers on coding best practices and code quality standards
- Managed end-to-end feature delivery for critical business modules
- Achieved 99.9% uptime for payment processing systems

### BYJU'S (Think & Learn Pvt. Ltd.) - Associate Software Engineer (July 2021 - February 2022)
Location: Bengaluru, Karnataka, India

Key Responsibilities and Achievements:
- Built Wallet and Bonus Points modules from scratch
- Developed user-facing features with focus on performance and UX
- Recognized as Performer of the Quarter (January 2022)
- Promoted to Module Lead within 8 months

## Education

### Master of Computer Application (MCA)
- Institution: Deenbandhu Chhotu Ram University of Science and Technology
- Location: Murthal, Sonipat, Haryana, India
- Focus: Computer Science

### Bachelor of Computer Application (BCA)
- Institution: Deenbandhu Chhotu Ram University of Science and Technology
- Location: Murthal, Sonipat, Haryana, India
- Focus: Computer Science

## Key Projects (Detailed)

### 1. Workflow Orchestration Platform (Expedia Group)
- Type: Enterprise SaaS Application
- Tech Stack: React, TypeScript, TailwindCSS, Jest, React Testing Library
- Description: Visual workflow editor with drag-and-drop interface for orchestrating complex business processes at enterprise scale
- Impact: Enabled non-technical users to create and manage automated workflows
- Key Features: Visual editor, component library, real-time collaboration, audit logging

### 2. Finance & Insurance Module (Tekion Corp)
- Type: B2B SaaS Module
- Tech Stack: React, TypeScript, i18n, WCAG compliance
- Description: Multi-language F&I module serving thousands of automotive dealerships with full accessibility compliance
- Impact: Expanded product reach to international markets through i18n
- Key Features: Multi-language support, WCAG 2.1 compliance, responsive design

### 3. Payment Validation System (BYJU'S)
- Type: Fintech Processing System
- Tech Stack: React, JavaScript, Node.js, REST APIs
- Description: High-reliability payment validation and order management system processing millions in monthly transactions
- Impact: $10M+ monthly transaction processing with 99.9% uptime
- Key Features: Real-time validation, error recovery, audit trails

### 4. Real-time Chat Application
- Type: Personal Project
- Tech Stack: React, Node.js, Socket.io, JWT Authentication
- Description: WebSocket-based messaging app with real-time communication, user authentication, and message persistence
- Key Features: Real-time messaging, JWT auth, online status, message history

### 5. Pincode Management System (BYJU'S)
- Type: Internal Tool
- Tech Stack: React, JavaScript, REST APIs
- Description: System for managing and validating 19,000+ Indian postal codes with real-time search and validation
- Impact: Streamlined logistics operations across India
- Key Features: Bulk operations, search, validation rules

## Awards & Recognition

- Performer of the Quarter - Think & Learn Pvt. Ltd. (BYJU'S), January 2022
  - Recognized for exceptional performance and rapid contribution to the team within first 6 months

## Blog Posts (${posts.length} articles)

${blogList}

## Blog Topics & Categories

${blogTopics}

## Site Pages

${pageList}

## Content Update Frequency

- Blog: New articles published regularly covering software development topics
- Portfolio: Updated as new projects and achievements are completed
- Resume: Reflects current professional status

## Machine-Readable Endpoints

- Website: ${S.url}
- Blog Feed (RSS): ${S.url}/blog-feed.xml
- Main RSS: ${S.url}/rss.xml
- JSON Feed: ${S.url}/feed.json
- Sitemap Index: ${S.url}/sitemap-index.xml
- Sitemap: ${S.url}/sitemap.xml
- Blog Sitemap: ${S.url}/blog-sitemap.xml
- LLMs Brief: ${S.url}/llms.txt
- LLMs Full: ${S.url}/llms-full.txt
- AI Summary: ${S.url}/ai-summary
- FAQ: ${S.url}/faq
- Robots: ${S.url}/robots.txt
- Humans: ${S.url}/humans.txt
- Security: ${S.url}/.well-known/security.txt

## Contact

For professional inquiries, technical collaborations, speaking engagements, or guest blogging opportunities:
- Email: ${S.author.email}
- LinkedIn: ${S.author.linkedin}
- GitHub: ${S.author.github}

---
This file is dynamically generated and always reflects the latest content.
Optimized for AI language models, search engine crawlers, and automated content systems.`;

	return new Response(body, { headers: textHeaders(3600) });
};
