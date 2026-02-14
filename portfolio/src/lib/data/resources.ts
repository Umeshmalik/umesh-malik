export interface Resource {
	name: string;
	description: string;
	url: string;
	category: string;
	tags: string[];
}

export interface CodeSnippet {
	title: string;
	description: string;
	language: string;
	code: string;
}

export const resources: Resource[] = [
	{
		name: 'MDN Web Docs',
		description: 'The definitive reference for HTML, CSS, and JavaScript. I check this almost daily.',
		url: 'https://developer.mozilla.org',
		category: 'Learning',
		tags: ['Reference', 'JavaScript', 'CSS']
	},
	{
		name: 'TypeScript Handbook',
		description: 'Official TypeScript documentation. The best starting point for learning TypeScript properly.',
		url: 'https://www.typescriptlang.org/docs/handbook',
		category: 'Learning',
		tags: ['TypeScript', 'Documentation']
	},
	{
		name: 'Svelte Tutorial',
		description: 'Interactive tutorial that teaches Svelte from basics to advanced patterns. How I learned Svelte.',
		url: 'https://learn.svelte.dev',
		category: 'Learning',
		tags: ['Svelte', 'Tutorial']
	},
	{
		name: 'TailwindCSS',
		description: 'Utility-first CSS framework. The documentation doubles as an excellent CSS reference.',
		url: 'https://tailwindcss.com',
		category: 'Tools',
		tags: ['CSS', 'Framework']
	},
	{
		name: 'Vite',
		description: 'Next-generation build tool. Fast HMR and sensible defaults for modern frontend projects.',
		url: 'https://vitejs.dev',
		category: 'Tools',
		tags: ['Build Tool', 'JavaScript']
	},
	{
		name: 'Turborepo',
		description: 'High-performance monorepo build system. Useful for managing multiple packages in large projects.',
		url: 'https://turbo.build',
		category: 'Tools',
		tags: ['Monorepo', 'Build Tool']
	},
	{
		name: 'Zod',
		description: 'TypeScript-first schema validation. Replaced hand-written validators in most of my projects.',
		url: 'https://zod.dev',
		category: 'Libraries',
		tags: ['TypeScript', 'Validation']
	},
	{
		name: 'TanStack Query',
		description: 'Async state management for React. Handles caching, background updates, and stale data elegantly.',
		url: 'https://tanstack.com/query',
		category: 'Libraries',
		tags: ['React', 'State Management']
	},
	{
		name: 'Framer Motion',
		description: 'Production-ready animation library for React. Makes complex animations approachable.',
		url: 'https://www.framer.com/motion',
		category: 'Libraries',
		tags: ['React', 'Animation']
	},
	{
		name: 'Josh W. Comeau',
		description: 'Deep-dive articles on CSS, React, and web development with interactive examples.',
		url: 'https://www.joshwcomeau.com',
		category: 'Blogs',
		tags: ['CSS', 'React', 'Frontend']
	},
	{
		name: 'Kent C. Dodds',
		description: 'Practical articles on testing, React patterns, and software quality.',
		url: 'https://kentcdodds.com/blog',
		category: 'Blogs',
		tags: ['Testing', 'React']
	},
	{
		name: 'Dan Abramov — overreacted.io',
		description: 'Thoughtful posts on React internals, JavaScript, and programming philosophy.',
		url: 'https://overreacted.io',
		category: 'Blogs',
		tags: ['React', 'JavaScript']
	},
	{
		name: 'Syntax.fm',
		description: 'Web development podcast covering frontend, backend, and everything in between. Great for commutes.',
		url: 'https://syntax.fm',
		category: 'Podcasts',
		tags: ['Web Development', 'General']
	},
	{
		name: 'JS Party',
		description: 'Weekly podcast about the JavaScript ecosystem, frameworks, and the web platform.',
		url: 'https://changelog.com/jsparty',
		category: 'Podcasts',
		tags: ['JavaScript', 'Community']
	},
	{
		name: 'The Changelog',
		description: 'Conversations with open-source maintainers and software leaders. Broader perspective beyond frontend.',
		url: 'https://changelog.com/podcast',
		category: 'Podcasts',
		tags: ['Open Source', 'General']
	}
];

export const codeSnippets: CodeSnippet[] = [
	{
		title: 'Debounce Hook (React)',
		description: 'A reusable React hook that debounces a value. Useful for search inputs and API calls.',
		language: 'typescript',
		code: `import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage:
// const debouncedSearch = useDebounce(searchTerm, 300);`
	},
	{
		title: 'Type-Safe Event Emitter',
		description: 'A generic event emitter with full TypeScript type safety for event names and payloads.',
		language: 'typescript',
		code: `type EventMap = Record<string, unknown>;
type EventHandler<T = unknown> = (payload: T) => void;

class TypedEmitter<Events extends EventMap> {
  private handlers = new Map<keyof Events, Set<EventHandler<any>>>();

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]) {
    this.handlers.get(event)?.forEach((handler) => handler(payload));
  }
}

// Usage:
// type AppEvents = { 'user:login': { id: string }; 'theme:change': 'light' | 'dark' };
// const emitter = new TypedEmitter<AppEvents>();`
	},
	{
		title: 'CSS Grid Auto-Fill Layout',
		description: 'A responsive grid that automatically fills available space without media queries.',
		language: 'css',
		code: `.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
  gap: 1.5rem;
}

/* Usage: apply .auto-grid to a container and its children
   will automatically arrange in a responsive grid.
   No media queries needed — the grid adapts to available space. */`
	},
	{
		title: 'Intersection Observer Hook (React)',
		description: 'A hook for detecting when an element enters the viewport. Great for lazy loading and animations.',
		language: 'typescript',
		code: `import { useEffect, useRef, useState } from 'react';

function useIntersectionObserver(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isIntersecting };
}

// Usage:
// const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });
// <div ref={ref}>{isIntersecting && <ExpensiveComponent />}</div>`
	}
];

export const resourceCategories = ['All', 'Learning', 'Tools', 'Libraries', 'Blogs', 'Podcasts'];
