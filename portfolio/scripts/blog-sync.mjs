#!/usr/bin/env node

/**
 * Blog sync script.
 *
 * Reads every local blog post and syncs to Dev.to and Hashnode:
 *   - Creates posts that don't exist on the platform
 *   - Updates posts whose content has changed
 *   - Skips posts that are already up-to-date
 *
 * X/Twitter is excluded — tweets are fire-and-forget.
 *
 * Zero external dependencies — uses only Node.js built-in modules.
 *
 * Usage:
 *   node scripts/blog-sync.mjs                           # sync all posts to all platforms
 *   node scripts/blog-sync.mjs --platform devto           # sync only to Dev.to
 *   node scripts/blog-sync.mjs --platform hashnode         # sync only to Hashnode
 *   node scripts/blog-sync.mjs --dry-run                  # preview without submitting
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SITE_URL = 'https://umesh-malik.com';
const DEFAULT_COVER_IMAGE = '';
const POST_EXTENSIONS = ['.md', '.mdx', '.svx'];

const DEV_TO_API_KEY = process.env.DEV_TO_API_KEY || '';
const HASHNODE_TOKEN = process.env.HASHNODE_TOKEN || '';
const HASHNODE_PUBLICATION_ID = process.env.HASHNODE_PUBLICATION_ID || '';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const getArg = (flag) => {
	const idx = args.indexOf(flag);
	return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const platformArg = getArg('--platform') || 'all'; // devto | hashnode | all
const dryRun = hasFlag('--dry-run');
const DEVTO_MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Frontmatter parser (duplicated from blog-syndicate.mjs)
// ---------------------------------------------------------------------------

function parseFrontmatter(raw) {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) return { meta: {}, body: raw };

	const yamlBlock = match[1];
	const body = raw.slice(match[0].length).trim();
	const meta = {};
	const lines = yamlBlock.split('\n');

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const kvMatch = line.match(/^(\w+):\s*(.*)$/);
		if (!kvMatch) continue;

		const [, key, rawVal] = kvMatch;
		let val = rawVal.trim();

		// YAML list style:
		// tags:
		//   - one
		//   - two
		if (val === '') {
			const listItems = [];
			let j = i + 1;
			while (j < lines.length) {
				const listMatch = lines[j].match(/^\s*-\s+(.*)$/);
				if (!listMatch) break;
				listItems.push(listMatch[1].trim().replace(/^["']|["']$/g, ''));
				j++;
			}
			if (listItems.length > 0) {
				meta[key] = listItems;
				i = j - 1;
				continue;
			}
		}

		// Continuation lines for wrapped values
		let j = i + 1;
		while (j < lines.length && /^\s{2,}\S/.test(lines[j])) {
			val += ` ${lines[j].trim()}`;
			j++;
		}
		if (j > i + 1) i = j - 1;

		// JSON array: ["Tag1", "Tag2"]
		if (val.startsWith('[')) {
			try {
				val = JSON.parse(val);
			} catch {
				val = val
					.replace(/^\[|\]$/g, '')
					.split(',')
					.map((s) => s.trim().replace(/^["']|["']$/g, ''));
			}
		}
		// Quoted string
		else if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
			val = val.slice(1, -1);
		}
		// Boolean
		else if (val === 'true') val = true;
		else if (val === 'false') val = false;

		meta[key] = val;
	}

	return { meta, body };
}

// ---------------------------------------------------------------------------
// Content transforms (duplicated from blog-syndicate.mjs)
// ---------------------------------------------------------------------------

function makeAbsoluteUrls(markdown) {
	let output = markdown.replace(
		/(\]\()(\/(.*?))\)/g,
		(_, prefix, path) => `${prefix}${SITE_URL}${path})`
	);

	output = output.replace(/\b(src|href)=["']\/([^"']+)["']/g, (_, attr, path) => {
		return `${attr}="${SITE_URL}/${path}"`;
	});

	return output;
}

function getAttr(attrs, name) {
	const match = attrs.match(new RegExp(`${name}=(?:"([^"]*)"|'([^']*)')`));
	return match ? (match[1] ?? match[2] ?? '').trim() : '';
}

/**
 * Convert mdsvex-only syntax/components to plain Markdown for external platforms.
 */
