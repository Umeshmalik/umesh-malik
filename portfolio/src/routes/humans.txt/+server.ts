import type { RequestHandler } from './$types';
import { siteConfig } from '$lib/config/site';
import { textHeaders } from '$lib/utils/xml';

export const prerender = true;

export const GET: RequestHandler = async () => {
	const body = `/* TEAM */
Name: ${siteConfig.author.name}
Role: ${siteConfig.author.jobTitle}
Site: ${siteConfig.url}
Location: Gurugram, India
Contact: ${siteConfig.author.email}
Twitter: ${siteConfig.author.twitter}
GitHub: ${siteConfig.author.github}

/* SITE */
Last update: ${new Date().toISOString().split('T')[0]}
Language: English
Standards: HTML5, CSS3, ECMAScript 2024
Framework: SvelteKit, Svelte 5
Styling: TailwindCSS 4
Deployment: Cloudflare Pages
Content: MDsveX (Markdown + Svelte)

/* THANKS */
SvelteKit: https://kit.svelte.dev
Svelte: https://svelte.dev
TailwindCSS: https://tailwindcss.com
Cloudflare: https://pages.cloudflare.com
MDsveX: https://mdsvex.pngwn.io`;

	return new Response(body, { headers: textHeaders() });
};
