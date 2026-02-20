import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';

/** Rehype plugin: adds loading="lazy" and decoding="async" to all images */
function rehypeLazyImages() {
	function walk(node) {
		if (node.tagName === 'img' && node.properties) {
			node.properties.loading = 'lazy';
			node.properties.decoding = 'async';
		}
		if (node.children) {
			node.children.forEach(walk);
		}
	}
	return (tree) => walk(tree);
}

/** Rehype plugin: extracts h2/h3 headings (with IDs from rehype-slug) into frontmatter */
function rehypeExtractHeadings() {
	function getTextContent(node) {
		if (node.type === 'text') return node.value || '';
		if (node.children) return node.children.map(getTextContent).join('');
		return '';
	}
	return (tree, file) => {
		const headings = [];
		function walk(node) {
			if (node.tagName === 'h2' || node.tagName === 'h3') {
				const id = node.properties?.id;
				if (id) {
					headings.push({
						id,
						text: getTextContent(node).trim(),
						level: parseInt(node.tagName[1])
					});
				}
			}
			if (node.children) node.children.forEach(walk);
		}
		walk(tree);
		file.data.fm = file.data.fm || {};
		file.data.fm.headings = headings;
	};
}

/** @type {import('mdsvex').MdsvexOptions} */
const mdsvexOptions = {
	extensions: ['.md', '.svx'],
	smartypants: {
		dashes: 'oldschool'
	},
	rehypePlugins: [
		rehypeSlug,
		rehypeExtractHeadings,
		[
			rehypeAutolinkHeadings,
			{
				behavior: 'wrap'
			}
		],
		rehypeLazyImages
	]
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md', '.svx'],

	preprocess: [vitePreprocess(), mdsvex(mdsvexOptions)],

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			precompress: false,
			strict: false
		}),
		prerender: {
			entries: ['*', '/analytics'],
			handleHttpError({ path, message }) {
				// Static microfrontend files exist in static/ but aren't SvelteKit routes
				if (path.startsWith('/projects/retro-portfolio')) return;

				// Static assets (images, fonts, etc.) referenced in meta tags may not exist yet
				const assetExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.ico', '.woff2', '.woff', '.pdf'];
				if (assetExtensions.some((ext) => path.endsWith(ext))) {
					console.warn(`Warning: missing static asset ${path}`);
					return;
				}

				throw new Error(message);
			}
		},
		alias: {
			$components: './src/lib/components',
			$data: './src/lib/data',
			$utils: './src/lib/utils',
			$posts: './src/lib/posts'
		}
	}
};

export default config;