function transformMdxForSyndication(markdown) {
	let output = markdown;

	// Remove mdsvex import blocks (not valid on Dev.to/Hashnode Markdown renderers)
	output = output.replace(/<script[\s\S]*?<\/script>/g, '').trim();

	// Convert custom video embeds into readable links
	output = output.replace(/<VideoEmbed\b([\s\S]*?)\/>/g, (_, attrs) => {
		const src = getAttr(attrs, 'src');
		const title = getAttr(attrs, 'title') || 'Video';
		const caption = getAttr(attrs, 'caption');
		const lines = [`🎥 **${title}**`];
		if (caption) lines.push(caption);
		if (src) lines.push(`Watch: ${src}`);
		return `\n${lines.join('\n')}\n`;
	});

	// Convert folder-tree component to a fenced text block
	output = output.replace(/<FolderTree\b[^>]*>([\s\S]*?)<\/FolderTree>/g, (_, tree) => {
		const cleanedTree = tree.replace(/^\s*\n/, '').replace(/\n\s*$/, '');
		return `\n\`\`\`text\n${cleanedTree}\n\`\`\`\n`;
	});

	// Convert callouts to blockquotes
	output = output.replace(/<Callout\b([^>]*)>([\s\S]*?)<\/Callout>/g, (_, attrs, body) => {
		const title = getAttr(attrs, 'title') || 'Note';
		const quoteBody = body.trim().replace(/\n/g, '\n> ');
		return `\n> **${title}**\n> ${quoteBody}\n`;
	});

	// Remove any remaining PascalCase component tags if present
	output = output.replace(/<\/?[A-Z][A-Za-z0-9]*\b[^>]*\/?>/g, '');

	// Convert author-only external link placeholders into real markdown links
	output = output.replace(
		/\[EXTERNAL LINK:\s*(.*?)\s*→\s*(https?:\/\/[^\]\s]+)\s*\]/g,
		'- [$1]($2)'
	);

	// Convert internal-link placeholders to a working blog link
	output = output.replace(
		/\[INTERNAL LINK:\s*(.*?)\s*→\s*([^\]]+)\]/g,
		'- [$1](' + SITE_URL + '/blog)'
	);

	// Dev.to commonly has issues rendering remote SVG embeds; keep them as clickable links
	output = output.replace(/!\[([^\]]*)\]\(([^)\s]+\.svg)\)/gi, '[$1]($2)');

	// Prevent large blank gaps after replacements
	output = output.replace(/\n{3,}/g, '\n\n');

	return output;
}

function appendBacklink(body, canonicalUrl) {
	return `${body}\n\n---\n\n*Originally published at [umesh-malik.com](${canonicalUrl})*`;
}

/**
 * Check if a frontmatter image actually exists on disk.
 * Returns the image path if it exists, or DEFAULT_COVER_IMAGE if not.
 */
