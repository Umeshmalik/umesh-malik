import type { RequestHandler } from './$types';
import { siteConfig } from '$lib/config/site';
import { xmlHeaders } from '$lib/utils/xml';

export const prerender = true;

export const GET: RequestHandler = async () => {
	const now = new Date().toISOString();

	const sitemaps = [
		{ loc: `${siteConfig.url}/sitemap.xml`, lastmod: now },
		{ loc: `${siteConfig.url}/blog-sitemap.xml`, lastmod: now }
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemaps
		.map(
			(s) => `<sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`
		)
		.join('\n  ')}
</sitemapindex>`;

	return new Response(xml, { headers: xmlHeaders(3600) });
};
