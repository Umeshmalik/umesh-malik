interface Env {
	ASSETS: Fetcher;
	ANALYTICS: KVNamespace;
	ANALYTICS_SECRET: string;
}

interface EventBody {
	path: string;
	referrer: string;
	source: string;
	sessionId: string;
	type: 'pageview' | 'heartbeat';
}

interface DailyCounter {
	count: number;
}

const ALLOWED_ORIGINS = [
	'https://umesh-malik.com',
	'https://www.umesh-malik.com',
	'https://umesh-malik.in',
	'https://www.umesh-malik.in',
];

const MAX_PATH_LENGTH = 200;
const MAX_SOURCE_LENGTH = 50;

function todayKey(): string {
	return new Date().toISOString().slice(0, 10);
}

function dateKeys(days: number): string[] {
	const keys: string[] = [];
	const now = Date.now();
	for (let i = 0; i < days; i++) {
		const d = new Date(now - i * 86400000);
		keys.push(d.toISOString().slice(0, 10));
	}
	return keys;
}

function corsHeaders(request: Request): HeadersInit {
	const origin = request.headers.get('Origin') || '';
	const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
	return {
		'Access-Control-Allow-Origin': allowed,
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	};
}

function jsonResponse(request: Request, data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
	});
}

async function incrementCounter(kv: KVNamespace, key: string): Promise<number> {
	const raw = await kv.get(key);
	const data: DailyCounter = raw ? JSON.parse(raw) : { count: 0 };
	data.count += 1;
	await kv.put(key, JSON.stringify(data));
	return data.count;
}

function isAuthorized(request: Request, env: Env): boolean {
	const auth = request.headers.get('Authorization');
	if (!auth || !env.ANALYTICS_SECRET) return false;
	return auth === `Bearer ${env.ANALYTICS_SECRET}`;
}

function sanitize(value: string, maxLen: number): string {
	return value.slice(0, maxLen).replace(/[^\w\-\/.:@]/g, '');
}

function isBlogPostPath(path: string): boolean {
	// Must be /blog/<slug> — not /blog, /blog/, /blog/category/*, /blog/tag/*
	return /^\/blog\/[^/]+$/.test(path);
}

const BOT_PATTERN = /bot|crawl|spider|slurp|baiduspider|yandex|duckduck|facebookexternalhit|twitterbot|linkedinbot|embedly|quora|pinterest|redditbot|applebot|semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider|gptbot|claude|chatgpt|anthropic|google-extended|ccbot|ia_archiver|archive\.org|lighthouse|pagespeed|headlesschrome|phantomjs/i;

function isBot(request: Request): boolean {
	const ua = request.headers.get('User-Agent') || '';
	return BOT_PATTERN.test(ua);
}

// --- POST /api/analytics/event ---
async function handleEvent(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return new Response('Method Not Allowed', { status: 405, headers: corsHeaders(request) });
	}

	// Silently discard bot/crawler events — return 204 but don't store anything
	if (isBot(request)) {
		return new Response(null, { status: 204, headers: corsHeaders(request) });
	}

	let body: EventBody;
	try {
		body = await request.json();
	} catch {
		return new Response('Bad Request', { status: 400, headers: corsHeaders(request) });
	}

	const { path: rawPath, source: rawSource, sessionId, type } = body;
	if (!rawPath || !rawSource || !sessionId) {
		return new Response('Bad Request', { status: 400, headers: corsHeaders(request) });
	}

	const path = sanitize(rawPath, MAX_PATH_LENGTH);
	const source = sanitize(rawSource, MAX_SOURCE_LENGTH);
	const eventType = type === 'heartbeat' ? 'heartbeat' : 'pageview';

	const writes: Promise<unknown>[] = [
		// Always update the live session marker (heartbeats keep it alive)
		env.ANALYTICS.put(`live:${sessionId}`, path, { expirationTtl: 60 }),
	];

	// Only count page views and sources for actual pageviews, not heartbeats
	if (eventType === 'pageview') {
		const date = todayKey();
		writes.push(
			incrementCounter(env.ANALYTICS, `pv:${date}:${path}`),
			incrementCounter(env.ANALYTICS, `src:${date}:${source}`),
		);

		// Increment unique read counter for blog posts (deduplicated per session, 24h window)
		if (isBlogPostPath(path)) {
			const readerKey = `reader:${path}:${sessionId}`;
			const alreadyCounted = await env.ANALYTICS.get(readerKey);
			if (!alreadyCounted) {
				writes.push(
					incrementCounter(env.ANALYTICS, `reads:${path}`),
					env.ANALYTICS.put(readerKey, '1', { expirationTtl: 86400 }),
				);
			}
		}
	}

	await Promise.all(writes);

	return new Response(null, { status: 204, headers: corsHeaders(request) });
}