function resolveImage(imagePath) {
	if (!imagePath) return DEFAULT_COVER_IMAGE;

	// imagePath is like "/blog/xyz.jpg" — maps to "static/blog/xyz.jpg" on disk
	const staticDirs = ['portfolio/static', 'static'];
	for (const base of staticDirs) {
		const fullPath = resolve(process.cwd(), base, imagePath.replace(/^\//, ''));
		if (existsSync(fullPath)) return imagePath;
	}

	return DEFAULT_COVER_IMAGE;
}

function resolveSyndicationImage(imagePath) {
	const resolved = resolveImage(imagePath);
	if (/\.(jpe?g|png|webp)$/i.test(resolved)) return resolved;

	if (resolved.endsWith('.svg')) {
		const pngSibling = resolved.replace(/\.svg$/i, '.png');
		if (resolveImage(pngSibling) !== DEFAULT_COVER_IMAGE) return pngSibling;
	}

	return '';
}

function getSyndicationImageUrl(imagePath) {
	const path = resolveSyndicationImage(imagePath);
	return path ? `${SITE_URL}${path}` : null;
}

// ---------------------------------------------------------------------------
// Read and parse a post by slug
// ---------------------------------------------------------------------------

function readPost(slug) {
	const possibleDirs = ['portfolio/src/lib/posts', 'src/lib/posts'];

	for (const dir of possibleDirs) {
		for (const ext of POST_EXTENSIONS) {
			try {
				const filePath = resolve(process.cwd(), dir, `${slug}${ext}`);
				const raw = readFileSync(filePath, 'utf8');
				const { meta, body } = parseFrontmatter(raw);
				return {
					slug,
					title: meta.title || slug,
					description: meta.description || '',
					tags: Array.isArray(meta.tags) ? meta.tags : [],
					image: resolveImage(meta.image),
					publishDate: meta.publishDate || '',
					published: meta.published !== false,
					canonicalUrl: `${SITE_URL}/blog/${meta.slug || slug}`,
					body: makeAbsoluteUrls(transformMdxForSyndication(body))
				};
			} catch {
				/* try next extension */
			}
		}
	}

	console.error(`[error] Could not read post: ${slug}`);
	return null;
}

// ---------------------------------------------------------------------------
// Read all posts from disk
// ---------------------------------------------------------------------------

function readAllPosts() {
	const possibleDirs = ['portfolio/src/lib/posts', 'src/lib/posts'];
	let postsDir = null;

	for (const dir of possibleDirs) {
		try {
			const fullPath = resolve(process.cwd(), dir);
			readdirSync(fullPath);
			postsDir = dir;
			break;
		} catch {
			/* try next */
		}
	}

	if (!postsDir) {
		console.error('[error] Could not find posts directory');
		return [];
	}

	const fullPath = resolve(process.cwd(), postsDir);
	const files = readdirSync(fullPath).filter((f) => /\.(md|mdx|svx)$/i.test(f));
	const posts = [];

	for (const file of files) {
		const slug = file.replace(/\.(md|mdx|svx)$/i, '');
		const post = readPost(slug);
		if (!post) continue;
		if (!post.published) {
			console.log(`  [skip] ${slug} — published: false`);
			continue;
		}
		posts.push(post);
	}

	return posts;
}

// ---------------------------------------------------------------------------
// Normalize content for comparison
// ---------------------------------------------------------------------------

function normalizeContent(text) {
	return text.replace(/\r\n/g, '\n').trim();
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPastDate(dateStr) {
	if (!dateStr) return false;
	const dt = new Date(dateStr);
	if (Number.isNaN(dt.getTime())) return false;
	return dt.getTime() <= Date.now();
}

async function parseResponse(resp) {
	const text = await resp.text();
	let json = null;
	try {
		json = text ? JSON.parse(text) : null;
	} catch {
		// Some APIs return plain text for transient errors (e.g., "Retry later")
	}
	return { text, json };
}

function shouldRetryDevTo(resp, text) {
	if (resp.status === 429 || resp.status >= 500) return true;
	return /retry later|rate limit|too many requests/i.test(text || '');
}

async function devToRequest(method, url, payload) {
	let lastError = null;

	for (let attempt = 1; attempt <= DEVTO_MAX_RETRIES; attempt++) {
		try {
			const resp = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
					'api-key': DEV_TO_API_KEY
				},
				body: JSON.stringify(payload)
			});

			const { text, json } = await parseResponse(resp);
			if (resp.ok) return { text, json };

			if (attempt < DEVTO_MAX_RETRIES && shouldRetryDevTo(resp, text)) {
				await sleep(500 * 2 ** (attempt - 1));
				continue;
			}

			const errBody = json ? JSON.stringify(json) : (text || '(empty response)');
			throw new Error(`HTTP ${resp.status}: ${errBody}`);
		} catch (e) {
			lastError = e;
			if (attempt < DEVTO_MAX_RETRIES) {
				await sleep(500 * 2 ** (attempt - 1));
				continue;
			}
		}
	}

	throw lastError || new Error('Dev.to request failed');
}

// ---------------------------------------------------------------------------
// Dev.to — fetch existing articles
// ---------------------------------------------------------------------------

async function fetchDevToArticles() {
	const articles = [];
	let page = 1;

	while (true) {
		const resp = await fetch(`https://dev.to/api/articles/me/all?per_page=1000&page=${page}`, {
			headers: { 'api-key': DEV_TO_API_KEY }
		});

		if (!resp.ok) {
			console.error(`  [error] Dev.to fetch → HTTP ${resp.status}`);
			return null;
		}

		const data = await resp.json();
		if (data.length === 0) break;

		articles.push(...data);
		if (data.length < 1000) break;
		page++;
	}

	return articles;
}

// ---------------------------------------------------------------------------
// Dev.to — build payload
// ---------------------------------------------------------------------------

