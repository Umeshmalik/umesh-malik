import type { RequestHandler } from './$types';
import { siteConfig } from '$lib/config/site';
import { textHeaders } from '$lib/utils/xml';

export const prerender = true;

export const GET: RequestHandler = async () => {
	const expires = new Date();
	expires.setFullYear(expires.getFullYear() + 1);

	const body = `# Security Policy for ${siteConfig.url}
# https://securitytxt.org/

Contact: mailto:${siteConfig.author.email}
Preferred-Languages: en
Canonical: ${siteConfig.url}/.well-known/security.txt
Expires: ${expires.toISOString()}`;

	return new Response(body, { headers: textHeaders() });
};
