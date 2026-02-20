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

	await Promise.all([
		incrementCounter(env.ANALYTICS, `pv:${date}:${path}`),
		incrementCounter(env.ANALYTICS, `src:${date}:${source}`),
		env.ANALYTICS.put(`live:${sessionId}`, '1', { expirationTtl: 60 }),
	]);

	return new Response(null, { status: 204, headers: corsHeaders() });
}

async function handleLive(request: Request, env: Env): Promise<Response> {
	if (!isAuthorized(request, env)) {
		return new Response('Unauthorized', { status: 401, headers: corsHeaders() });
	}

	const list = await env.ANALYTICS.list({ prefix: 'live:' });
	const count = list.keys.length;

	return new Response(JSON.stringify({ count }), {
		headers: { 'Content-Type': 'application/json', ...corsHeaders() },
	});
}

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
		// Fetch page views for this date
		const pvList = await env.ANALYTICS.list({ prefix: `pv:${date}:` });
		let dayTotal = 0;

		for (const key of pvList.keys) {
			const raw = await env.ANALYTICS.get(key.name);
			if (raw) {
				const data: DailyCounter = JSON.parse(raw);
				dayTotal += data.count;
				// Extract page path from key: "pv:YYYY-MM-DD:/path"
				const path = key.name.slice(`pv:${date}:`.length);
				pageMap[path] = (pageMap[path] || 0) + data.count;
			}
		}

		dailyViews.push({ date, views: dayTotal });
		totalViews += dayTotal;

		// Fetch sources for this date
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

	// Sort daily views chronologically (oldest first)
	dailyViews.reverse();

	// Sort top pages by views descending
	const topPages = Object.entries(pageMap)
		.map(([path, views]) => ({ path, views }))
		.sort((a, b) => b.views - a.views)
		.slice(0, 20);

	return new Response(
		JSON.stringify({ dailyViews, sources: sourceMap, topPages, totalViews }),
		{ headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
	);
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// Handle CORS preflight
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
		if (url.pathname === '/api/analytics/stats') {
			return handleStats(request, env);
		}

		// Fall through to static assets
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