function buildDevToPayload(post) {
	const tags = post.tags
		.slice(0, 4)
		.map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, ''));

	const syndicationImageUrl = getSyndicationImageUrl(post.image);

	const payload = {
		article: {
			title: post.title,
			body_markdown: appendBacklink(post.body, post.canonicalUrl),
			published: true,
			canonical_url: post.canonicalUrl,
			description: post.description,
			tags
		}
	};

	if (syndicationImageUrl) payload.article.main_image = syndicationImageUrl;
	return payload;
}

// ---------------------------------------------------------------------------
// Dev.to — create article
// ---------------------------------------------------------------------------

async function createDevToArticle(post) {
	const payload = buildDevToPayload(post);
	const { json, text } = await devToRequest('POST', 'https://dev.to/api/articles', payload);
	return json?.url || text;
}

// ---------------------------------------------------------------------------
// Dev.to — update article
// ---------------------------------------------------------------------------

async function updateDevToArticle(articleId, post) {
	const payload = buildDevToPayload(post);
	const { json, text } = await devToRequest('PUT', `https://dev.to/api/articles/${articleId}`, payload);
	return json?.url || text;
}

// ---------------------------------------------------------------------------
// Dev.to — sync all posts
// ---------------------------------------------------------------------------

async function syncDevTo(posts) {
	if (!DEV_TO_API_KEY) {
		console.log('[skip] Dev.to — DEV_TO_API_KEY not set');
		return { created: 0, updated: 0, skipped: 0, failed: 0 };
	}

	console.log('\n--- Dev.to ---\n');

	const counts = { created: 0, updated: 0, skipped: 0, failed: 0 };

	if (dryRun) {
		console.log('[dry-run] Fetching existing Dev.to articles...');
	}

	const existing = await fetchDevToArticles();
	if (existing === null) {
		console.error('[error] Could not fetch Dev.to articles, skipping platform');
		counts.failed = posts.length;
		return counts;
	}

	console.log(`  Found ${existing.length} existing article(s) on Dev.to\n`);

	// Index by canonical_url for fast lookup
	const byCanonical = new Map();
	for (const article of existing) {
		if (article.canonical_url) {
			byCanonical.set(article.canonical_url, article);
		}
	}

	for (const post of posts) {
		const match = byCanonical.get(post.canonicalUrl);

		if (!match) {
			// CREATE
			if (dryRun) {
				console.log(`  [dry-run] CREATE "${post.title}"`);
				counts.created++;
				continue;
			}
			try {
				const url = await createDevToArticle(post);
				console.log(`  [created] "${post.title}" → ${url}`);
				counts.created++;
			} catch (e) {
				console.error(`  [error] CREATE "${post.title}" → ${e.message}`);
				counts.failed++;
			}
		} else {
			// Compare content (include backlink footer so uploaded body matches)
			const localBody = normalizeContent(appendBacklink(post.body, post.canonicalUrl));
			const remoteBody = normalizeContent(match.body_markdown || '');
			const bodyChanged = localBody !== remoteBody;

			// Check if cover image is missing on remote (broken 404 URLs result in null)
			const imageNeedsFix = !match.cover_image && post.image;

			if (!bodyChanged && !imageNeedsFix) {
				// SKIP
				console.log(`  [skip] "${post.title}" — unchanged`);
				counts.skipped++;
			} else {
				// UPDATE
				const reasons = [bodyChanged && 'body', imageNeedsFix && 'cover image missing'].filter(Boolean).join(', ');
				if (dryRun) {
					console.log(`  [dry-run] UPDATE "${post.title}" (id: ${match.id}) — ${reasons}`);
					counts.updated++;
					continue;
				}
				try {
					const url = await updateDevToArticle(match.id, post);
					console.log(`  [updated] "${post.title}" → ${url} — ${reasons}`);
					counts.updated++;
				} catch (e) {
					console.error(`  [error] UPDATE "${post.title}" → ${e.message}`);
					counts.failed++;
				}
			}
		}
	}

	return counts;
}

// ---------------------------------------------------------------------------
// Hashnode — fetch existing posts
// ---------------------------------------------------------------------------

