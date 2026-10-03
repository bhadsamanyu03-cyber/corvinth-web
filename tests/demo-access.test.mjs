import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { liveTokenRequests, readTokenRequest, readTokenRequestReceipt } from '../app/lib/demo-access.mjs';
import { demoReducer, initialDemoState } from '../app/lib/demo-state.mjs';

test('token requests accept exactly the two buyer fields, stripping unrelated data', () => {
  assert.deepEqual(readTokenRequest({ work_email: ' buyer@example.com ', company_url: ' https://example.com ', token: 'not-a-request-field', name: 'unused' }),
    { work_email: 'buyer@example.com', company_url: 'https://example.com' });
  for (const work_email of ['', 'missing-at.example.com', 'bad@', 'a'.repeat(255) + '@example.com']) {
    assert.throws(() => readTokenRequest({ work_email, company_url: 'https://example.com' }), { code: 'demo_request_invalid' });
  }
  for (const company_url of ['', 'example.com', 'javascript:alert(1)', 'https://name:password@example.com']) {
    assert.throws(() => readTokenRequest({ work_email: 'buyer@example.com', company_url }), { code: 'demo_request_invalid' });
  }
});

test('request success requires an explicit receipt; unavailable production adapter never sends or succeeds', async () => {
  assert.deepEqual(readTokenRequestReceipt({ status: 'accepted', request_id: 'request_1', email: 'discard' }), { status: 'accepted', request_id: 'request_1' });
  for (const data of [null, {}, { status: 'accepted' }, { status: 'accepted', request_id: 123 }, { status: 'sent', request_id: 'x' }, { status: 'accepted', request_id: 'https://example.com' }]) {
    assert.throws(() => readTokenRequestReceipt(data), { code: 'demo_request_unconfirmed' });
  }
  assert.equal(liveTokenRequests.available, false);
  await assert.rejects(liveTokenRequests.submit({ work_email: 'buyer@example.com', company_url: 'https://example.com' }), { code: 'demo_request_unavailable' });
});

test('workspace starts locked and resumes only after confirmed session status', () => {
  const initial = { ...initialDemoState, stage: 'checking' };
  const pending = demoReducer(initial, { type: 'BEGIN', operation: 'session', id: 1 });
  assert.equal(pending.stage, 'checking'); assert.equal(pending.session, null);
  assert.equal(demoReducer(pending, { type: 'DONE', id: 1, data: null }).stage, 'gate');
  const session = { status: 'active', expires_at: new Date(Date.now() + 600000).toISOString(), max_runs: 10, runs_used: 3, runs_remaining: 7, execution_available: false };
  const resumed = demoReducer(pending, { type: 'DONE', id: 1, data: session });
  assert.equal(resumed.stage, 'mode'); assert.equal(resumed.session.runs_remaining, 7);
  const failed = demoReducer(pending, { type: 'FAIL', id: 1, error: 'demo_unavailable' });
  assert.equal(failed.session, null);
});

test('homepage has no execution workspace or fixture dependency; dedicated route uses the shared workspace', async () => {
  const source = (path) => readFile(new URL(path, import.meta.url), 'utf8');
  const home = await source('../app/components/DemoPreview.js');
  assert.match(home, /router\.push\('\/demo'\)/);
  assert.doesNotMatch(home, /DemoWorkspace|useDemo|fixture|reportReference|checkUpload|listAssets/);
  const page = await source('../app/demo/page.js');
  assert.match(page, /DemoWorkspace/); assert.doesNotMatch(page, /fixture|demo-development/);
  const dev = await source('../app/demo-development/page.js');
  assert.ok(dev.indexOf("process.env.NODE_ENV !== 'development'") < dev.indexOf("await import('./Preview')"));
});
