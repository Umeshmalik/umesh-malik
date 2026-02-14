import type { RequestHandler } from './$types';
import { getAllPosts } from '$lib/utils/blog';
import { siteConfig } from '$lib/config/site';
import { jsonHeaders } from '$lib/utils/xml';

export const prerender = true;

export const GET: RequestHandler = async () => {
	const posts = await getAllPosts();

	const feed = {
		version: 'https://jsonfeed.org/version/1.1',
		title: `${siteConfig.author.name}'s Blog`,
		home_page_url: siteConfig.url,
		feed_url: `${siteConfig.url}/feed.json`,
		description:
			'Articles about JavaScript, TypeScript, React, SvelteKit, frontend architecture, and web performance',
		language: siteConfig.language,
		authors: [
			{
				name: siteConfig.author.name,
				url: siteConfig.url,
				avatar: `${siteConfig.url}/images/umesh-malik.jpg`
			}
		],
		items: posts.map((post) => ({
			id: `${siteConfig.url}/blog/${post.slug}`,
			url: `${siteConfig.url}/blog/${post.slug}`,
			title: post.title,
			summary: post.description,
			date_published: new Date(post.publishDate).toISOString(),
			...(post.updatedDate && {
				date_modified: new Date(post.updatedDate).toISOString()
			}),
			authors: [{ name: siteConfig.author.name }],
			tags: post.tags,
			...(post.image && {
				image: post.image.startsWith('http') ? post.image : `${siteConfig.url}${post.image}`
			})
		}))
	};

	return new Response(JSON.stringify(feed, null, 2), { headers: jsonHeaders(3600) });
};
