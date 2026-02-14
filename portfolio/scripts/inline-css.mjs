/**
 * Post-build script: inlines render-blocking CSS and adds font preload hints.
 * - Inlines CSS into HTML to eliminate render-blocking stylesheet requests
 * - Resolves relative url() paths to absolute (critical when moving CSS into HTML)
 * - Adds <link rel="preload"> for latin font files only (most critical subset)
 * - Injects preload hints AFTER <meta charset> to keep charset in first 1024 bytes
 *
 * Runs after `vite build` and before deployment.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, posix } from 'path';

const buildDir = 'build';

function getAllHtmlFiles(dir) {
	const files = [];
	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			files.push(...getAllHtmlFiles(fullPath));
		} else if (entry.endsWith('.html')) {
			files.push(fullPath);
		}
	}
	return files;
}

/**
 * Resolve relative url() references in CSS to absolute paths.
 * e.g., url(inter-latin.woff2) in a CSS file at /_app/immutable/assets/0.css
 * becomes url(/_app/immutable/assets/inter-latin.woff2)
 */
function resolveRelativeUrls(css, cssHref) {
	const cssDir = posix.dirname(cssHref);
	return css.replace(/url\(["']?(?!data:|https?:|\/\/)([^"')]+)["']?\)/g, (_match, relPath) => {
		const absPath = posix.normalize(`${cssDir}/${relPath}`);
		return `url(${absPath})`;
	});
}

/**
 * Extract only the primary latin font URLs (not latin-ext, cyrillic, etc.)
 * to keep preload hints minimal and avoid pushing charset past 1024 bytes.
 */
function extractLatinFontUrls(css) {
	const fontUrls = new Set();
	const urlRegex = /url\(["']?([^"')]+\.woff2)["']?\)/g;
	for (const match of css.matchAll(urlRegex)) {
		const url = match[1];
		// Only preload primary latin subset — skip latin-ext, cyrillic, etc.
		if (url.includes('-latin-') && !url.includes('-latin-ext-')) {
			fontUrls.add(url);
		}
	}
	return [...fontUrls];
}

function buildPreloadTags(fontUrls) {
	return fontUrls
		.map(
			(url) =>
				`<link rel="preload" href="${url}" as="font" type="font/woff2" crossorigin>`
		)
		.join('\n\t\t');
}

const htmlFiles = getAllHtmlFiles(buildDir);
const cssCache = new Map();
let inlinedCount = 0;
let totalFonts = 0;

for (const htmlFile of htmlFiles) {
	let html = readFileSync(htmlFile, 'utf-8');
	let modified = false;
	const allFontUrls = [];

	// Match <link> stylesheet tags regardless of attribute order
	const cssRegex = /<link\s+[^>]*rel="stylesheet"[^>]*>/g;

	for (const match of html.matchAll(cssRegex)) {
		const linkTag = match[0];
		const hrefMatch = linkTag.match(/href="([^"]+\.css)"/);
		if (!hrefMatch) continue;

		const href = hrefMatch[1];
		const cssPath = join(buildDir, href);

		if (!cssCache.has(cssPath)) {
			try {
				const rawCss = readFileSync(cssPath, 'utf-8');
				cssCache.set(cssPath, { css: resolveRelativeUrls(rawCss, href), href });
			} catch {
				continue;
			}
		}

		const { css } = cssCache.get(cssPath);
		allFontUrls.push(...extractLatinFontUrls(css));
		html = html.replace(linkTag, `<style>${css}</style>`);
		modified = true;
	}

	// Inject font preload hints AFTER <meta charset="utf-8"> to keep charset in first 1024 bytes
	if (modified && allFontUrls.length > 0) {
		const preloadTags = buildPreloadTags(allFontUrls);
		html = html.replace(
			/<meta charset="utf-8"\s*\/?>/,
			(charsetTag) => `${charsetTag}\n\t\t${preloadTags}`
		);
		totalFonts = allFontUrls.length;
	}

	if (modified) {
		writeFileSync(htmlFile, html);
		inlinedCount++;
	}
}

console.log(`Inlined CSS in ${inlinedCount}/${htmlFiles.length} HTML files, preloading ${totalFonts} font files`);
