export interface Project {
	title: string;
	company: string;
	description: string;
	tech: string[];
	impact: string;
	featured: boolean;
	href?: string;
}

export const projects: Project[] = [
	{
		title: 'Retro Portfolio (umesh.OS)',
		company: 'Open Source',
		description:
			'Interactive Windows 95-themed portfolio experience built with Astro 5, React 19, and Three.js. Features a full desktop environment with draggable windows, a terminal, 3D skill galaxy, easter eggs, and CRT effects.',
		tech: ['Astro', 'React 19', 'Three.js', 'TypeScript', 'Tailwind CSS'],
		impact: 'Full interactive desktop experience in the browser',
		featured: true,
		href: '/projects/retro-portfolio'
	},
	{
		title: 'Workflow Orchestration Platform',
		company: 'Expedia Group',
		description:
			'Enterprise visual workflow editor with drag-and-drop interface. Led migration from Vue.js to React, establishing new standards for component architecture across the platform.',
		tech: ['React', 'TypeScript', 'Jest', 'React Testing Library'],
		impact: '3x developer velocity improvement',
		featured: true
	},
	{
		title: 'Finance & Insurance Module',
		company: 'Tekion Corp',
		description:
			'Multi-language F&I module serving thousands of automotive dealerships. Built with full WCAG compliance and internationalization support for global market expansion.',
		tech: ['React', 'TypeScript', 'i18n', 'WCAG', 'Accessibility'],
		impact: 'Serving thousands of dealerships',
		featured: true
	},
	{
		title: 'Payment Validation System',
		company: "BYJU'S",
		description:
			'High-reliability payment validation system processing over $10M in monthly transactions with 99.9% uptime. Built with robust error handling and real-time monitoring.',
		tech: ['React', 'JavaScript', 'Node.js', 'MongoDB'],
		impact: '$10M+ monthly transactions processed',
		featured: true
	},
	{
		title: 'Real-time Chat Application',
		company: 'Personal Project',
		description:
			'WebSocket-based messaging application with JWT authentication, real-time typing indicators, and message persistence. Built with React, Node.js, and Socket.io.',
		tech: ['React', 'Node.js', 'Socket.io', 'JWT', 'MongoDB'],
		impact: 'Real-time messaging with <100ms latency',
		featured: false
	},
	{
		title: 'Pincode Management System',
		company: "BYJU'S",
		description:
			'Administrative system for managing 19,000+ pincode entries with bulk operations, search, and validation. Streamlined logistics and delivery operations.',
		tech: ['React', 'JavaScript', 'REST APIs'],
		impact: '19,000+ entries managed',
		featured: false
	},
	{
		title: 'Developer Portfolio',
		company: 'Open Source',
		description:
			'Performance-optimized developer portfolio built with SvelteKit and Svelte 5 runes. Features a technical blog with MDsveX, SEO with structured data, RSS feeds, and AI-optimized content pages.',
		tech: ['SvelteKit', 'Svelte 5', 'TailwindCSS 4', 'MDsveX', 'TypeScript'],
		impact: '98+ Lighthouse score across all pages',
		featured: false
	},
	{
		title: 'Component Performance Analyzer',
		company: 'Personal Project',
		description:
			'CLI tool that analyzes React component render performance and identifies unnecessary re-renders, large bundle contributions, and missing memoization opportunities.',
		tech: ['Node.js', 'TypeScript', 'AST Parsing', 'CLI'],
		impact: 'Identified 40% redundant renders in test projects',
		featured: false
	}
];
