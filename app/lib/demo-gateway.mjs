// Used only by the session Route Handler. No customer API key is accepted.
export const DEMO_COOKIE = '__Host-corvinth_demo';
const SESSION = /^cds_[A-Za-z0-9_-]{43}$/;
const TOKEN = /^cdt_[A-Za-z0-9_-]{43}$/;

function reply(body, status = 200, cookie) {
  const headers = { 'Cache-Control': 'no-store', Pragma: 'no-cache' };
  if (cookie) headers['Set-Cookie'] = cookie;
  if (status === 429) headers['Retry-After'] = '60';
  return Response.json(body, { status, headers });
}

function cookie(value, expires) {
  return `${DEMO_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; ${expires ? `Expires=${expires.toUTCString()}` : 'Max-Age=0'}`;
}

function readSession(request) {
  const matches = (request.headers.get('cookie') || '').split(';')
    .map((part) => part.trim()).filter((part) => part.startsWith(`${DEMO_COOKIE}=`));
  if (matches.length !== 1) return '';
  const value = matches[0].slice(DEMO_COOKIE.length + 1);
  return SESSION.test(value) ? value : '';
}

async function readSmallJson(request) {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') throw new Error();
  const reader = request.body?.getReader();
  if (!reader) throw new Error();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 1024) { await reader.cancel(); throw new Error(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  if (!body || Array.isArray(body) || Object.keys(body).length !== 1 || !TOKEN.test(body.token)) throw new Error();
  return { token: body.token };
}

function publicSession(data) {
  const expires = new Date(data.expires_at);
  if (data.status !== 'active' || !Number.isFinite(expires.getTime()) || expires <= new Date()
      || data.execution_available !== false || !Number.isInteger(data.max_runs)
      || data.max_runs < 1 || data.max_runs > 50 || !Number.isInteger(data.runs_used)
      || data.runs_used < 0 || data.runs_used > data.max_runs
      || data.runs_remaining !== data.max_runs - data.runs_used) throw new Error();
  return { status: 'active', expires_at: expires.toISOString(), max_runs: data.max_runs,
    runs_used: data.runs_used, runs_remaining: data.runs_remaining, execution_available: false };
}

export async function handleDemoSession(request, config, fetchBackend = fetch) {
  const method = request.method;
  if (!['GET', 'POST', 'DELETE'].includes(method)) return reply({ error: 'demo_invalid_request' }, 405);
  // These origins come from server configuration, never Host/X-Forwarded-Host.
  const allowed = config.origins || ['https://corvinth.com', 'https://www.corvinth.com'];
  if ((method !== 'GET' && !allowed.includes(request.headers.get('origin')))
      || request.headers.get('sec-fetch-site') === 'cross-site') {
    return reply({ error: 'demo_origin_rejected' }, 403);
  }
  if (!config.enabled || typeof config.secret !== 'string' || config.secret.length < 32) {
    return reply({ error: 'demo_unavailable' }, 503);
  }
  let target;
  try {
    target = new URL(config.backendUrl);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname);
    if ((target.protocol !== 'https:' && !(config.allowLocal && local && target.protocol === 'http:'))
        || target.username || target.password || target.search || target.hash
        || target.pathname !== '/') throw new Error();
    target.pathname = '/demo/v1/session';
  } catch { return reply({ error: 'demo_unavailable' }, 503); }

  const bearer = readSession(request);
  if (method !== 'POST' && !bearer) {
    return reply(method === 'GET' ? { status: 'inactive' } : { status: 'ended' }, 200, cookie(''));
  }
  let body;
  if (method === 'POST') {
    // Reuse a valid cookie instead of consuming another session on a double click.
    if (bearer) {
      const existing = await handleDemoSession(new Request(request.url, {
        method: 'GET', headers: { cookie: `${DEMO_COOKIE}=${bearer}` },
      }), config, fetchBackend);
      const current = await existing.json();
      if (existing.ok && current.status === 'active') return reply(current);
      if (!existing.ok && existing.status !== 401) return reply(current, existing.status);
    }
    try { body = await readSmallJson(request); }
    catch { return reply({ error: 'demo_invalid_request' }, 400); }
  }
  try {
    const response = await fetchBackend(target.toString(), {
      method, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000),
      headers: { 'Content-Type': 'application/json', 'X-Corvinth-Demo-Gateway': config.secret,
        ...(bearer && method !== 'POST' ? { 'X-Corvinth-Demo-Session': bearer } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      // Do not forward arbitrary backend error bodies, headers or credentials.
      const status = [400, 401, 413, 415, 429].includes(response.status) ? response.status : 503;
      const error = status === 401 ? (method === 'POST' ? 'demo_token_invalid' : 'demo_session_invalid')
        : status === 429 ? 'demo_rate_limited' : status === 503 ? 'demo_unavailable' : 'demo_invalid_request';
      return reply({ error }, status, status === 401 && method !== 'POST' ? cookie('') : undefined);
    }
    const data = await response.json();
    if (method === 'DELETE') {
      if (data.status !== 'ended') throw new Error();
      return reply({ status: 'ended' }, 200, cookie(''));
    }
    const safe = publicSession(data);
    if (method === 'POST') {
      if (!SESSION.test(data.session_secret)) throw new Error();
      return reply(safe, 200, cookie(data.session_secret, new Date(safe.expires_at)));
    }
    return reply(safe);
  } catch { return reply({ error: 'demo_unavailable' }, 503); }
}