async function fetchHashnodePosts() {
	const posts = [];
	let cursor = null;

	const query = `
		query Posts($id: ObjectId!, $first: Int!, $after: String) {
			publication(id: $id) {
				posts(first: $first, after: $after) {
					edges {
						node {
							id
							title
							url
							coverImage {
								url
							}
							content {
								markdown
							}
						}
					}
					pageInfo {
						hasNextPage
						endCursor
					}
				}
			}
		}
	`;

	while (true) {
		const variables = {
			id: HASHNODE_PUBLICATION_ID,
			first: 50,
			...(cursor ? { after: cursor } : {})
		};

		const resp = await fetch('https://gql.hashnode.com', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: HASHNODE_TOKEN
			},
			body: JSON.stringify({ query, variables })
		});

		const data = await resp.json();

		if (data.errors) {
			console.error(`  [error] Hashnode fetch → ${JSON.stringify(data.errors)}`);
			return null;
		}

		const connection = data.data?.publication?.posts;
		if (!connection) break;

		for (const edge of connection.edges) {
			posts.push(edge.node);
		}

		if (!connection.pageInfo.hasNextPage) break;
		cursor = connection.pageInfo.endCursor;
	}

	return posts;
}

// ---------------------------------------------------------------------------
// Hashnode — build input
// ---------------------------------------------------------------------------

function buildHashnodeInput(post, options = {}) {
	const { includePublishedAt = false } = options;
	const tags = post.tags.map((t) => ({
		slug: t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
		name: t
	}));

	const syndicationImageUrl = getSyndicationImageUrl(post.image);
	// Prepend cover image in body so Hashnode always shows it as thumbnail
	const bodyWithCover = syndicationImageUrl ? `![cover](${syndicationImageUrl})\n\n${post.body}` : post.body;

	const input = {
		title: post.title,
		contentMarkdown: appendBacklink(bodyWithCover, post.canonicalUrl),
		tags,
		originalArticleURL: post.canonicalUrl
	};

	// Hashnode rejects future publish dates; only send for new posts when safely in the past.
	if (includePublishedAt && isPastDate(post.publishDate)) {
		input.publishedAt = new Date(post.publishDate).toISOString();
	}

	if (syndicationImageUrl) {
		input.coverImageOptions = { coverImageURL: syndicationImageUrl };
	}

	return input;
}

// ---------------------------------------------------------------------------
// Hashnode — create post
// ---------------------------------------------------------------------------

async function createHashnodePost(post) {
	const mutation = `
		mutation PublishPost($input: PublishPostInput!) {
			publishPost(input: $input) {
				post {
					id
					url
					title
				}
			}
		}
	`;

	const input = {
		...buildHashnodeInput(post, { includePublishedAt: true }),
		publicationId: HASHNODE_PUBLICATION_ID
	};

	const resp = await fetch('https://gql.hashnode.com', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: HASHNODE_TOKEN
		},
		body: JSON.stringify({ query: mutation, variables: { input } })
	});

	const data = await resp.json();

	if (data.errors) {
		throw new Error(JSON.stringify(data.errors));
	}

	return data.data?.publishPost?.post?.url;
}

// ---------------------------------------------------------------------------
// Hashnode — update post
// ---------------------------------------------------------------------------

async function updateHashnodePost(postId, post) {
	const mutation = `
		mutation UpdatePost($input: UpdatePostInput!) {
			updatePost(input: $input) {
				post {
					id
					url
					title
				}
			}
		}
	`;

	const input = {
		...buildHashnodeInput(post, { includePublishedAt: false }),
		id: postId
	};

	const resp = await fetch('https://gql.hashnode.com', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: HASHNODE_TOKEN
		},
		body: JSON.stringify({ query: mutation, variables: { input } })
	});

	const data = await resp.json();

	if (data.errors) {
		throw new Error(JSON.stringify(data.errors));
	}

	return data.data?.updatePost?.post?.url;
}

// ---------------------------------------------------------------------------
// Hashnode — sync all posts
// ---------------------------------------------------------------------------

