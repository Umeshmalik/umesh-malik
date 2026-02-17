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
const DEFAULT_COVER_IMAGE = '/blog/default-cover.jpg';

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

// ---------------------------------------------------------------------------
// Frontmatter parser (duplicated from blog-syndicate.mjs)
// ---------------------------------------------------------------------------

function parseFrontmatter(raw) {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) return { meta: {}, body: raw };

	const yamlBlock = match[1];
	const body = raw.slice(match[0].length).trim();
	const meta = {};

	for (const line of yamlBlock.split('\n')) {
		const kvMatch = line.match(/^(\w+):\s*(.*)$/);
		if (!kvMatch) continue;

		const [, key, rawVal] = kvMatch;
		let val = rawVal.trim();

		// JSON array: ["Tag1", "Tag2"]
		if (val.startsWith('[')) {
			try {
				val = JSON.parse(val);
			} catch {
				val = val.replace(/^\[|\]$/g, '').split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
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
	return markdown.replace(
		/(\]\()(\/(.*?))\)/g,
		(_, prefix, path) => `${prefix}${SITE_URL}${path})`
	);
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

// ---------------------------------------------------------------------------
// Read and parse a post by slug
// ---------------------------------------------------------------------------

function readPost(slug) {
	const possibleDirs = ['portfolio/src/lib/posts', 'src/lib/posts'];

	for (const dir of possibleDirs) {
		try {
			const filePath = resolve(process.cwd(), dir, `${slug}.md`);
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
				body: makeAbsoluteUrls(body)
			};
		} catch {
			/* try next directory */
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
	const files = readdirSync(fullPath).filter((f) => f.endsWith('.md'));
	const posts = [];

	for (const file of files) {
		const slug = file.replace(/\.md$/, '');
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

	return {
		article: {
			title: post.title,
			body_markdown: appendBacklink(post.body, post.canonicalUrl),
			published: true,
			canonical_url: post.canonicalUrl,
			description: post.description,
			tags,
			main_image: `${SITE_URL}${post.image || DEFAULT_COVER_IMAGE}`
		}
	};
}

// ---------------------------------------------------------------------------
// Dev.to — create article
// ---------------------------------------------------------------------------

async function createDevToArticle(post) {
	const payload = buildDevToPayload(post);

	const resp = await fetch('https://dev.to/api/articles', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'api-key': DEV_TO_API_KEY
		},
		body: JSON.stringify(payload)
	});

	const data = await resp.json();

	if (!resp.ok) {
		throw new Error(`HTTP ${resp.status}: ${JSON.stringify(data)}`);
	}

	return data.url;
}

// ---------------------------------------------------------------------------
// Dev.to — update article
// ---------------------------------------------------------------------------

async function updateDevToArticle(articleId, post) {
	const payload = buildDevToPayload(post);

	const resp = await fetch(`https://dev.to/api/articles/${articleId}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			'api-key': DEV_TO_API_KEY
		},
		body: JSON.stringify(payload)
	});

	const data = await resp.json();

	if (!resp.ok) {
		throw new Error(`HTTP ${resp.status}: ${JSON.stringify(data)}`);
	}

	return data.url;
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

			if (localBody === remoteBody) {
				// SKIP
				console.log(`  [skip] "${post.title}" — unchanged`);
				counts.skipped++;
			} else {
				// UPDATE
				if (dryRun) {
					console.log(`  [dry-run] UPDATE "${post.title}" (id: ${match.id})`);
					counts.updated++;
					continue;
				}
				try {
					const url = await updateDevToArticle(match.id, post);
					console.log(`  [updated] "${post.title}" → ${url}`);
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

function buildHashnodeInput(post) {
	const tags = post.tags.map((t) => ({
		slug: t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
		name: t
	}));

	return {
		title: post.title,
		contentMarkdown: appendBacklink(post.body, post.canonicalUrl),
		tags,
		originalArticleURL: post.canonicalUrl,
		coverImageOptions: { coverImageURL: `${SITE_URL}${post.image || DEFAULT_COVER_IMAGE}` },
		...(post.publishDate ? { publishedAt: new Date(post.publishDate).toISOString() } : {})
	};
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
		...buildHashnodeInput(post),
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
		...buildHashnodeInput(post),
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
			// Compare content (include backlink footer so uploaded body matches)
			const localBody = normalizeContent(appendBacklink(post.body, post.canonicalUrl));
			const remoteBody = normalizeContent(match.content?.markdown || '');

			if (localBody === remoteBody) {
				// SKIP
				console.log(`  [skip] "${post.title}" — unchanged`);
				counts.skipped++;
			} else {
				// UPDATE
				if (dryRun) {
					console.log(`  [dry-run] UPDATE "${post.title}" (id: ${match.id})`);
					counts.updated++;
					continue;
				}
				try {
					const url = await updateHashnodePost(match.id, post);
					console.log(`  [updated] "${post.title}" → ${url}`);
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
