import type { RequestHandler } from './$types';
import { getAllPosts } from '$lib/utils/blog';
import { siteConfig } from '$lib/config/site';
import { escapeXml, xmlHeaders } from '$lib/utils/xml';

export const GET: RequestHandler = async () => {
	const posts = await getAllPosts();

	const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${siteConfig.author.name}'s Blog - JavaScript, TypeScript &amp; Frontend Development</title>
    <link>${siteConfig.url}/blog</link>
    <description>Articles about JavaScript, TypeScript, React, SvelteKit, frontend architecture, and web performance</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteConfig.url}/blog-feed.xml" rel="self" type="application/rss+xml"/>
    ${posts
			.map(
				(post) => `<item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteConfig.url}/blog/${post.slug}</link>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.publishDate).toUTCString()}</pubDate>
      <guid isPermaLink="true">${siteConfig.url}/blog/${post.slug}</guid>
      <category>${escapeXml(post.category)}</category>
      ${post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
      <author>${siteConfig.author.email} (${siteConfig.author.name})</author>
    </item>`
			)
			.join('\n    ')}
  </channel>
</rss>`;

	return new Response(rss, { headers: xmlHeaders() });
};
