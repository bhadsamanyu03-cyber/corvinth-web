import test from 'node:test';
import assert from 'node:assert/strict';
import { handleDemoOperation, DEMO_COOKIE } from '../app/lib/demo-gateway.mjs';
import { readReference, readSession } from '../app/lib/demo-contract.mjs';
import { demoReducer, initialDemoState } from '../app/lib/demo-state.mjs';

const config = { enabled: true, secret: 'gateway-'.repeat(6), backendUrl: 'https://backend.test' };
const bearer = 'cds_' + 'x'.repeat(43);
const body = { asset_id: 'approved_asset', mode: 'managed', manifest_version: 'manifest_v1', operation_key: 'intent_1' };
const reference = { status: 'active', asset_id: body.asset_id, mode: body.mode, manifest_version: body.manifest_version, reference_id: 'demoref_1', cycle_revision: 1 };
const session = { status: 'active', execution_available: true, max_runs: 10, runs_used: 1, runs_remaining: 9, expires_at: new Date(Date.now()+600000).toISOString(), reference };
const request = (data = body, headers = {}) => new Request('https://corvinth.com/api/live-demo/report', { method: 'POST', headers: { origin: 'https://corvinth.com', cookie: `${DEMO_COOKIE}=${bearer}`, 'content-type': 'application/json', ...headers }, body: JSON.stringify(data) });

test('report proxy sends only asset intent and demo credentials; strips private provenance', async () => {
  const response = await handleDemoOperation(request(), 'report', config, async (url, init) => {
    assert.equal(url, 'https://backend.test/demo/v1/report');
    assert.equal(init.headers['X-Corvinth-Demo-Gateway'], config.secret);
    assert.equal(init.headers['X-Corvinth-Demo-Session'], bearer);
    assert.equal(init.headers['x-api-key'], undefined);
    assert.deepEqual(JSON.parse(init.body), body);
    return Response.json({ reference: { ...reference, signals: ['private'] }, session: { ...session, secret: 'private', reference: { ...reference, signals: ['private'] } } });
  });
  assert.equal(response.status, 200);
  const receipt = await response.json();
  assert.ok(!JSON.stringify(receipt).includes('private'));
  // The browser validates the gateway projection again before activating it.
  assert.deepEqual(readReference(receipt.reference, body), reference);
  assert.deepEqual(readReference(readReference(receipt.reference, body), body), reference);
  assert.deepEqual(readSession(receipt.session).reference, reference);
});

test('missing cookie, foreign origin and arbitrary URL/signal fields cannot reach backend', async () => {
  let calls = 0;
  const fetcher = async () => { calls++; throw Error('must not run'); };
  for (const [req, expected] of [[request(body, { cookie: '' }),401], [request(body, { origin: 'https://evil.test' }),403], [request({ ...body, presigned_url:'https://evil.test' }),400], [request({ ...body, vector:[1] }),400]]) {
    assert.equal((await handleDemoOperation(req, 'report', config, fetcher)).status, expected);
  }
  assert.equal(calls,0);
});

test('unknown backend bodies and credentials are not reflected; transient pending is retryable', async () => {
  for (const [status, error] of [[500,'demo_unavailable'],[409,'demo_operation_pending'],[401,'demo_session_invalid']]) {
    const response = await handleDemoOperation(request(), 'report', config, async () => Response.json({ error:'demo_operation_pending', private:bearer }, {status}));
    assert.deepEqual(await response.json(), {error});
  }
});

test('active reference survives repeated safe projection and resumes without another redemption', () => {
  const projected = readSession(readSession(session));
  let state = demoReducer(initialDemoState, { type:'BEGIN',id:1,operation:'session' });
  state = demoReducer(state,{type:'DONE',id:1,data:projected});
  assert.equal(state.stage,'upload'); assert.equal(state.mode,'managed'); assert.equal(state.reference.reference_id,'demoref_1');
  state = demoReducer(state,{type:'BEGIN',id:2,operation:'assets'});
  state = demoReducer(state,{type:'DONE',id:2,data:{available:true,manifest_version:'manifest_v1',assets:[{id:'approved_asset',can_reference:true,label:'Original'}]}});
  assert.equal(state.reference.asset.label,'Original'); assert.equal(state.session.runs_remaining,9);
});