// --- GET /api/analytics/live (PUBLIC) ---
async function handleLive(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const filterPath = url.searchParams.get('path');

	const list = await env.ANALYTICS.list({ prefix: 'live:' });

	if (!filterPath) {
		return jsonResponse(request, { count: list.keys.length });
	}

	let count = 0;
	const reads = list.keys.map(async (key) => {
		const val = await env.ANALYTICS.get(key.name);
		if (val === filterPath) count++;
	});
	await Promise.all(reads);

	return jsonResponse(request, { count });
}

// --- GET /api/analytics/reads?path= (PUBLIC) ---
async function handleReads(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const path = url.searchParams.get('path');

	if (!path) {
		return new Response('Bad Request: path required', { status: 400, headers: corsHeaders(request) });
	}

	const raw = await env.ANALYTICS.get(`reads:${path}`);
	const data: DailyCounter = raw ? JSON.parse(raw) : { count: 0 };

	return jsonResponse(request, { path, count: data.count });
}

// --- POST /api/analytics/reads (PUBLIC, batch) ---
async function handleReadsBatch(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return new Response('Method Not Allowed', { status: 405, headers: corsHeaders(request) });
	}

	let body: { paths: string[] };
	try {
		body = await request.json();
	} catch {
		return new Response('Bad Request', { status: 400, headers: corsHeaders(request) });
	}

	if (!Array.isArray(body.paths) || body.paths.length === 0) {
		return new Response('Bad Request: paths array required', { status: 400, headers: corsHeaders(request) });
	}

	const paths = body.paths.slice(0, 50);
	const counts: Record<string, number> = {};

	await Promise.all(
		paths.map(async (p) => {
			const raw = await env.ANALYTICS.get(`reads:${p}`);
			const data: DailyCounter = raw ? JSON.parse(raw) : { count: 0 };
			counts[p] = data.count;
		})
	);

	return jsonResponse(request, { counts });
}

// --- GET /api/analytics/stats (AUTH REQUIRED) ---
async function handleStats(request: Request, env: Env): Promise<Response> {
	if (!isAuthorized(request, env)) {
		return new Response('Unauthorized', { status: 401, headers: corsHeaders(request) });
	}

	const url = new URL(request.url);
	const days = Math.min(parseInt(url.searchParams.get('days') || '7', 10), 90);
	const dates = dateKeys(days);

	const dailyViews: { date: string; views: number }[] = [];
	const sourceMap: Record<string, number> = {};
	const pageMap: Record<string, number> = {};
	let totalViews = 0;

	for (const date of dates) {
		const pvList = await env.ANALYTICS.list({ prefix: `pv:${date}:` });
		let dayTotal = 0;

		for (const key of pvList.keys) {
			const raw = await env.ANALYTICS.get(key.name);
			if (raw) {
				const data: DailyCounter = JSON.parse(raw);
				dayTotal += data.count;
				const path = key.name.slice(`pv:${date}:`.length);
				pageMap[path] = (pageMap[path] || 0) + data.count;
			}
		}

		dailyViews.push({ date, views: dayTotal });
		totalViews += dayTotal;

		const srcList = await env.ANALYTICS.list({ prefix: `src:${date}:` });
		for (const key of srcList.keys) {
			const raw = await env.ANALYTICS.get(key.name);
			if (raw) {
				const data: DailyCounter = JSON.parse(raw);
				const source = key.name.slice(`src:${date}:`.length);
				sourceMap[source] = (sourceMap[source] || 0) + data.count;
			}
		}
	}

	dailyViews.reverse();

	const topPages = Object.entries(pageMap)
		.map(([path, views]) => ({ path, views }))
		.sort((a, b) => b.views - a.views)
		.slice(0, 20);

	return jsonResponse(request, { dailyViews, sources: sourceMap, topPages, totalViews });
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: corsHeaders(request) });
		}

		if (url.pathname === '/api/analytics/event') {
			return handleEvent(request, env);
		}
		if (url.pathname === '/api/analytics/live') {
			return handleLive(request, env);
		}
		if (url.pathname === '/api/analytics/reads') {
			if (request.method === 'POST') return handleReadsBatch(request, env);
			return handleReads(request, env);
		}
		if (url.pathname === '/api/analytics/stats') {
			return handleStats(request, env);
		}

		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