async function syncHashnode(posts) {
	if (!HASHNODE_TOKEN || !HASHNODE_PUBLICATION_ID) {
		console.log('[skip] Hashnode — HASHNODE_TOKEN or HASHNODE_PUBLICATION_ID not set');
		return { created: 0, updated: 0, skipped: 0, failed: 0 };
	}

	console.log('\n--- Hashnode ---\n');

	const counts = { created: 0, updated: 0, skipped: 0, failed: 0 };

	if (dryRun) {
		console.log('[dry-run] Fetching existing Hashnode posts...');
	}

	const existing = await fetchHashnodePosts();
	if (existing === null) {
		console.error('[error] Could not fetch Hashnode posts, skipping platform');
		counts.failed = posts.length;
		return counts;
	}

	console.log(`  Found ${existing.length} existing post(s) on Hashnode\n`);

	// Index by title for lookup
	const byTitle = new Map();
	for (const p of existing) {
		if (p.title) {
			byTitle.set(p.title, p);
		}
	}

	for (const post of posts) {
		const match = byTitle.get(post.title);

		if (!match) {
			// CREATE
			if (dryRun) {
				console.log(`  [dry-run] CREATE "${post.title}"`);
				counts.created++;
				continue;
			}
			try {
				const url = await createHashnodePost(post);
				console.log(`  [created] "${post.title}" → ${url}`);
				counts.created++;
			} catch (e) {
				console.error(`  [error] CREATE "${post.title}" → ${e.message}`);
				counts.failed++;
			}
		} else {
			// Compare content — Hashnode body includes prepended cover image + backlink
			const syndicationImageUrl = getSyndicationImageUrl(post.image);
			const bodyWithCover = syndicationImageUrl ? `![cover](${syndicationImageUrl})\n\n${post.body}` : post.body;
			const localBody = normalizeContent(appendBacklink(bodyWithCover, post.canonicalUrl));
			const remoteBody = normalizeContent(match.content?.markdown || '');
			const bodyChanged = localBody !== remoteBody;

			// Check if cover image is missing on remote (broken 404 URLs result in null)
			const imageNeedsFix = !match.coverImage?.url && post.image;

			if (!bodyChanged && !imageNeedsFix) {
				// SKIP
				console.log(`  [skip] "${post.title}" — unchanged`);
				counts.skipped++;
			} else {
				// UPDATE
				const reasons = [bodyChanged && 'body', imageNeedsFix && 'cover image missing'].filter(Boolean).join(', ');
				if (dryRun) {
					console.log(`  [dry-run] UPDATE "${post.title}" (id: ${match.id}) — ${reasons}`);
					counts.updated++;
					continue;
				}
				try {
					const url = await updateHashnodePost(match.id, post);
					console.log(`  [updated] "${post.title}" → ${url} — ${reasons}`);
					counts.updated++;
				} catch (e) {
					console.error(`  [error] UPDATE "${post.title}" → ${e.message}`);
					counts.failed++;
				}
			}
		}
	}

	return counts;
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

async function main() {
	console.log('=== Blog Sync ===\n');

	if (dryRun) console.log('[mode] Dry run — no changes will be made\n');
	console.log(`[platform] ${platformArg}\n`);

	// 1. Read all local posts
	console.log('Reading local posts...\n');
	const posts = readAllPosts();

	if (posts.length === 0) {
		console.log('\nNo published posts found.');
		process.exit(0);
	}

	console.log(`\nFound ${posts.length} published post(s):\n`);
	for (const p of posts) {
		console.log(`  - ${p.slug}`);
	}

	// 2. Sync to each platform
	const summary = {};

	if (platformArg === 'all' || platformArg === 'devto') {
		summary.devto = await syncDevTo(posts);
	}

	if (platformArg === 'all' || platformArg === 'hashnode') {
		summary.hashnode = await syncHashnode(posts);
	}

	// 3. Print summary
	console.log('\n=== Summary ===\n');

	let totalCreated = 0;
	let totalUpdated = 0;
	let totalSkipped = 0;
	let totalFailed = 0;

	for (const [platform, counts] of Object.entries(summary)) {
		console.log(`  ${platform}: ${counts.created} created, ${counts.updated} updated, ${counts.skipped} skipped, ${counts.failed} failed`);
		totalCreated += counts.created;
		totalUpdated += counts.updated;
		totalSkipped += counts.skipped;
		totalFailed += counts.failed;
	}

	console.log(`\n  Total: ${totalCreated} created, ${totalUpdated} updated, ${totalSkipped} skipped, ${totalFailed} failed`);
	console.log('\n=== Done ===');
}

main().catch((e) => {
	console.error('Fatal error:', e);
	process.exit(1);
});
