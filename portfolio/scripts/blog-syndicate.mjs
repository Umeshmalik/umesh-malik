#!/usr/bin/env node

/**
 * Blog syndication script.
 *
 * Detects new blog posts via git diff and cross-posts them to:
 *   - Dev.to       (canonical_url → backlink to umesh-malik.com)
 *   - Hashnode     (originalArticleURL → backlink to umesh-malik.com)
 *   - X/Twitter    (tweet with link → social visibility)
 *
 * Zero external dependencies — uses only Node.js built-in modules.
 *
 * Usage:
 *   node scripts/blog-syndicate.mjs                        # auto-detect new posts from git diff
 *   node scripts/blog-syndicate.mjs --slug <name>          # syndicate a specific post by slug
 *   node scripts/blog-syndicate.mjs --before <sha>         # diff against a specific commit
 *   node scripts/blog-syndicate.mjs --dry-run              # preview without submitting
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHmac, randomBytes } from 'node:crypto';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SITE_URL = 'https://umesh-malik.com';
const POSTS_DIR = 'portfolio/src/lib/posts';
const POSSIBLE_POST_DIRS = ['portfolio/src/lib/posts', 'src/lib/posts'];
const DEFAULT_COVER_IMAGE = '/blog/default-cover.jpg';
const POST_EXTENSIONS = ['.md', '.mdx', '.svx'];

const DEV_TO_API_KEY = process.env.DEV_TO_API_KEY || '';
const HASHNODE_TOKEN = process.env.HASHNODE_TOKEN || '';
const HASHNODE_PUBLICATION_ID = process.env.HASHNODE_PUBLICATION_ID || '';
const X_API_KEY = process.env.X_API_KEY || '';
const X_API_SECRET = process.env.X_API_SECRET || '';
const X_ACCESS_TOKEN = process.env.X_ACCESS_TOKEN || '';
const X_ACCESS_TOKEN_SECRET = process.env.X_ACCESS_TOKEN_SECRET || '';

// ---------------------------------------------------------------------------
// CLI argument parsing (same pattern as indexnow-submit.mjs)
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const getArg = (flag) => {
	const idx = args.indexOf(flag);
	return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const slugArg = getArg('--slug');
const beforeSha = getArg('--before');
const dryRun = hasFlag('--dry-run');

// ---------------------------------------------------------------------------
// Frontmatter parser
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
// Content transforms
// ---------------------------------------------------------------------------

function makeAbsoluteUrls(markdown) {
	// Convert relative image/link paths to absolute URLs
	// Handles: ![alt](/blog/img.jpg) and [text](/path)
	return markdown.replace(
		/(\]\()(\/(.*?))\)/g,
		(_, prefix, path) => `${prefix}${SITE_URL}${path})`
	);
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

	const staticDirs = ['portfolio/static', 'static'];
	for (const base of staticDirs) {
		const fullPath = resolve(process.cwd(), base, imagePath.replace(/^\//, ''));
		if (existsSync(fullPath)) return imagePath;
	}

	return DEFAULT_COVER_IMAGE;
}

/**
 * External platforms are stricter with cover image formats.
 * Prefer raster (jpg/png/webp). If frontmatter points to SVG, try png sibling.
 */
function resolveSyndicationImage(imagePath) {
	const resolved = resolveImage(imagePath);
	if (/\.(jpe?g|png|webp)$/i.test(resolved)) return resolved;

	if (resolved.endsWith('.svg')) {
		const pngSibling = resolved.replace(/\.svg$/i, '.png');
		if (resolveImage(pngSibling) !== DEFAULT_COVER_IMAGE) return pngSibling;
	}

	return DEFAULT_COVER_IMAGE;
}

// ---------------------------------------------------------------------------
// Git diff detection — only NEW markdown files (not edits)
// ---------------------------------------------------------------------------

function getNewPostSlugs(beforeRef) {
	try {
		const ref = beforeRef || 'HEAD~1';
		const output = execSync(`git diff --name-only --diff-filter=A ${ref} HEAD`, {
			encoding: 'utf8',
			cwd: resolve(process.cwd())
		}).trim();

		if (!output) return [];

		const filePattern = new RegExp(
			`^(?:${POSSIBLE_POST_DIRS.map((d) => d.replace(/\//g, '\\/')).join('|')})\\/(.+)\\.(md|mdx|svx)$`
		);

		const slugs = output
			.split('\n')
			.filter(Boolean)
			.map((f) => {
				const match = f.match(filePattern);
				return match ? match[1] : null;
			})
			.filter(Boolean);

		return Array.from(new Set(slugs));
	} catch (e) {
		console.warn(`[warn] git diff failed: ${e.message}`);
		return [];
	}
}

