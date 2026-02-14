export interface UsesItem {
	name: string;
	description: string;
	url?: string;
}

export interface UsesCategory {
	name: string;
	items: UsesItem[];
}

export const usesCategories: UsesCategory[] = [
	{
		name: 'Editor & IDE',
		items: [
			{
				name: 'Cursor',
				description: 'Primary code editor. AI-native development with context-aware completions, inline edits, and chat — the fastest way to write and refactor code.',
				url: 'https://cursor.sh'
			},
			{
				name: 'Antigravity',
				description: 'Next-gen AI coding environment. Using it for its agentic workflows and deep codebase understanding.',
				url: 'https://antigravity.dev'
			},
			{
				name: 'Claude Code CLI',
				description: 'Terminal-based AI coding agent from Anthropic. Perfect for sweeping refactors, multi-file changes, and working through complex problems directly from the command line.',
				url: 'https://claude.ai/code'
			}
		]
	},
	{
		name: 'Terminal & CLI',
		items: [
			{
				name: 'iTerm2',
				description: 'Terminal emulator on macOS with split panes, search, and profile switching.',
				url: 'https://iterm2.com'
			},
			{
				name: 'Oh My Zsh',
				description: 'Zsh framework with plugins for git, Node, and autocompletions. Keeps shell workflows fast.',
				url: 'https://ohmyz.sh'
			},
			{
				name: 'fnm',
				description: 'Fast Node.js version manager written in Rust. Switched from nvm for the speed improvement.',
				url: 'https://github.com/Schniz/fnm'
			},
			{
				name: 'pnpm',
				description: 'Package manager of choice. Faster installs, strict dependency resolution, and great monorepo support.',
				url: 'https://pnpm.io'
			}
		]
	},
	{
		name: 'Browser & Extensions',
		items: [
			{
				name: 'Chrome DevTools',
				description: 'Primary debugging environment. Performance tab and Lighthouse audits are indispensable.'
			},
			{
				name: 'React Developer Tools',
				description: 'For profiling component renders and inspecting props/state in React applications.',
				url: 'https://react.dev/learn/react-developer-tools'
			},
			{
				name: 'Svelte DevTools',
				description: 'Component inspector for Svelte projects. Used while building this portfolio.',
				url: 'https://github.com/sveltejs/svelte-devtools'
			},
			{
				name: 'Axe DevTools',
				description: 'Accessibility auditing extension. Catches WCAG violations during development.',
				url: 'https://www.deque.com/axe/devtools'
			}
		]
	},
	{
		name: 'Design & Productivity',
		items: [
			{
				name: 'Figma',
				description: 'For reviewing designs, inspecting spacing and tokens, and occasionally creating quick mockups.',
				url: 'https://figma.com'
			},
			{
				name: 'Notion',
				description: 'Personal knowledge base for technical notes, project planning, and blog post drafts.',
				url: 'https://notion.so'
			},
			{
				name: 'Excalidraw',
				description: 'Whiteboard tool for architecture diagrams, flowcharts, and system design sketches.',
				url: 'https://excalidraw.com'
			},
			{
				name: 'Claude',
				description: 'AI assistant for code review, technical writing, and working through complex problems.',
				url: 'https://claude.ai'
			}
		]
	},
	{
		name: 'Hardware & Desk',
		items: [
			{
				name: 'MacBook Pro M3',
				description: 'Primary development machine. The M3 chip handles large TypeScript projects and multiple Docker containers without breaking a sweat.'
			},
			{
				name: 'Dell 27" 4K Monitor',
				description: 'External display for side-by-side code and browser. 4K resolution makes text crisp for long coding sessions.'
			},
			{
				name: 'Keychron K2 Mechanical Keyboard',
				description: 'Compact mechanical keyboard with brown switches. Good balance between typing feel and noise level.'
			},
			{
				name: 'Sony WH-1000XM4',
				description: 'Noise-cancelling headphones for deep focus blocks. Essential in open-office and work-from-home setups.'
			}
		]
	},
	{
		name: 'Development Stack',
		items: [
			{
				name: 'React + TypeScript',
				description: 'Primary stack for professional work. Used at Expedia Group for enterprise-scale applications.'
			},
			{
				name: 'SvelteKit',
				description: 'Framework of choice for personal projects. This portfolio is built with SvelteKit and Svelte 5.',
				url: 'https://kit.svelte.dev'
			},
			{
				name: 'TailwindCSS',
				description: 'Utility-first CSS framework. Paired with the typography plugin for prose content like blog posts.',
				url: 'https://tailwindcss.com'
			},
			{
				name: 'Vitest',
				description: 'Test runner for personal projects. Jest at work, Vitest for everything Vite-based.',
				url: 'https://vitest.dev'
			}
		]
	}
];
