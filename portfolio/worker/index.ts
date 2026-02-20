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
}

interface DailyCounter {
	count: number;
}

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

function corsHeaders(): HeadersInit {
	return {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	};
}

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...corsHeaders() },
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

// --- POST /api/analytics/event ---
async function handleEvent(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return new Response('Method Not Allowed', { status: 405, headers: corsHeaders() });
	}

	let body: EventBody;
	try {
		body = await request.json();
	} catch {
		return new Response('Bad Request', { status: 400, headers: corsHeaders() });
	}

	const { path, source, sessionId } = body;
	if (!path || !source || !sessionId) {
		return new Response('Bad Request', { status: 400, headers: corsHeaders() });
	}

	const date = todayKey();

	const writes: Promise<unknown>[] = [
		incrementCounter(env.ANALYTICS, `pv:${date}:${path}`),
		incrementCounter(env.ANALYTICS, `src:${date}:${source}`),
		// Store current path as the value so live count can be filtered per-page
		env.ANALYTICS.put(`live:${sessionId}`, path, { expirationTtl: 60 }),
	];

	// Increment all-time read counter for blog posts
	if (path.startsWith('/blog/') && path !== '/blog') {
		writes.push(incrementCounter(env.ANALYTICS, `reads:${path}`));
	}

	await Promise.all(writes);

	return new Response(null, { status: 204, headers: corsHeaders() });
}

// --- GET /api/analytics/live (PUBLIC) ---
// ?path=/blog/some-post  → count only sessions on that path
// no param               → count all live sessions
async function handleLive(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const filterPath = url.searchParams.get('path');

	const list = await env.ANALYTICS.list({ prefix: 'live:' });

	if (!filterPath) {
		return jsonResponse({ count: list.keys.length });
	}

	// Read each session's current path and filter
	let count = 0;
	const reads = list.keys.map(async (key) => {
		const val = await env.ANALYTICS.get(key.name);
		if (val === filterPath) count++;
	});
	await Promise.all(reads);

	return jsonResponse({ count });
}

// --- GET /api/analytics/reads?path=/blog/some-post (PUBLIC) ---
// Returns all-time read count for a single path
async function handleReads(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const path = url.searchParams.get('path');

	if (!path) {
		return new Response('Bad Request: path required', { status: 400, headers: corsHeaders() });
	}

	const raw = await env.ANALYTICS.get(`reads:${path}`);
	const data: DailyCounter = raw ? JSON.parse(raw) : { count: 0 };

	return jsonResponse({ path, count: data.count });
}

// --- POST /api/analytics/reads (PUBLIC) ---
// Batch: accepts { paths: string[] }, returns { counts: Record<string, number> }
async function handleReadsBatch(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return new Response('Method Not Allowed', { status: 405, headers: corsHeaders() });
	}

	let body: { paths: string[] };
	try {
		body = await request.json();
	} catch {
		return new Response('Bad Request', { status: 400, headers: corsHeaders() });
	}

	if (!Array.isArray(body.paths) || body.paths.length === 0) {
		return new Response('Bad Request: paths array required', { status: 400, headers: corsHeaders() });
	}

	// Cap at 50 to prevent abuse
	const paths = body.paths.slice(0, 50);
	const counts: Record<string, number> = {};

	await Promise.all(
		paths.map(async (p) => {
			const raw = await env.ANALYTICS.get(`reads:${p}`);
			const data: DailyCounter = raw ? JSON.parse(raw) : { count: 0 };
			counts[p] = data.count;
		})
	);

	return jsonResponse({ counts });
}

// --- GET /api/analytics/stats (AUTH REQUIRED) ---
async function handleStats(request: Request, env: Env): Promise<Response> {
	if (!isAuthorized(request, env)) {
		return new Response('Unauthorized', { status: 401, headers: corsHeaders() });
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

	return jsonResponse({ dailyViews, sources: sourceMap, topPages, totalViews });
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: corsHeaders() });
		}

		// API routes
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

		// Fall through to static assets
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
