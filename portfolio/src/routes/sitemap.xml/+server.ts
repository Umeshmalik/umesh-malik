import type { RequestHandler } from './$types';
import { getAllPosts, getAllCategories, getAllTags, slugify } from '$lib/utils/blog';
import { siteConfig } from '$lib/config/site';
import { xmlHeaders } from '$lib/utils/xml';

export const prerender = true;

export const GET: RequestHandler = async () => {
  const posts = await getAllPosts();
  const categories = getAllCategories(posts);
  const tags = getAllTags(posts);
  const now = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${siteConfig.staticPages
      .map(
        (page) => `<url>
    <loc>${siteConfig.url}${page.path}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${siteConfig.url}${page.path}" />
    <xhtml:link rel="alternate" hreflang="en-IN" href="${siteConfig.alternateUrl}${page.path}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${siteConfig.url}${page.path}" />
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
    <xhtml:link rel="alternate" hreflang="en" href="${siteConfig.url}/blog/category/${cat.slug}" />
    <xhtml:link rel="alternate" hreflang="en-IN" href="${siteConfig.alternateUrl}/blog/category/${cat.slug}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${siteConfig.url}/blog/category/${cat.slug}" />
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
      )
      .join('\n  ')}
  ${tags
      .map(
        (tag) => `<url>
    <loc>${siteConfig.url}/blog/tag/${slugify(tag)}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${siteConfig.url}/blog/tag/${slugify(tag)}" />
    <xhtml:link rel="alternate" hreflang="en-IN" href="${siteConfig.alternateUrl}/blog/tag/${slugify(tag)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${siteConfig.url}/blog/tag/${slugify(tag)}" />
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`
      )
      .join('\n  ')}
</urlset>`;

  return new Response(xml, { headers: xmlHeaders() });
};
