// Demo-only gateway. No customer API key is accepted.
import { readBatch, readInput, readReference, readResult, readSession as parseSession } from './demo-contract.mjs';
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

async function readSmallJson(request, operation = false) {
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
      if (size > (operation ? 16384 : 1024)) { await reader.cancel(); throw new Error(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  if (operation) return body;
  if (!body || Array.isArray(body) || Object.keys(body).length !== 1 || !TOKEN.test(body.token)) throw new Error();
  return { token: body.token };
}

function publicSession(data) {
  const expires = new Date(data.expires_at);
  if (data.status !== 'active' || !Number.isFinite(expires.getTime()) || expires <= new Date()
      || typeof data.execution_available !== 'boolean' || !Number.isInteger(data.max_runs)
      || data.max_runs < 1 || data.max_runs > 50 || !Number.isInteger(data.runs_used)
      || data.runs_used < 0 || data.runs_used > data.max_runs
      || data.runs_remaining !== data.max_runs - data.runs_used) throw new Error();
  return parseSession({ ...data, expires_at: expires.toISOString() });
}

export async function handleDemoOperation(request, operation, config, fetchBackend = fetch) {
  if (request.method !== 'POST' || !['input', 'report', 'check', 'reset'].includes(operation)) return reply({ error: 'demo_invalid_request' }, 405);
  const allowed = config.origins || ['https://corvinth.com', 'https://www.corvinth.com'];
  if (!allowed.includes(request.headers.get('origin')) || request.headers.get('sec-fetch-site') === 'cross-site') return reply({ error: 'demo_origin_rejected' }, 403);
  if (!config.enabled || typeof config.secret !== 'string' || config.secret.length < 32) return reply({ error: 'demo_unavailable' }, 503);
  const bearer = readSession(request);
  if (!bearer) return reply({ error: 'demo_session_invalid' }, 401, cookie(''));
  let body, target;
  try {
    target = new URL(config.backendUrl);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname);
    if ((target.protocol !== 'https:' && !(config.allowLocal && local && target.protocol === 'http:'))
        || target.username || target.password || target.search || target.hash || target.pathname !== '/') throw new Error();
    target.pathname = '/demo/v1/' + operation;
  } catch { return reply({ error: 'demo_unavailable' }, 503); }
  try {
    body = await readSmallJson(request, true);
    const batch = operation === 'check' && Array.isArray(body?.asset_ids);
    const fields = operation === 'reset' ? ['operation_key', 'reference_id', 'cycle_revision']
      : [...(operation === 'input' ? [] : ['operation_key']), batch ? 'asset_ids' : 'asset_id', 'mode', 'manifest_version',
        ...(operation === 'check' ? ['reference_id', 'cycle_revision'] : []),
        ...(operation !== 'input' && body?.input_tokens !== undefined ? ['input_tokens'] : [])];
    if (!body || Array.isArray(body) || Object.keys(body).sort().join() !== fields.sort().join()
        || fields.filter((key) => !['asset_ids', 'input_tokens'].includes(key)).some((key) => key === 'cycle_revision' ? !Number.isInteger(body[key]) || body[key] < 1 : typeof body[key] !== 'string' || !/^[A-Za-z0-9_-]{1,120}$/.test(body[key]))
        || (operation !== 'reset' && !['managed', 'customer'].includes(body.mode))) throw new Error();
    const ids = batch ? body.asset_ids : [body.asset_id];
    if (batch && (ids.length < 1 || ids.length > 3 || new Set(ids).size !== ids.length
        || ids.some((value) => typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,120}$/.test(value)))) throw new Error();
    if (body.input_tokens !== undefined && (!body.input_tokens || Array.isArray(body.input_tokens)
        || Object.keys(body.input_tokens).sort().join() !== [...ids].sort().join()
        || Object.values(body.input_tokens).some((value) => typeof value !== 'string'
          || value.length > 4096 || !/^[A-Za-z0-9_-]+\.[0-9a-f]{64}$/.test(value)))) throw new Error();
  } catch { return reply({ error: 'demo_invalid_request' }, 400); }
  try {
    const response = await fetchBackend(target.toString(), { method: 'POST', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(45000),
      headers: { 'Content-Type': 'application/json', 'X-Corvinth-Demo-Gateway': config.secret, 'X-Corvinth-Demo-Session': bearer }, body: JSON.stringify(body) });
    if (!response.ok) {
      const status = [400, 401, 409, 429].includes(response.status) ? response.status : 503;
      const permitted = new Set(['demo_input_expired', 'demo_reference_conflict', 'demo_operation_pending', 'demo_operation_conflict', 'demo_run_limit', 'demo_busy']);
      const data = await response.json().catch(() => ({}));
      const error = status === 401 ? 'demo_session_invalid' : status === 503 ? 'demo_unavailable'
        : permitted.has(data.error) ? data.error : status === 429 ? 'demo_rate_limited' : 'demo_invalid_request';
      return reply({ error }, status, status === 401 ? cookie('') : undefined);
    }
    const data = await response.json();
    if (operation === 'input') return reply({ input: readInput(data.input, body) });
    const session = publicSession(data.session);
    if (operation === 'report') return reply({ reference: readReference(data.reference, body), session });
    if (operation === 'check') return reply(body.asset_ids
      ? { results: readBatch(data, body), session } : { result: readResult(data.result, body), session });
    if (data.status !== 'reset' || !Number.isInteger(data.cycle_revision) || data.cycle_revision <= body.cycle_revision) throw new Error();
    return reply({ status: 'reset', cycle_revision: data.cycle_revision, session });
  } catch { return reply({ error: 'demo_unavailable' }, 503); }
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
