import type { RequestHandler } from './$types';
import { getAllPosts } from '$lib/utils/blog';
import { siteConfig } from '$lib/config/site';
import { escapeXml, xmlHeaders } from '$lib/utils/xml';

export const GET: RequestHandler = async () => {
	const posts = await getAllPosts();
	const now = new Date();

	const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${siteConfig.author.name} - ${siteConfig.author.jobTitle}</title>
    <link>${siteConfig.url}</link>
    <description>${siteConfig.description}</description>
    <language>en-us</language>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <atom:link href="${siteConfig.url}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteConfig.url}${siteConfig.ogImage}</url>
      <title>${siteConfig.author.name}</title>
      <link>${siteConfig.url}</link>
    </image>
    <managingEditor>${siteConfig.author.email} (${siteConfig.author.name})</managingEditor>
    <webMaster>${siteConfig.author.email} (${siteConfig.author.name})</webMaster>
    <copyright>${siteConfig.copyright(now.getFullYear())}</copyright>
    <ttl>60</ttl>
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
