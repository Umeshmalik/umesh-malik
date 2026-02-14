/**
 * Shared XML utilities for sitemap, RSS, and feed generation.
 */

/** Escape special XML characters in strings */
export function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/** Standard XML response headers with caching */
export function xmlHeaders(maxAge = 3600): Record<string, string> {
	return {
		'Content-Type': 'application/xml',
		'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`
	};
}

/** Standard JSON response headers with caching */
export function jsonHeaders(maxAge = 3600): Record<string, string> {
	return {
		'Content-Type': 'application/feed+json',
		'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`
	};
}

/** Standard text response headers with caching */
export function textHeaders(maxAge = 86400): Record<string, string> {
	return {
		'Content-Type': 'text/plain',
		'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`
	};
}
