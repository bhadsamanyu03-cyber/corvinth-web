// Server transport only: imported by the console Route Handler, never the UI.
import { filterOpenApi } from './console-catalog.mjs';

export const CONSOLE_COOKIE = '__Host-corvinth_console';
const SESSION = /^ccs_[A-Za-z0-9_-]{43}$/;
const INVITE = /^cci_[A-Za-z0-9_-]{43}$/;
const KEY = /^crv_dashboard_[a-f0-9]{64}$/;
const HASH = /^[a-fA-F0-9]{64}$/;
class GatewayError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (message = 'Check the form fields and try again.') => { throw new GatewayError(400, message); };
const pick = (data, fields) => Object.fromEntries(fields.filter(key => Object.hasOwn(data, key)).map(key => [key, data[key]]));
const cookie = (value = '', expires) => `${CONSOLE_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; ${expires ? `Expires=${new Date(expires).toUTCString()}` : 'Max-Age=0'}`;
const reply = (data, status = 200, setCookie) => Response.json(data, { status, headers: {
  'Cache-Control': 'no-store', Pragma: 'no-cache', 'X-Content-Type-Options': 'nosniff',
  ...(setCookie ? { 'Set-Cookie': setCookie } : {}), ...(status === 429 ? { 'Retry-After': '60' } : {}),
} });

function readCookie(request) {
  const values = (request.headers.get('cookie') || '').split(';').map(v => v.trim()).filter(v => v.startsWith(`${CONSOLE_COOKIE}=`));
  const value = values.length === 1 ? values[0].slice(CONSOLE_COOKIE.length + 1) : '';
  return SESSION.test(value) ? value : '';
}
function text(value, maximum = 500, required = true) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || !value.trim() || value.length > maximum || /[\u0000-\u001f\u007f]/.test(value)) fail();
  return value;
}
function url(value) {
  const result = text(value, 16384);
  try { const parsed = new URL(result); if (parsed.protocol !== 'https:' || parsed.username || parsed.password) fail(); }
  catch { fail('Enter a valid HTTPS image URL.'); }
  return result;
}
function integer(value, minimum = 0, maximum = 100000) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) fail();
  return value;
}
function hashes(value) {
  if (!Array.isArray(value) || value.length !== 8 || value.some(v => typeof v !== 'string' || !HASH.test(v))) fail('Provide exactly eight 64-character hexadecimal PDQ hashes.');
  return value;
}
function publicSession(data) {
  if (data?.status !== 'active' || typeof data.platform_id !== 'string' || typeof data.platform_name !== 'string'
      || !Number.isFinite(Date.parse(data.expires_at)) || Date.parse(data.expires_at) <= Date.now()) {
    throw new GatewayError(503, 'Console access is temporarily unavailable.');
  }
  return { ...pick(data, ['status', 'platform_id', 'platform_name', 'label', 'expires_at']),
    permissions: { pdq_report: data.permissions?.pdq_report === true, pulse_report: data.permissions?.pulse_report === true } };
}
async function readBody(request) {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') fail();
  const reader = request.body?.getReader();
  if (!reader) fail();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 1024 * 1024) { await reader.cancel(); throw new GatewayError(413, 'This batch is too large. Submit a smaller batch.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  chunks.forEach(chunk => { bytes.set(chunk, offset); offset += chunk.length; });
  try { const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); if (!value || Array.isArray(value) || typeof value !== 'object') fail(); return value; }
  catch { fail(); }
}
function upstreamMessage(status, mutation) {
  return ({ 400: 'The backend could not accept these inputs.', 401: 'Your console access is no longer valid.',
    403: 'Your platform does not have permission for this operation.', 404: 'This record was not found for your platform.',
    409: 'The record changed or its configuration is not ready. Refresh its details before trying again.',
    413: 'The request exceeds the backend size limit.', 422: 'The backend rejected these inputs. Check the field requirements in API Reference.',
    429: 'Too many requests. Wait a minute before trying again.' })[status]
    || (mutation ? 'The operation could not be confirmed. Check the record before resubmitting.' : 'The backend is temporarily unavailable. Please try again.');
}

