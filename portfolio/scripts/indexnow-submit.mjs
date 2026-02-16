#!/usr/bin/env node

/**
 * Smart SEO submission script.
 *
 * Detects which pages changed via git diff, maps source files to public URLs,
 * and submits them to search engines for fast indexing.
 *
 * Engines:
 *   - IndexNow  → Bing, Yandex, DuckDuckGo, Seznam, Naver
 *   - WebSub    → Google PubSubHubbub
 *
 * Usage:
 *   node scripts/indexnow-submit.mjs                          # auto-detect from git
 *   node scripts/indexnow-submit.mjs --before <sha>           # diff against a specific commit
 *   node scripts/indexnow-submit.mjs --sitemap                # fallback: fetch all URLs from sitemap
 *   node scripts/indexnow-submit.mjs --urls "/blog/my-post"   # submit specific paths
 *   node scripts/indexnow-submit.mjs --dry-run                # preview without submitting
 */

import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const INDEXNOW_KEY = 'b52fd35b0ee3234d8074e58fa2591da9';
const DOMAINS = ['umesh-malik.com', 'umesh-malik.in'];
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const WEBSUB_HUB = 'https://pubsubhubbub.appspot.com';
const FEEDS = ['/rss.xml', '/blog-feed.xml', '/feed.json'];
const MAX_URLS_PER_REQUEST = 10000;

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const getArg = (flag) => {
	const idx = args.indexOf(flag);
	return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const beforeSha = getArg('--before');
const manualUrls = getArg('--urls');
const useSitemap = hasFlag('--sitemap');
const dryRun = hasFlag('--dry-run');

// ---------------------------------------------------------------------------
// Source file → public URL mapping
// ---------------------------------------------------------------------------

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

function sourceFileToUrls(filePath) {
	if (filePath.match(/^portfolio\/src\/lib\/posts\/(.+)\.md$/)) {
		const slug = filePath.match(/^portfolio\/src\/lib\/posts\/(.+)\.md$/)[1];
		return [`/blog/${slug}`, '/blog'];
	}

	const routeMatch = filePath.match(
		/^portfolio\/src\/routes\/(.+?)\/\+page\.(svelte|ts|server\.ts)$/
	);
	if (routeMatch) {
		let routePath = routeMatch[1];
		if (routePath.includes('[')) routePath = routePath.replace(/\/\[.*$/, '');
		if (routePath.match(/\.(xml|json|txt)/)) return [];
		return [`/${routePath}`];
	}

	if (
		filePath.match(/^portfolio\/src\/routes\/\+layout/) ||
		filePath.match(/^portfolio\/src\/app\.(html|css)$/) ||
		filePath.match(/^portfolio\/src\/lib\/components\/layout\//) ||
		filePath.match(/^portfolio\/src\/lib\/config\/site\.ts$/) ||
		filePath.match(/^portfolio\/src\/lib\/components\/.*(SEO|seo)/)
	) {
		return STATIC_PAGES;
	}

	if (
		filePath.match(/^portfolio\/src\/lib\/utils\/blog\.ts$/) ||
		filePath.match(/^portfolio\/src\/lib\/components\/blog\//)
	) {
		return ['/blog', ...getBlogPostPaths()];
	}

	if (filePath.match(/^portfolio\/static\//)) {
		if (filePath.match(/\.(txt|xml|json)$/)) return [];
		return ['/'];
	}

	if (filePath.match(/^frontend\//)) {
		return STATIC_PAGES.filter((p) => p.startsWith('/projects/retro-portfolio'));
	}

	return [];
}

function getBlogPostPaths() {
	for (const dir of ['portfolio/src/lib/posts', 'src/lib/posts']) {
		try {
			return readdirSync(resolve(process.cwd(), dir))
				.filter((f) => f.endsWith('.md'))
				.map((f) => `/blog/${f.replace('.md', '')}`);
		} catch {
			/* try next */
		}
	}
	return [];
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
		return output ? output.split('\n').filter(Boolean) : [];
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
	for (const path of ['/sitemap.xml', '/blog-sitemap.xml']) {
		try {
			const resp = await fetch(`https://${domain}${path}`);
			if (!resp.ok) continue;
			const xml = await resp.text();
			for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
				try {
					urls.push(new URL(match[1]).pathname);
				} catch {
					urls.push(match[1]);
				}
			}
		} catch (e) {
			console.warn(`[warn] Failed to fetch ${path}: ${e.message}`);
		}
	}
	return urls;
}

// ---------------------------------------------------------------------------
// URL detection (main logic)
// ---------------------------------------------------------------------------

async function detectUrlPaths() {
	if (manualUrls) {
		const paths = manualUrls.split(',').map((u) => u.trim());
		console.log(`[mode] Manual URLs: ${paths.length} paths provided`);
		return paths;
	}

	if (useSitemap) {
		console.log('[mode] Sitemap fallback: fetching all URLs from sitemaps...');
		const paths = await fetchUrlsFromSitemap(DOMAINS[0]);
		console.log(`  Found ${paths.length} URLs from sitemaps`);
		return paths;
	}

	console.log('[mode] Git diff detection');
	const changedFiles = getChangedFiles(beforeSha);

	if (changedFiles.length === 0) {
		console.log('  No changed files detected. Falling back to sitemap...');
		const paths = await fetchUrlsFromSitemap(DOMAINS[0]);
		console.log(`  Found ${paths.length} URLs from sitemaps`);
		return paths;
	}

	console.log(`  ${changedFiles.length} files changed:`);
	changedFiles.forEach((f) => console.log(`    ${f}`));

	const urlSet = new Set();
	for (const file of changedFiles) {
		sourceFileToUrls(file).forEach((u) => urlSet.add(u));
	}

	const paths = [...urlSet];
	if (paths.length === 0) {
		console.log('\n  No indexable page changes detected.');
	} else {
		console.log(`\n  Mapped to ${paths.length} unique URL paths:`);
		paths.forEach((u) => console.log(`    ${u}`));
	}
	return paths;
}

// ---------------------------------------------------------------------------
// Submission: IndexNow
// ---------------------------------------------------------------------------

async function submitIndexNow(domain, urlPaths) {
	const fullUrls = urlPaths.map((p) => `https://${domain}${p}`);

	for (let i = 0; i < fullUrls.length; i += MAX_URLS_PER_REQUEST) {
		const batch = fullUrls.slice(i, i + MAX_URLS_PER_REQUEST);
		const payload = {
			host: domain,
			key: INDEXNOW_KEY,
			keyLocation: `https://${domain}/${INDEXNOW_KEY}.txt`,
			urlList: batch
		};

		if (dryRun) {
			console.log(`  [dry-run] Would submit ${batch.length} URLs for ${domain}`);
			return;
		}

		try {
			const resp = await fetch(INDEXNOW_ENDPOINT, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
				body: JSON.stringify(payload)
			});
			const label =
				{ 200: 'OK', 202: 'Accepted', 400: 'Bad Request', 403: 'Forbidden', 422: 'Unprocessable', 429: 'Rate Limited' }[
					resp.status
				] || resp.statusText;
			console.log(`  ${domain} → HTTP ${resp.status} (${label}) [${batch.length} URLs]`);
		} catch (e) {
			console.error(`  ${domain} → FAILED: ${e.message}`);
		}
	}
}

// ---------------------------------------------------------------------------
// Submission: WebSub (Google PubSubHubbub)
// ---------------------------------------------------------------------------

async function submitWebSub(domain) {
	for (const feed of FEEDS) {
		const feedUrl = `https://${domain}${feed}`;
		if (dryRun) {
			console.log(`  [dry-run] Would ping ${feedUrl}`);
			continue;
		}
		try {
			const resp = await fetch(WEBSUB_HUB, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: `hub.mode=publish&hub.url=${encodeURIComponent(feedUrl)}`
			});
			console.log(`  ${domain}${feed} → HTTP ${resp.status}`);
		} catch (e) {
			console.error(`  ${domain}${feed} → FAILED: ${e.message}`);
		}
	}
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	console.log('=== SEO Submission ===\n');

	// 1. Detect changed URL paths
	let urlPaths = await detectUrlPaths();
	urlPaths = [...new Set(urlPaths)].sort();

	if (urlPaths.length === 0) {
		console.log('\nNo URLs to submit.');
		process.exit(0);
	}

	// 2. IndexNow → Bing, Yandex, DuckDuckGo, Seznam, Naver
	console.log(`\n[IndexNow] Submitting ${urlPaths.length} URLs for ${DOMAINS.length} domains...`);
	for (const domain of DOMAINS) {
		await submitIndexNow(domain, urlPaths);
	}

	// 3. WebSub → Google
	console.log('\n[WebSub] Notifying Google via PubSubHubbub...');
	for (const domain of DOMAINS) {
		await submitWebSub(domain);
	}

	console.log('\n=== Done ===');
}

main().catch((e) => {
	console.error('Fatal error:', e);
	process.exit(1);
});