// ---------------------------------------------------------------------------
// Read and parse a post by slug
// ---------------------------------------------------------------------------

function readPost(slug) {
	const possibleDirs = POSSIBLE_POST_DIRS;

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
// Dev.to submission
// ---------------------------------------------------------------------------

async function postToDevTo(post) {
	if (!DEV_TO_API_KEY) {
		console.log('  [skip] Dev.to — DEV_TO_API_KEY not set');
		return null;
	}

	// Dev.to tags: max 4, lowercase alphanumeric only (underscores allowed)
	const tags = post.tags
		.slice(0, 4)
		.map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, ''));

	const syndicationImage = resolveSyndicationImage(post.image);

	const payload = {
		article: {
			title: post.title,
			body_markdown: appendBacklink(post.body, post.canonicalUrl),
			published: true,
			canonical_url: post.canonicalUrl,
			description: post.description,
			tags,
			main_image: `${SITE_URL}${syndicationImage}`
		}
	};

	if (dryRun) {
		console.log('  [dry-run] Dev.to:');
		console.log(`    Title: ${post.title}`);
		console.log(`    Canonical: ${post.canonicalUrl}`);
		console.log(`    Tags: ${tags.join(', ')}`);
		console.log(`    Body length: ${post.body.length} chars`);
		console.log(`    Cover: ${SITE_URL}${syndicationImage}`);
		return { platform: 'devto', dryRun: true };
	}

	try {
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
			console.error(`  [error] Dev.to → HTTP ${resp.status}: ${JSON.stringify(data)}`);
			return null;
		}

		console.log(`  [ok] Dev.to → ${data.url}`);
		return { platform: 'devto', url: data.url };
	} catch (e) {
		console.error(`  [error] Dev.to → ${e.message}`);
		return null;
	}
}

// ---------------------------------------------------------------------------
// Hashnode submission (GraphQL)
// ---------------------------------------------------------------------------

async function postToHashnode(post) {
	if (!HASHNODE_TOKEN || !HASHNODE_PUBLICATION_ID) {
		console.log('  [skip] Hashnode — HASHNODE_TOKEN or HASHNODE_PUBLICATION_ID not set');
		return null;
	}

	const tags = post.tags.map((t) => ({
		slug: t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
		name: t
	}));

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

	const syndicationImage = resolveSyndicationImage(post.image);
	const coverUrl = `${SITE_URL}${syndicationImage}`;
	// Prepend cover image in body so Hashnode always shows it as thumbnail
	const bodyWithCover = `![cover](${coverUrl})\n\n${post.body}`;

	const variables = {
		input: {
			title: post.title,
			contentMarkdown: appendBacklink(bodyWithCover, post.canonicalUrl),
			publicationId: HASHNODE_PUBLICATION_ID,
			tags,
			originalArticleURL: post.canonicalUrl,
			coverImageOptions: { coverImageURL: coverUrl },
			...(post.publishDate ? { publishedAt: new Date(post.publishDate).toISOString() } : {})
		}
	};

	if (dryRun) {
		console.log('  [dry-run] Hashnode:');
		console.log(`    Title: ${post.title}`);
		console.log(`    Original URL: ${post.canonicalUrl}`);
		console.log(`    Tags: ${tags.map((t) => t.name).join(', ')}`);
		console.log(`    Body length: ${post.body.length} chars`);
		console.log(`    Cover: ${SITE_URL}${post.image || DEFAULT_COVER_IMAGE}`);
		return { platform: 'hashnode', dryRun: true };
	}

	try {
		const resp = await fetch('https://gql.hashnode.com', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: HASHNODE_TOKEN
			},
			body: JSON.stringify({ query: mutation, variables })
		});

		const data = await resp.json();

		if (data.errors) {
			console.error(`  [error] Hashnode → ${JSON.stringify(data.errors)}`);
			return null;
		}

		const postUrl = data.data?.publishPost?.post?.url;
		console.log(`  [ok] Hashnode → ${postUrl}`);
		return { platform: 'hashnode', url: postUrl };
	} catch (e) {
		console.error(`  [error] Hashnode → ${e.message}`);
		return null;
	}
}

// ---------------------------------------------------------------------------
// X/Twitter posting (OAuth 1.0a with HMAC-SHA1)
// ---------------------------------------------------------------------------