export async function handleConsole(request, segments, config, fetchBackend = fetch) {
  const path = segments.join('/');
  const isSession = path === 'session';
  try {
    if (!['GET', 'POST', 'DELETE'].includes(request.method)) throw new GatewayError(405, 'Method not allowed.');
    if (request.headers.get('sec-fetch-site') === 'cross-site' || (request.method !== 'GET' && !config.origins.includes(request.headers.get('origin')))) {
      throw new GatewayError(403, 'This request must originate from your console.');
    }
    let base;
    try {
      base = new URL(config.backendUrl);
      if (base.username || base.password || base.search || base.hash || base.pathname !== '/' ||
          (base.protocol !== 'https:' && !(config.allowLocal && base.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)))) throw new Error();
      if (!config.enabled || typeof config.secret !== 'string' || config.secret.length < 32) throw new Error();
    } catch { throw new GatewayError(503, 'The customer console has not been configured yet. Contact Corvinth.'); }
    const bearer = readCookie(request);
    async function upstream(target, method = 'GET', body, extraHeaders = {}) {
      let response;
      try {
        response = await fetchBackend(new URL(target, base), { method, cache: 'no-store', redirect: 'error',
          signal: AbortSignal.timeout(method === 'GET' ? 12000 : 90000),
          headers: { 'Content-Type': 'application/json', ...extraHeaders },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
      } catch { throw new GatewayError(503, upstreamMessage(503, method !== 'GET')); }
      if (!response.ok) {
        const status = [400, 401, 403, 404, 409, 413, 422, 429].includes(response.status) ? response.status : 503;
        // Never return arbitrary backend detail, input values, headers or URLs.
        throw new GatewayError(status, upstreamMessage(status, method !== 'GET'));
      }
      try { return await response.json(); } catch { throw new GatewayError(503, 'The backend returned an unreadable response.'); }
    }
    const sessionHeaders = { 'X-Corvinth-Console-Gateway': config.secret,
      ...(bearer ? { 'X-Corvinth-Console-Session': bearer } : {}) };
    if (isSession && request.method === 'DELETE') {
      if (bearer) await upstream('/console/v1/session', 'DELETE', undefined, sessionHeaders);
      return reply({ status: 'ended' }, 200, cookie());
    }
    if (!bearer && !(isSession && request.method === 'POST')) {
      return isSession ? reply({ status: 'inactive' }, 200, cookie()) : reply({ message: 'Sign in to open your console.' }, 401, cookie());
    }
    let session; let newSecret;
    if (isSession && request.method === 'POST') {
      const body = await readBody(request);
      if (Object.keys(body).length !== 1 || !INVITE.test(body.token)) fail('Enter a valid Corvinth console invitation.');
      if (bearer) {
        try { session = publicSession(await upstream('/console/v1/session', 'GET', undefined, sessionHeaders)); }
        catch (err) { if (err.status !== 401) throw err; }
      }
      if (!session) {
        const result = await upstream('/console/v1/session', 'POST', { token: body.token }, sessionHeaders);
        session = publicSession(result);
        if (!SESSION.test(result.session_secret)) throw new GatewayError(503, 'Console access could not be confirmed.');
        newSecret = result.session_secret;
      }
    } else session = publicSession(await upstream('/console/v1/session', 'GET', undefined, sessionHeaders));
    if (isSession) return reply(session, 200, newSecret ? cookie(newSecret, session.expires_at) : undefined);

    const key = config.credentials?.[session.platform_id];
    if (!KEY.test(key || '')) throw new GatewayError(503, 'Your platform’s console connection has not been provisioned. Contact Corvinth.');
    const apiHeaders = { 'X-API-Key': key };
    const verified = await upstream('/platform/verify', 'GET', undefined, apiHeaders);
    if (verified.platform_id !== session.platform_id || verified.status !== 'active') throw new GatewayError(503, 'Your platform’s console connection could not be verified.');
    const call = (target, method = 'GET', body) => upstream(target, method, body, apiHeaders);
    const queryParams = new URL(request.url).searchParams;
    const readQuery = (names) => {
      const params = new URLSearchParams();
      for (const name of names) if (queryParams.has(name)) params.set(name, queryParams.get(name));
      return params.toString();
    };
    if (request.method === 'GET') {
      if (path === 'overview') return reply(await call('/console/v1/overview'));
      if (path === 'counts') return reply(pick(await call('/hashes/count'), ['platform_hash_count']));
      const readRoutes = { reports: ['kind', 'skip', 'limit'], report: ['kind', 'reference'], matches: ['kind', 'reference', 'source', 'job_id', 'skip', 'limit'], jobs: ['kind', 'complaint_id', 'skip', 'limit'] };
      if (Object.hasOwn(readRoutes, path)) return reply(await call(`/console/v1/${path}?${readQuery(readRoutes[path])}`));
      if (segments[0] === 'schema' && segments.length === 2 && ['pdq', 'pulse'].includes(segments[1])) return reply(filterOpenApi(await call('/openapi.json'), segments[1]));
      if (segments[0] === 'pulse' && segments.length === 2) return reply(await call(`/complaint/pulse/${encodeURIComponent(text(segments[1]))}`));
      if (segments[0] === 'detection' && segments.length === 2) return reply(await call(`/cases/${encodeURIComponent(text(segments[1]))}`));
      if (segments[0] === 'audit' && segments.length === 2) {
        const audit = await call(`/cases/${encodeURIComponent(text(segments[1]))}/audit`);
        return reply({ ...pick(audit, ['case_uuid', 'chain_verified', 'generated_at', 'exportable']),
          events: (audit.events || []).map(event => pick(event, ['sequence', 'timestamp', 'event_type', 'action', 'reason', 'pipeline_1_classification'])) });
      }
      if (segments[0] === 'job' && segments.length === 3 && ['storage', 'url'].includes(segments[1])) {
        const target = segments[1] === 'storage' ? '/v2/pulse/storage-jobs/' : '/pulse/library/jobs/';
        return reply(await call(target + encodeURIComponent(text(segments[2]))));
      }
      if (segments[0] === 'items' && segments.length === 2) return reply(await call(`/v2/pulse/storage-jobs/${encodeURIComponent(text(segments[1]))}/items?${readQuery(['limit', 'after_item_id'])}`));
    }
    if (request.method === 'POST') {
      const body = await readBody(request);
      if (path === 'report/pdq') {
        const payload = { case_id: text(body.case_id, 200), source: 'platform_report', content_type: 'image' };
        if (body.mode === 'url') {
          const result = await call('/hash/compute-from-url', 'POST', { presigned_url: url(body.presigned_url), normalize: true });
          if (!HASH.test(result.pdq_hash || '')) throw new GatewayError(503, 'PDQ computation returned an invalid result. No report was submitted.');
          Object.assign(payload, { pdq_hash: result.pdq_hash, pdq_dihedral_hashes: hashes(result.pdq_dihedral_hashes) });
          if (result.pdq_dihedral_hashes_normalized) {
            if (!HASH.test(result.pdq_hash_normalized || '')) throw new GatewayError(503, 'Normalized PDQ computation returned an invalid result.');
            Object.assign(payload, { pdq_hash_normalized: result.pdq_hash_normalized, pdq_dihedral_hashes_normalized: hashes(result.pdq_dihedral_hashes_normalized) });
          }
        } else if (body.mode === 'hashes') {
          payload.pdq_dihedral_hashes = hashes(body.pdq_dihedral_hashes);
          payload.pdq_hash = payload.pdq_dihedral_hashes[0];
          if (body.pdq_dihedral_hashes_normalized) {
            payload.pdq_dihedral_hashes_normalized = hashes(body.pdq_dihedral_hashes_normalized);
            payload.pdq_hash_normalized = payload.pdq_dihedral_hashes_normalized[0];
          }
        } else fail();
        return reply(await call('/complaint/report', 'POST', payload));
      }
      if (path === 'report/pulse') {
        const payload = { case_id: text(body.case_id, 200), content_type: 'image' };
        if (body.platform_case_reference) payload.platform_case_reference = text(body.platform_case_reference);
        if (body.mode === 'url') payload.presigned_url = url(body.presigned_url);
        else if (body.mode === 'vector') {
          if (!Array.isArray(body.dino_vector) || body.dino_vector.length !== 384 || body.dino_vector.some(v => typeof v !== 'number' || !Number.isFinite(v))) fail('The embedding must contain exactly 384 finite numbers.');
          payload.dino_vector = body.dino_vector;
        } else fail();
        return reply(await call('/complaint/pulse', 'POST', payload));
      }
      if (path === 'withdraw/pdq') return reply(await call('/complaint/report/withdraw', 'POST', { owner_case_id: text(body.reference, 200) }));
      if (segments[0] === 'detection' && segments.length === 3 && ['confirm', 'withdraw'].includes(segments[2])) {
        const payload = segments[2] === 'withdraw' ? { reason: text(body.reason, 2000), withdrawn_by: session.label || session.platform_id } : undefined;
        if (payload && payload.reason.length < 10) fail();
        return reply(await call(`/cases/${encodeURIComponent(text(segments[1]))}/${segments[2]}`, 'POST', payload));
      }
      if (path === 'jobs') {
        if (!['pulse_library', 'complaint_scan'].includes(body.corpus_kind)) fail();
        return reply(await call('/v2/pulse/storage-jobs', 'POST', {
          client_job_id: text(body.client_job_id, 200), corpus_kind: body.corpus_kind,
          expected_item_count: integer(body.expected_item_count, 1), storage_integration_id: text(body.storage_integration_id),
          integration_contract_version: 'storage_identity_v1',
          ...(body.corpus_kind === 'complaint_scan' ? { complaint_id: text(body.complaint_id) } : {}),
        }));
      }
      if (segments[0] === 'job' && segments.length === 3 && ['items', 'seal', 'cancel'].includes(segments[2])) {
        let payload = {};
        if (segments[2] !== 'cancel') payload.expected_coordination_revision = integer(body.expected_coordination_revision, 0, Number.MAX_SAFE_INTEGER);
        if (segments[2] === 'items') {
          payload.registration_request_id = text(body.registration_request_id, 200);
          if (!Array.isArray(body.items) || !body.items.length || body.items.length > 500) fail('Register between 1 and 500 items per batch.');
          payload.items = body.items.map(item => ({
            ...(item.platform_content_id ? { platform_content_id: text(item.platform_content_id) } : {}),
            storage_reference: { type: 'storage_object', storage_provider: 's3',
              storage_bucket: text(item.storage_bucket, 63), object_key: text(item.object_key, 1024),
              object_version: item.object_version ? text(item.object_version, 1024) : null },
          }));
        }
        return reply(await call(`/v2/pulse/storage-jobs/${encodeURIComponent(text(segments[1]))}/${segments[2]}`, 'POST', payload));
      }
    }
    if (request.method === 'DELETE' && segments[0] === 'pulse' && segments.length === 2) return reply(await call(`/complaint/pulse/${encodeURIComponent(text(segments[1]))}`, 'DELETE'));
    throw new GatewayError(404, 'Console operation not found.');
  } catch (error) {
    const status = error instanceof GatewayError ? error.status : 503;
    const message = error instanceof GatewayError ? error.message : 'Console access is temporarily unavailable.';
    return reply({ message }, status, status === 401 ? cookie() : undefined);
  }
}
