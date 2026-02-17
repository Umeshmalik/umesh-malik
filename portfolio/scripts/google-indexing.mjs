#!/usr/bin/env node

/**
 * Google Indexing API submission script.
 *
 * Uses a Google service account to request crawling/indexing of pages
 * via the Indexing API v3 (urlNotifications:publish).
 *
 * Auth:
 *   - CI:    reads JSON from SERVICE_ACCOUNT env var
 *   - Local: reads from ./service_account.json (gitignored)
 *
 * Usage:
 *   node scripts/google-indexing.mjs                          # auto-detect from git
 *   node scripts/google-indexing.mjs --before <sha>           # diff against a specific commit
 *   node scripts/google-indexing.mjs --sitemap                # fetch all URLs from sitemap
 *   node scripts/google-indexing.mjs --urls "/blog/my-post"   # submit specific paths
 *   node scripts/google-indexing.mjs --type URL_DELETED       # notify removal (default: URL_UPDATED)
 *   node scripts/google-indexing.mjs --dry-run                # preview without submitting
 */

import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleAuth } from 'google-auth-library';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DOMAINS = ['umesh-malik.com', 'umesh-malik.in'];
const INDEXING_API_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const INDEXING_SCOPE = 'https://www.googleapis.com/auth/indexing';

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
const notificationType = getArg('--type') || 'URL_UPDATED';

// ---------------------------------------------------------------------------
// Service account loading
// ---------------------------------------------------------------------------

function loadServiceAccount() {
	// 1. CI: SERVICE_ACCOUNT env var contains the JSON string
	if (process.env.SERVICE_ACCOUNT) {
		try {
			return JSON.parse(process.env.SERVICE_ACCOUNT);
		} catch (e) {
			console.error('[error] Failed to parse SERVICE_ACCOUNT env var:', e.message);
			process.exit(1);
		}
	}

	// 2. Local: service_account.json next to this script
	const localPath = resolve(__dirname, 'service_account.json');
	if (existsSync(localPath)) {
		try {
			return JSON.parse(readFileSync(localPath, 'utf8'));
		} catch (e) {
			console.error(`[error] Failed to read ${localPath}:`, e.message);
			process.exit(1);
		}
	}

	console.error(
		'[error] No service account found.\n' +
			'  Set SERVICE_ACCOUNT env var (JSON string) or place service_account.json in scripts/.'
	);
	process.exit(1);
}

// ---------------------------------------------------------------------------
// Auth — get access token via Google JWT
// ---------------------------------------------------------------------------

async function getAccessToken(serviceAccount) {
	const auth = new GoogleAuth({
		credentials: serviceAccount,
		scopes: [INDEXING_SCOPE]
	});
	const client = await auth.getClient();
	const { token } = await client.getAccessToken();
	return token;
}

// ---------------------------------------------------------------------------
// Source file → public URL mapping (shared logic with indexnow-submit.mjs)
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
// URL detection
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
// Google Indexing API submission
// ---------------------------------------------------------------------------

async function submitToGoogleIndexing(accessToken, domain, urlPaths) {
	let success = 0;
	let failed = 0;

	for (const path of urlPaths) {
		const fullUrl = `https://${domain}${path}`;

		if (dryRun) {
			console.log(`  [dry-run] ${notificationType} → ${fullUrl}`);
			success++;
			continue;
		}

		try {
			const resp = await fetch(INDEXING_API_ENDPOINT, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken}`
				},
				body: JSON.stringify({
					url: fullUrl,
					type: notificationType
				})
			});

			if (resp.ok) {
				const body = await resp.json();
				const notifyTime = body.urlNotificationMetadata?.latestUpdate?.notifyTime || 'N/A';
				console.log(`  ✓ ${fullUrl} → ${resp.status} (notifyTime: ${notifyTime})`);
				success++;
			} else {
				const errBody = await resp.text();
				console.error(`  ✗ ${fullUrl} → ${resp.status}: ${errBody}`);
				failed++;
			}
		} catch (e) {
			console.error(`  ✗ ${fullUrl} → FAILED: ${e.message}`);
			failed++;
		}

		// Small delay to avoid hitting rate limits (200 req/day quota)
		if (!dryRun) await new Promise((r) => setTimeout(r, 100));
	}

	return { success, failed };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	console.log('=== Google Indexing API Submission ===\n');
	console.log(`[type] ${notificationType}`);

	// 1. Load service account & authenticate
	console.log('\n[auth] Loading service account...');
	const serviceAccount = loadServiceAccount();
	console.log(`  Using service account: ${serviceAccount.client_email}`);

	const accessToken = await getAccessToken(serviceAccount);
	console.log('  Access token obtained.\n');

	// 2. Detect changed URL paths
	let urlPaths = await detectUrlPaths();
	urlPaths = [...new Set(urlPaths)].sort();

	if (urlPaths.length === 0) {
		console.log('\nNo URLs to submit.');
		process.exit(0);
	}

	console.log(`\n[submit] Sending ${urlPaths.length} URLs × ${DOMAINS.length} domains to Google Indexing API...`);

	// 3. Submit for each domain
	let totalSuccess = 0;
	let totalFailed = 0;

	for (const domain of DOMAINS) {
		console.log(`\n  --- ${domain} ---`);
		const { success, failed } = await submitToGoogleIndexing(accessToken, domain, urlPaths);
		totalSuccess += success;
		totalFailed += failed;
	}

	// 4. Summary
	console.log(`\n=== Done ===`);
	console.log(`  Total: ${totalSuccess} succeeded, ${totalFailed} failed`);

	if (totalFailed > 0) process.exit(1);
}

main().catch((e) => {
	console.error('Fatal error:', e);
	process.exit(1);
});