function percentEncode(str) {
	return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function buildOAuthHeader(method, url, params) {
	const oauthParams = {
		oauth_consumer_key: X_API_KEY,
		oauth_nonce: randomBytes(16).toString('hex'),
		oauth_signature_method: 'HMAC-SHA1',
		oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
		oauth_token: X_ACCESS_TOKEN,
		oauth_version: '1.0'
	};

	// Combine all params for signature base string
	const allParams = { ...oauthParams, ...params };
	const paramString = Object.keys(allParams)
		.sort()
		.map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
		.join('&');

	const baseString = [method.toUpperCase(), percentEncode(url), percentEncode(paramString)].join('&');

	const signingKey = `${percentEncode(X_API_SECRET)}&${percentEncode(X_ACCESS_TOKEN_SECRET)}`;
	const signature = createHmac('sha1', signingKey).update(baseString).digest('base64');

	oauthParams.oauth_signature = signature;

	const header = Object.keys(oauthParams)
		.sort()
		.map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
		.join(', ');

	return `OAuth ${header}`;
}

async function postToTwitter(post) {
	if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_TOKEN_SECRET) {
		console.log('  [skip] X/Twitter — X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, or X_ACCESS_TOKEN_SECRET not set');
		return null;
	}

	// Build tweet: Title + URL + hashtags
	// t.co shortens all URLs to 23 chars
	const hashtags = post.tags
		.slice(0, 3)
		.map((t) => `#${t.replace(/[^a-zA-Z0-9]/g, '')}`);

	const tcoLength = 23;
	const hashtagStr = hashtags.join(' ');
	// Title + \n\n + URL(23) + \n\n + hashtags
	const overhead = 2 + tcoLength + 2 + hashtagStr.length;
	const maxTitleLen = 280 - overhead;
	let title = post.title;
	if (title.length > maxTitleLen) {
		title = title.slice(0, maxTitleLen - 1) + '…';
	}

	const tweetText = `${title}\n\n${post.canonicalUrl}\n\n${hashtagStr}`;

	if (dryRun) {
		console.log('  [dry-run] X/Twitter:');
		console.log(`    Tweet (${tweetText.length} chars, effective ~${title.length + overhead} with t.co):`);
		console.log(`    ---`);
		console.log(`    ${tweetText.split('\n').join('\n    ')}`);
		console.log(`    ---`);
		return { platform: 'twitter', dryRun: true };
	}

	const apiUrl = 'https://api.x.com/2/tweets';
	const payload = JSON.stringify({ text: tweetText });
	const authHeader = buildOAuthHeader('POST', apiUrl, {});

	try {
		const resp = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: authHeader
			},
			body: payload
		});

		const data = await resp.json();

		if (!resp.ok) {
			console.error(`  [error] X/Twitter → HTTP ${resp.status}: ${JSON.stringify(data)}`);
			return null;
		}

		const tweetId = data.data?.id;
		const tweetUrl = tweetId ? `https://x.com/i/status/${tweetId}` : '(posted)';
		console.log(`  [ok] X/Twitter → ${tweetUrl}`);
		return { platform: 'twitter', url: tweetUrl };
	} catch (e) {
		console.error(`  [error] X/Twitter → ${e.message}`);
		return null;
	}
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

async function main() {
	console.log('=== Blog Syndication ===\n');

	// 1. Determine which posts to syndicate
	let slugs;

	if (slugArg) {
		console.log(`[mode] Specific slug: ${slugArg}`);
		slugs = [slugArg];
	} else {
		console.log('[mode] Git diff detection (new posts only)');
		slugs = getNewPostSlugs(beforeSha);
	}

	if (slugs.length === 0) {
		console.log('\nNo new blog posts detected.');
		process.exit(0);
	}

	console.log(`\nFound ${slugs.length} post(s) to syndicate:`);
	slugs.forEach((s) => console.log(`  - ${s}`));

	// 2. Process each post
	for (const slug of slugs) {
		console.log(`\n--- Syndicating: ${slug} ---\n`);

		const post = readPost(slug);
		if (!post) continue;

		console.log(`  Title: ${post.title}`);
		console.log(`  Canonical: ${post.canonicalUrl}`);
		console.log(`  Tags: ${post.tags.join(', ')}`);
		console.log('');

		// Submit to all platforms (continue even if one fails)
		const results = [];
		results.push(await postToDevTo(post));
		results.push(await postToHashnode(post));
		results.push(await postToTwitter(post));

		const succeeded = results.filter(Boolean).length;
		console.log(`\n  ${succeeded}/${results.length} platforms completed`);
	}

	console.log('\n=== Done ===');
}

main().catch((e) => {
	console.error('Fatal error:', e);
	process.exit(1);
});
