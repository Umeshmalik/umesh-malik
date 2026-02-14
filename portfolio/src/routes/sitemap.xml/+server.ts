import type { RequestHandler } from './$types';
import { getAllPosts, getAllCategories, getAllTags } from '$lib/utils/blog';
import { siteConfig } from '$lib/config/site';
import { xmlHeaders } from '$lib/utils/xml';

export const GET: RequestHandler = async () => {
	const posts = await getAllPosts();
	const categories = getAllCategories(posts);
	const tags = getAllTags(posts);
	const now = new Date().toISOString();

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${siteConfig.staticPages
		.map(
			(page) => `<url>
    <loc>${siteConfig.url}${page.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
		)
		.join('\n  ')}
  ${categories
		.map(
			(cat) => `<url>
    <loc>${siteConfig.url}/blog/category/${cat.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
		)
		.join('\n  ')}
  ${tags
		.map(
			(tag) => `<url>
    <loc>${siteConfig.url}/blog/tag/${tag.toLowerCase()}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`
		)
		.join('\n  ')}
</urlset>`;

	return new Response(xml, { headers: xmlHeaders() });
};
