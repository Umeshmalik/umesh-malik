import type { RequestHandler } from './$types';
import { siteConfig } from '$lib/config/site';
import { textHeaders } from '$lib/utils/xml';

export const GET: RequestHandler = async () => {
	const robots = `# Robots.txt for ${siteConfig.url}
# Last updated: ${new Date().toISOString().split('T')[0]}

# Allow all crawlers
User-agent: *
Allow: /
Disallow: /api/

# Google
User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: Google-Extended
Allow: /

# Bing
User-agent: Bingbot
Allow: /

# AI Crawlers - Explicitly Allowed
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Bytespider
Allow: /

User-agent: CCBot
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

# Sitemaps
Sitemap: ${siteConfig.url}/sitemap-index.xml
Sitemap: ${siteConfig.url}/sitemap.xml
Sitemap: ${siteConfig.url}/blog-sitemap.xml

# AI/LLM content files
# Human-readable AI summary: ${siteConfig.url}/ai-summary
# Machine-readable brief: ${siteConfig.url}/llms.txt
# Machine-readable full: ${siteConfig.url}/llms-full.txt`;

	return new Response(robots, { headers: textHeaders() });
};
