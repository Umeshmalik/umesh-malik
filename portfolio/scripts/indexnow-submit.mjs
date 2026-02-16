#!/usr/bin/env node

/**
 * Smart IndexNow submission script.
 *
 * Detects which pages changed via git diff, maps source files to public URLs,
 * and submits them to the IndexNow API for fast indexing by Bing, Yandex,
 * DuckDuckGo, Seznam, and Naver.
 *
 * Usage:
 *   node scripts/indexnow-submit.mjs                          # auto-detect from git
 *   node scripts/indexnow-submit.mjs --before <sha>           # diff against a specific commit
 *   node scripts/indexnow-submit.mjs --sitemap                # fallback: fetch all URLs from sitemap
 *   node scripts/indexnow-submit.mjs --urls "/blog/my-post"   # submit specific paths
 *
 * Environment variables:
 *   INDEXNOW_KEY          - IndexNow API key (falls back to hardcoded default)
 *   SITE_URL              - Primary domain (default: https://umesh-malik.com)
 *   SITE_URL_ALT          - Alternate domain (default: https://umesh-malik.in)
 */

import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'b52fd35b0ee3234d8074e58fa2591da9';
const SITE_URL = process.env.SITE_URL || 'https://umesh-malik.com';
const SITE_URL_ALT = process.env.SITE_URL_ALT || 'https://umesh-malik.in';
const DOMAINS = [new URL(SITE_URL).hostname, new URL(SITE_URL_ALT).hostname];
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_REQUEST = 10000;

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

function getArg(flag) {
	const idx = args.indexOf(flag);
	return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
}

const hasFlag = (flag) => args.includes(flag);

const beforeSha = getArg('--before');
const manualUrls = getArg('--urls');
const useSitemap = hasFlag('--sitemap');
const dryRun = hasFlag('--dry-run');

// ---------------------------------------------------------------------------
// Source file → public URL mapping
// ---------------------------------------------------------------------------

/** Known static pages from site config (paths relative to site root) */
const STATIC_PAGES = [
	'',
	'/blog',
	'/projects',
	'/about',
	'/resume',
	'/faq',
	'/contact',
	'/uses',
	'/resources',
	'/ai-summary',
	'/press',
	'/projects/retro-portfolio',
	'/projects/retro-portfolio/about',
	'/projects/retro-portfolio/experience',
	'/projects/retro-portfolio/projects',
	'/projects/retro-portfolio/skills',
	'/projects/retro-portfolio/contact'
];

/**
 * Map a changed source file path to zero or more public URL paths.
 * Returns an array of path strings (without domain).
 */
