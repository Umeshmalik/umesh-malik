interface Env {
	ASSETS: Fetcher;
	DB: D1Database;
	ANALYTICS_SECRET: string;
}

interface EventBody {
	path: string;
	referrer: string;
	source: string;
	sessionId: string;
	type: 'pageview' | 'heartbeat';
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

function isAuthorized(request: Request, env: Env): boolean {
	const auth = request.headers.get('Authorization');
	if (!auth || !env.ANALYTICS_SECRET) return false;
	return auth === `Bearer ${env.ANALYTICS_SECRET}`;
}

function sanitize(value: string, maxLen: number): string {
	return value.slice(0, maxLen).replace(/[^\w\-\/.:@]/g, '');
}

function isBlogPostPath(path: string): boolean {
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
	const date = todayKey();

	// Always update live session
	const statements: D1PreparedStatement[] = [
		env.DB.prepare(
			'INSERT INTO live_sessions (session_id, path, last_seen) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(session_id) DO UPDATE SET path = excluded.path, last_seen = datetime(\'now\')',
		).bind(sessionId, path),
	];

	// Only count pageviews (not heartbeats)
	if (eventType === 'pageview') {
		statements.push(
			env.DB.prepare(
				'INSERT INTO events (date, path, source, session_id, type) VALUES (?, ?, ?, ?, ?)',
			).bind(date, path, source, sessionId, eventType),
		);
	}

	await env.DB.batch(statements);

	// For blog posts, deduplicate reads per session per day
	if (eventType === 'pageview' && isBlogPostPath(path)) {
		const alreadyCounted = await env.DB.prepare(
			'SELECT 1 FROM reader_dedup WHERE path = ? AND session_id = ? AND date = ?',
		).bind(path, sessionId, date).first();

		if (!alreadyCounted) {
			await env.DB.batch([
				env.DB.prepare(
					'INSERT OR IGNORE INTO reader_dedup (path, session_id, date) VALUES (?, ?, ?)',
				).bind(path, sessionId, date),
				env.DB.prepare(
					'INSERT INTO reads (path, count) VALUES (?, 1) ON CONFLICT(path) DO UPDATE SET count = count + 1',
				).bind(path),
			]);
		}
	}

	return new Response(null, { status: 204, headers: corsHeaders(request) });
}

// --- GET /api/analytics/live (PUBLIC) ---
async function handleLive(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const filterPath = url.searchParams.get('path');

	let result;
	if (filterPath) {
		result = await env.DB.prepare(
			'SELECT COUNT(*) as count FROM live_sessions WHERE path = ? AND last_seen > datetime(\'now\', \'-60 seconds\')',
		).bind(filterPath).first<{ count: number }>();
	} else {
		result = await env.DB.prepare(
			'SELECT COUNT(*) as count FROM live_sessions WHERE last_seen > datetime(\'now\', \'-60 seconds\')',
		).first<{ count: number }>();
	}

	return jsonResponse(request, { count: result?.count ?? 0 });
}

// --- GET /api/analytics/reads?path= (PUBLIC) ---
async function handleReads(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const path = url.searchParams.get('path');

	if (!path) {
		return new Response('Bad Request: path required', { status: 400, headers: corsHeaders(request) });
	}

	const result = await env.DB.prepare(
		'SELECT count FROM reads WHERE path = ?',
	).bind(path).first<{ count: number }>();

	return jsonResponse(request, { path, count: result?.count ?? 0 });
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
	const placeholders = paths.map(() => '?').join(', ');
	const results = await env.DB.prepare(
		`SELECT path, count FROM reads WHERE path IN (${placeholders})`,
	).bind(...paths).all<{ path: string; count: number }>();

	const counts: Record<string, number> = {};
	// Initialize all paths with 0
	for (const p of paths) {
		counts[p] = 0;
	}
	// Fill in actual counts
	if (results.results) {
		for (const row of results.results) {
			counts[row.path] = row.count;
		}
	}

	return jsonResponse(request, { counts });
}

// --- GET /api/analytics/stats (AUTH REQUIRED) ---
async function handleStats(request: Request, env: Env): Promise<Response> {
	if (!isAuthorized(request, env)) {
		return new Response('Unauthorized', { status: 401, headers: corsHeaders(request) });
	}

	const url = new URL(request.url);
	const days = Math.min(parseInt(url.searchParams.get('days') || '7', 10), 90);

	// Calculate the start date
	const startDate = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

	// 4 SQL queries in one batch call
	const [dailyViewsResult, sourcesResult, topPagesResult, totalViewsResult] = await env.DB.batch([
		// Daily views
		env.DB.prepare(
			'SELECT date, COUNT(*) as views FROM events WHERE date >= ? AND type = \'pageview\' GROUP BY date ORDER BY date ASC',
		).bind(startDate),
		// Sources
		env.DB.prepare(
			'SELECT source, COUNT(*) as count FROM events WHERE date >= ? AND type = \'pageview\' GROUP BY source ORDER BY count DESC',
		).bind(startDate),
		// Top pages
		env.DB.prepare(
			'SELECT path, COUNT(*) as views FROM events WHERE date >= ? AND type = \'pageview\' GROUP BY path ORDER BY views DESC LIMIT 20',
		).bind(startDate),
		// Total views
		env.DB.prepare(
			'SELECT COUNT(*) as total FROM events WHERE date >= ? AND type = \'pageview\'',
		).bind(startDate),
	]);

	const dailyViews = (dailyViewsResult.results as { date: string; views: number }[]) || [];

	const sources: Record<string, number> = {};
	for (const row of (sourcesResult.results as { source: string; count: number }[]) || []) {
		sources[row.source] = row.count;
	}

	const topPages = (topPagesResult.results as { path: string; views: number }[]) || [];

	const totalRow = (totalViewsResult.results as { total: number }[])?.[0];
	const totalViews = totalRow?.total ?? 0;

	return jsonResponse(request, { dailyViews, sources, topPages, totalViews });
}

// --- Scheduled cleanup (cron trigger every 6 hours) ---
async function handleScheduled(env: Env): Promise<void> {
	await env.DB.batch([
		// Remove stale live sessions older than 2 minutes
		env.DB.prepare(
			'DELETE FROM live_sessions WHERE last_seen < datetime(\'now\', \'-120 seconds\')',
		),
		// Remove old reader dedup rows older than 48 hours
		env.DB.prepare(
			'DELETE FROM reader_dedup WHERE created_at < datetime(\'now\', \'-48 hours\')',
		),
	]);
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

	async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
		await handleScheduled(env);
	},
} satisfies ExportedHandler<Env>;
