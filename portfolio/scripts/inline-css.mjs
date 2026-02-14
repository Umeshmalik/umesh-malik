/**
 * Post-build script: inlines render-blocking CSS and adds font preload hints.
 * - Inlines CSS into HTML to eliminate render-blocking stylesheet requests
 * - Resolves relative url() paths to absolute (critical when moving CSS into HTML)
 * - Extracts font URLs from inlined CSS and adds <link rel="preload"> hints
 *   so fonts download in parallel with HTML parsing (no chain)
 *
 * Runs after `vite build` and before deployment.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, posix } from 'path';

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
	return css.replace(/url\(["']?(?!data:|https?:|\/\/)([^"')]+)["']?\)/g, (match, relPath) => {
		const absPath = posix.normalize(`${cssDir}/${relPath}`);
		return `url(${absPath})`;
	});
}

function extractFontUrls(css) {
	const fontUrls = new Set();
	const urlRegex = /url\(["']?([^"')]+\.woff2)["']?\)/g;
	for (const match of css.matchAll(urlRegex)) {
		fontUrls.add(match[1]);
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
				// Resolve relative URLs to absolute before caching
				cssCache.set(cssPath, { css: resolveRelativeUrls(rawCss, href), href });
			} catch {
				continue;
			}
		}

		const { css } = cssCache.get(cssPath);
		allFontUrls.push(...extractFontUrls(css));
		html = html.replace(linkTag, `<style>${css}</style>`);
		modified = true;
	}

	// Inject font preload hints right after <head> opening tag
	if (modified && allFontUrls.length > 0) {
		const preloadTags = buildPreloadTags(allFontUrls);
		html = html.replace('<head>', `<head>\n\t\t${preloadTags}`);
		totalFonts = allFontUrls.length;
	}

	if (modified) {
		writeFileSync(htmlFile, html);
		inlinedCount++;
	}
}

console.log(`Inlined CSS in ${inlinedCount}/${htmlFiles.length} HTML files, preloading ${totalFonts} font files`);
