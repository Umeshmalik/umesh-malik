import type { RequestHandler } from './$types';
import { getAllPosts } from '$lib/utils/blog';
import { siteConfig } from '$lib/config/site';
import { escapeXml, xmlHeaders } from '$lib/utils/xml';

export const prerender = true;

export const GET: RequestHandler = async () => {
	const posts = await getAllPosts();
	const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${posts
		.map(
			(post) => {
				const publishDate = new Date(post.publishDate);
				const isRecent = publishDate >= twoDaysAgo;
				return `<url>
    <loc>${siteConfig.url}/blog/${post.slug}</loc>
    <lastmod>${post.updatedDate || post.publishDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    ${
			post.image
				? `<image:image>
      <image:loc>${post.image.startsWith('http') ? post.image : siteConfig.url + post.image}</image:loc>
      <image:title>${escapeXml(post.title)}</image:title>
      <image:caption>${escapeXml(post.imageAlt || post.description)}</image:caption>
    </image:image>`
				: ''
		}
    ${
			isRecent
				? `<news:news>
      <news:publication>
        <news:name>Umesh Malik</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${post.publishDate}</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>
    </news:news>`
				: ''
		}
  </url>`;
			}
		)
		.join('\n  ')}
</urlset>`;

	return new Response(xml, { headers: xmlHeaders() });
};
