import assert from 'node:assert/strict';
import test from 'node:test';
import { DEMO_COOKIE, handleDemoSession } from '../app/lib/demo-gateway.mjs';

const token = 'cdt_' + 't'.repeat(43);
const bearer = 'cds_' + 's'.repeat(43);
const config = { enabled: true, secret: 'gateway-secret-'.repeat(4), backendUrl: 'https://api.example.test' };
const session = () => ({ status: 'active', expires_at: new Date(Date.now() + 1800000).toISOString(), max_runs: 10, runs_used: 0, runs_remaining: 10, execution_available: false });
const request = (method = 'POST', options = {}) => new Request('https://corvinth.com/api/live-demo/session', {
  method, headers: { Origin: 'https://corvinth.com', 'Content-Type': 'application/json', ...options.headers },
  ...(method === 'POST' ? { body: options.body ?? JSON.stringify({ token }) } : {}),
});

test('exchange sets secure opaque cookie and never exposes backend credentials in JSON', async () => {
  let calls = 0;
  const response = await handleDemoSession(request(), config, async (url, init) => {
    calls++;
    assert.equal(url, 'https://api.example.test/demo/v1/session');
    assert.equal(init.headers['X-Corvinth-Demo-Gateway'], config.secret);
    assert.equal(init.headers['x-api-key'], undefined);
    assert.equal(init.headers['X-Forwarded-For'], undefined);
    assert.equal(init.redirect, 'error');
    assert.equal(init.cache, 'no-store');
    assert.deepEqual(JSON.parse(init.body), { token });
    return Response.json({ ...session(), session_secret: bearer, private_storage: 'must-not-leak' });
  });
  assert.equal(calls, 1);
  const cookie = response.headers.get('set-cookie');
  for (const value of [DEMO_COOKIE, bearer, 'HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/', 'Expires=']) assert.ok(cookie.includes(value));
  assert.ok(!cookie.includes('Domain='));
  const body = await response.text();
  for (const secret of [bearer, token, config.secret, 'must-not-leak']) assert.ok(!body.includes(secret));
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('status resumes the same session; end clears cookie after backend confirmation', async () => {
  const headers = { Cookie: `${DEMO_COOKIE}=${bearer}` };
  const get = await handleDemoSession(request('GET', { headers }), config, async (_url, init) => {
    assert.equal(init.headers['X-Corvinth-Demo-Session'], bearer);
    return Response.json(session());
  });
  assert.equal((await get.json()).status, 'active');
  assert.equal(get.headers.get('set-cookie'), null);
  const end = await handleDemoSession(request('DELETE', { headers }), config, async (_url, init) => {
    assert.equal(init.method, 'DELETE');
    return Response.json({ status: 'ended' });
  });
  assert.equal((await end.json()).status, 'ended');
  assert.ok(end.headers.get('set-cookie').includes('Max-Age=0'));
});

test('valid existing cookie does not consume another session on redemption', async () => {
  const methods = [];
  const response = await handleDemoSession(request('POST', { headers: { Cookie: `${DEMO_COOKIE}=${bearer}` } }), config, async (_url, init) => {
    methods.push(init.method);
    return Response.json(session());
  });
  assert.equal(response.status, 200);
  assert.deepEqual(methods, ['GET']);
});

test('mutations reject foreign/missing origins and spoofed forwarding headers', async () => {
  let called = false;
  for (const origin of ['https://evil.example', 'null', '']) {
    const response = await handleDemoSession(request('POST', { headers: { Origin: origin, 'X-Forwarded-Host': 'corvinth.com' } }), config, async () => { called = true; });
    assert.equal(response.status, 403);
  }
  const response = await handleDemoSession(request('GET', { headers: { 'Sec-Fetch-Site': 'cross-site' } }), config, async () => { called = true; });
  assert.equal(response.status, 403);
  assert.equal(called, false);
});

test('malformed and oversized payloads never reach backend', async () => {
  for (const body of ['null', '[]', '{}', JSON.stringify({ token, url: 'https://evil.example' }), 'x'.repeat(1025)]) {
    let called = false;
    const response = await handleDemoSession(request('POST', { body }), config, async () => { called = true; });
    assert.equal(response.status, 400);
    assert.equal(called, false);
  }
});

test('backend denial and failure cannot grant a cookie or leak response bodies', async () => {
  for (const status of [401, 429, 500]) {
    const response = await handleDemoSession(request(), config, async () => Response.json({ detail: token, session_secret: bearer }, { status }));
    assert.equal(response.status, status === 500 ? 503 : status);
    assert.equal(response.headers.get('set-cookie'), null);
    assert.ok(!(await response.text()).includes(token));
  }
  const response = await handleDemoSession(request(), config, async () => { throw new Error(token); });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('set-cookie'), null);
});

test('invalid, expired or revoked session clears cookie; failed end remains retryable', async () => {
  const options = { headers: { Cookie: `${DEMO_COOKIE}=${bearer}` } };
  const invalid = await handleDemoSession(request('GET', options), config, async () => Response.json({}, { status: 401 }));
  assert.equal(invalid.status, 401);
  assert.ok(invalid.headers.get('set-cookie').includes('Max-Age=0'));
  const failed = await handleDemoSession(request('DELETE', options), config, async () => Response.json({}, { status: 503 }));
  assert.equal(failed.status, 503);
  assert.equal(failed.headers.get('set-cookie'), null);
});

test('missing config, insecure remote backend and unexpected session contracts fail closed', async () => {
  for (const overrides of [{ enabled: false }, { secret: '' }, { backendUrl: 'http://api.example.test' }, { backendUrl: 'https://user:pass@api.example.test' }, { backendUrl: 'https://api.example.test/production' }]) {
    const response = await handleDemoSession(request(), { ...config, ...overrides }, async () => { throw new Error('must not fetch'); });
    assert.equal(response.status, 503);
  }
  for (const overrides of [{ execution_available: true }, { runs_remaining: 100 }, { session_secret: 'unsafe\r\n' }, { expires_at: '2000-01-01' }]) {
    const response = await handleDemoSession(request(), config, async () => Response.json({ ...session(), session_secret: bearer, ...overrides }));
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('set-cookie'), null);
  }
});
