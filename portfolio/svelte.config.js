import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';

/** @type {import('mdsvex').MdsvexOptions} */
const mdsvexOptions = {
	extensions: ['.md', '.svx'],
	smartypants: {
		dashes: 'oldschool'
	},
	rehypePlugins: [
		rehypeSlug,
		[
			rehypeAutolinkHeadings,
			{
				behavior: 'wrap'
			}
		]
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
