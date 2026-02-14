/**
 * Post-build script: inlines render-blocking CSS into HTML files.
 * Eliminates the CSS round-trip from the critical rendering path.
 *
 * Runs after `vite build` and before deployment.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

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

const htmlFiles = getAllHtmlFiles(buildDir);
const cssCache = new Map();
let inlinedCount = 0;

for (const htmlFile of htmlFiles) {
	let html = readFileSync(htmlFile, 'utf-8');
	let modified = false;

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
				cssCache.set(cssPath, readFileSync(cssPath, 'utf-8'));
			} catch {
				continue;
			}
		}

		const css = cssCache.get(cssPath);
		html = html.replace(linkTag, `<style>${css}</style>`);
		modified = true;
	}

	if (modified) {
		writeFileSync(htmlFile, html);
		inlinedCount++;
	}
}

console.log(`Inlined CSS in ${inlinedCount}/${htmlFiles.length} HTML files`);