function sourceFileToUrls(filePath) {
	// Blog post changed or added
	if (filePath.match(/^portfolio\/src\/lib\/posts\/(.+)\.md$/)) {
		const slug = filePath.match(/^portfolio\/src\/lib\/posts\/(.+)\.md$/)[1];
		return [`/blog/${slug}`, '/blog'];
	}

	// Route page changed
	const routeMatch = filePath.match(/^portfolio\/src\/routes\/(.+?)\/\+page\.(svelte|ts|server\.ts)$/);
	if (routeMatch) {
		let routePath = routeMatch[1];
		// Remove dynamic segments notation for mapping
		// e.g., blog/[slug] pages trigger blog index
		if (routePath.includes('[')) {
			routePath = routePath.replace(/\/\[.*$/, '');
		}
		// Special route files (sitemap, rss, etc.) are not user-facing pages
		if (routePath.includes('.xml') || routePath.includes('.json') || routePath.includes('.txt')) {
			return [];
		}
		return [`/${routePath}`];
	}

	// Layout or global component changed → submit all static pages
	if (
		filePath.match(/^portfolio\/src\/routes\/\+layout/) ||
		filePath.match(/^portfolio\/src\/app\.(html|css)$/) ||
		filePath.match(/^portfolio\/src\/lib\/components\/layout\//)
	) {
		return STATIC_PAGES;
	}

	// SEO component or config changed → submit all pages
	if (
		filePath.match(/^portfolio\/src\/lib\/config\/site\.ts$/) ||
		filePath.match(/^portfolio\/src\/lib\/components\/.*(SEO|seo)/)
	) {
		return STATIC_PAGES;
	}

	// Blog utility or component changed → submit blog index + all blog posts
	if (
		filePath.match(/^portfolio\/src\/lib\/utils\/blog\.ts$/) ||
		filePath.match(/^portfolio\/src\/lib\/components\/blog\//)
	) {
		return ['/blog', ...getBlogPostPaths()];
	}

	// Static assets changed (images, etc.)
	if (filePath.match(/^portfolio\/static\//)) {
		// Don't submit for key files, sitemaps, etc.
		if (filePath.match(/\.(txt|xml|json)$/)) return [];
		return ['/'];
	}

	// Frontend (retro-portfolio) changed
	if (filePath.match(/^frontend\//)) {
		return [
			'/projects/retro-portfolio',
			'/projects/retro-portfolio/about',
			'/projects/retro-portfolio/experience',
			'/projects/retro-portfolio/projects',
			'/projects/retro-portfolio/skills',
			'/projects/retro-portfolio/contact'
		];
	}

	return [];
}

/**
 * Read all blog post slugs from the posts directory.
 */
function getBlogPostPaths() {
	try {
		const postsDir = resolve(process.cwd(), 'portfolio/src/lib/posts');
		return readdirSync(postsDir)
			.filter((f) => f.endsWith('.md'))
			.map((f) => `/blog/${f.replace('.md', '')}`);
	} catch {
		// If running from portfolio/ directory
		try {
			const postsDir = resolve(process.cwd(), 'src/lib/posts');
			return readdirSync(postsDir)
				.filter((f) => f.endsWith('.md'))
				.map((f) => `/blog/${f.replace('.md', '')}`);
		} catch {
			return [];
		}
	}
}

// ---------------------------------------------------------------------------
// Git diff detection
// ---------------------------------------------------------------------------

function getChangedFiles(beforeRef) {
	try {
		const ref = beforeRef || 'HEAD~1';
		const output = execSync(`git diff --name-only ${ref} HEAD`, {
			encoding: 'utf8',
			cwd: resolve(process.cwd())
		}).trim();

		if (!output) return [];
		return output.split('\n').filter(Boolean);
	} catch (e) {
		console.warn(`[warn] git diff failed: ${e.message}`);
		return [];
	}
}

// ---------------------------------------------------------------------------
// Sitemap fallback
// ---------------------------------------------------------------------------

async function fetchUrlsFromSitemap(domain) {
	const urls = [];

	for (const sitemapPath of ['/sitemap.xml', '/blog-sitemap.xml']) {
		try {
			const resp = await fetch(`https://${domain}${sitemapPath}`);
			if (!resp.ok) continue;
			const xml = await resp.text();
			const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
			for (const match of matches) {
				const url = match[1];
				// Extract path from full URL
				try {
					const parsed = new URL(url);
					urls.push(parsed.pathname);
				} catch {
					urls.push(url);
				}
			}
		} catch (e) {
			console.warn(`[warn] Failed to fetch ${sitemapPath} from ${domain}: ${e.message}`);
		}
	}

	return urls;
}

// ---------------------------------------------------------------------------
// IndexNow submission
// ---------------------------------------------------------------------------

async function submitToIndexNow(domain, urlPaths) {
	const fullUrls = urlPaths.map((p) => `https://${domain}${p}`);

	// IndexNow allows up to 10,000 URLs per request
	const batches = [];
	for (let i = 0; i < fullUrls.length; i += MAX_URLS_PER_REQUEST) {
		batches.push(fullUrls.slice(i, i + MAX_URLS_PER_REQUEST));
	}

	for (const batch of batches) {
		const payload = {
			host: domain,
			key: INDEXNOW_KEY,
			keyLocation: `https://${domain}/${INDEXNOW_KEY}.txt`,
			urlList: batch
		};

		if (dryRun) {
			console.log(`\n[dry-run] Would submit ${batch.length} URLs to IndexNow for ${domain}:`);
			batch.forEach((url) => console.log(`  ${url}`));
			continue;
		}

		try {
			const resp = await fetch(INDEXNOW_ENDPOINT, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
				body: JSON.stringify(payload)
			});

			const status = resp.status;
			const statusText = {
				200: 'OK - URLs submitted successfully',
				202: 'Accepted - URLs received, validation pending',
				400: 'Bad Request - Invalid format',
				403: 'Forbidden - Key not valid',
				422: 'Unprocessable - URLs don\'t match host',
				429: 'Too Many Requests - Rate limited'
			}[status] || resp.statusText;

			console.log(`  ${domain} → HTTP ${status} (${statusText}) [${batch.length} URLs]`);
		} catch (e) {
			console.error(`  ${domain} → FAILED: ${e.message}`);
		}
	}
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	console.log('=== IndexNow Smart Submission ===\n');

	let urlPaths = [];

	if (manualUrls) {
		// Manual URL paths provided via CLI
		urlPaths = manualUrls.split(',').map((u) => u.trim());
		console.log(`[mode] Manual URLs: ${urlPaths.length} paths provided`);
	} else if (useSitemap) {
		// Fallback: fetch from sitemaps
		console.log('[mode] Sitemap fallback: fetching all URLs from sitemaps...');
		urlPaths = await fetchUrlsFromSitemap(DOMAINS[0]);
		console.log(`  Found ${urlPaths.length} URLs from sitemaps`);
	} else {
		// Smart: detect from git diff
		console.log('[mode] Git diff detection');
		const changedFiles = getChangedFiles(beforeSha);

		if (changedFiles.length === 0) {
			console.log('  No changed files detected. Falling back to sitemap...');
			urlPaths = await fetchUrlsFromSitemap(DOMAINS[0]);
			console.log(`  Found ${urlPaths.length} URLs from sitemaps`);
		} else {
			console.log(`  ${changedFiles.length} files changed:`);
			changedFiles.forEach((f) => console.log(`    ${f}`));

			// Map changed files to URL paths
			const urlSet = new Set();
			for (const file of changedFiles) {
				const urls = sourceFileToUrls(file);
				urls.forEach((u) => urlSet.add(u));
			}
			urlPaths = [...urlSet];

			if (urlPaths.length === 0) {
				console.log('\n  No indexable page changes detected. Nothing to submit.');
				process.exit(0);
			}

			console.log(`\n  Mapped to ${urlPaths.length} unique URL paths:`);
			urlPaths.forEach((u) => console.log(`    ${u}`));
		}
	}

	// Deduplicate and sort
	urlPaths = [...new Set(urlPaths)].sort();

	if (urlPaths.length === 0) {
		console.log('\nNo URLs to submit.');
		process.exit(0);
	}

	// Submit for each domain
	console.log(`\n[IndexNow] Submitting ${urlPaths.length} URL paths for ${DOMAINS.length} domains...\n`);

	for (const domain of DOMAINS) {
		await submitToIndexNow(domain, urlPaths);
	}

	console.log('\n=== Done ===');
}

main().catch((e) => {
	console.error('Fatal error:', e);
	process.exit(1);
});
