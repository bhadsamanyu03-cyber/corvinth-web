import assert from 'node:assert/strict';
import test from 'node:test';
import { readCatalogue, readReference, readResult, readSession } from '../app/lib/demo-contract.mjs';
import { liveDemoClient } from '../app/lib/demo-client.mjs';
import { canExecute, demoReducer, initialDemoState } from '../app/lib/demo-state.mjs';
import { createFixture } from '../app/demo-development/fixture.mjs';

const session = { status: 'active', expires_at: new Date(Date.now() + 600000).toISOString(),
  max_runs: 10, runs_used: 0, runs_remaining: 10, execution_available: true };
const asset = { id: 'asset_a', preview_url: '/approved/a.png', label: 'Image A', alt: 'Image A', can_reference: true, can_upload: true };
const catalogue = { available: true, manifest_version: 'manifest_v1', assets: [asset] };
const reference = { reference_id: 'ref_1', asset_id: asset.id, mode: 'managed', manifest_version: 'manifest_v1', cycle_revision: 1 };
const step = (state, operation, data, id = 1) => demoReducer(demoReducer(state, { type: 'BEGIN', id, operation }), { type: 'DONE', id, data });
function selection() {
  let state = step({ ...initialDemoState, stage: 'gate' }, 'start', session);
  state = demoReducer(state, { type: 'MODE', mode: 'managed' });
  state = step(state, 'assets', catalogue);
  return demoReducer(state, { type: 'SELECT', id: asset.id });
}
function activeReference() { return step(selection(), 'report', { reference, session: { ...session, runs_used: 1, runs_remaining: 9 } }); }

test('progress requires a session, a selection, and confirmed reference registration', () => {
  assert.equal(demoReducer(initialDemoState, { type: 'MODE', mode: 'managed' }), initialDemoState);
  assert.equal(canExecute(initialDemoState), false);
  const selected = selection(); assert.equal(canExecute(selected), true);
  assert.equal(selected.reference, null); assert.equal(selected.stage, 'reference');
  const pending = demoReducer(selected, { type: 'BEGIN', id: 10, operation: 'report' });
  assert.equal(canExecute(pending), false);
  const failed = demoReducer(pending, { type: 'FAIL', id: 10, error: 'demo_unavailable' });
  assert.equal(failed.stage, 'reference'); assert.equal(failed.reference, null);
  assert.equal(activeReference().stage, 'upload');
});

test('mode is frozen for an active cycle; reset preserves the session budget', () => {
  const active = activeReference();
  assert.equal(demoReducer(active, { type: 'MODE', mode: 'customer' }), active);
  assert.equal(demoReducer(active, { type: 'CHANGE_MODE' }), active);
  const reset = step(active, 'reset', { session: active.session });
  assert.equal(reset.reference, null); assert.equal(reset.stage, 'mode');
  assert.equal(reset.session.runs_remaining, 9);
  assert.equal(demoReducer(reset, { type: 'MODE', mode: 'customer' }).mode, 'customer');
  const replenished = step(active, 'reset', { session });
  assert.equal(replenished.error, 'demo_invalid_response');
  assert.equal(replenished.reference.reference_id, active.reference.reference_id);
});

test('expiry and stale responses cannot restore a reference or result', () => {
  const pending = demoReducer(activeReference(), { type: 'BEGIN', id: 8, operation: 'check' });
  const expired = demoReducer(pending, { type: 'SESSION_EXPIRED' });
  assert.equal(expired.stage, 'gate'); assert.equal(expired.reference, null);
  assert.equal(demoReducer(expired, { type: 'DONE', id: 8, data: {} }), expired);
  assert.equal(demoReducer(pending, { type: 'DONE', id: 7, data: {} }), pending);
  assert.equal(demoReducer(pending, { type: 'BEGIN', id: 9, operation: 'reset' }), pending);
});

test('status failure locks execution; a replacement session cannot inherit the previous reference', () => {
  const active = activeReference();
  const polling = demoReducer(active, { type: 'BEGIN', id: 8, operation: 'session' });
  const failed = demoReducer(polling, { type: 'FAIL', id: 8, error: 'demo_unavailable' });
  assert.equal(failed.stage, 'gate'); assert.equal(canExecute(failed), false);
  const changed = step(active, 'session', { ...session, expires_at: new Date(Date.now() + 1200000).toISOString() });
  assert.equal(changed.stage, 'mode'); assert.equal(changed.reference, null);
});

test('another upload retains its reference and remaining runs', () => {
  let state = demoReducer(activeReference(), { type: 'SELECT', id: asset.id });
  state = step(state, 'check', { result: { classification: 'EXACT' }, session: { ...session, runs_used: 2, runs_remaining: 8 } });
  assert.equal(state.stage, 'result'); assert.equal(state.upload.id, asset.id);
  state = demoReducer(state, { type: 'TRY_UPLOAD' });
  assert.equal(state.stage, 'upload'); assert.equal(state.result, null);
  assert.equal(state.selection, null); assert.equal(state.reference.reference_id, 'ref_1');
  assert.equal(state.session.runs_remaining, 8);
});

test('catalogue rejects duplicate IDs, processing URLs, and unapproved unavailable content', () => {
  assert.throws(() => readCatalogue({ ...catalogue, assets: [asset, asset] }));
  for (const preview_url of ['https://store.example/a.png', '/a.png?signature=secret', '//elsewhere/a', 'data:image/png,abc', '/a\\b']) {
    assert.throws(() => readCatalogue({ ...catalogue, assets: [{ ...asset, preview_url }] }));
  }
  assert.throws(() => readCatalogue({ ...catalogue, available: false }));
  assert.equal(readCatalogue(catalogue).assets[0].id, asset.id);
});

test('reference/result validation binds mode, asset, manifest and cycle', () => {
  const expected = { asset_id: asset.id, mode: 'managed', manifest_version: 'manifest_v1' };
  assert.equal(readReference({ ...reference, status: 'active' }, expected).reference_id, 'ref_1');
  assert.throws(() => readReference({ ...reference, status: 'active', mode: 'customer' }, expected));
  assert.throws(() => readReference({ ...reference, status: 'active', manifest_version: 'other' }, expected));
  const result = { classification: 'NEAR_MISS', reference_id: 'ref_1', upload_asset_id: asset.id, mode: 'managed', cycle_revision: 1, request_id: 'request_1' };
  const context = { ...expected, reference_id: 'ref_1', cycle_revision: 1 };
  assert.equal(readResult(result, context).classification, 'NEAR_MISS');
  for (const change of [{ classification: 'NEARMISS' }, { cycle_revision: 2 }, { reference_id: 'ref_other' }, { upload_asset_id: 'other' }, { mode: 'customer' }]) assert.throws(() => readResult({ ...result, ...change }, context));
});

test('response projections omit credentials and validate authoritative run counters', () => {
  assert.equal(readSession({ ...session, token: 'secret' }).token, undefined);
  assert.throws(() => readSession({ ...session, runs_remaining: 11 }));
  const projected = readCatalogue({ ...catalogue, assets: [{ ...asset, hash: 'private', vector: [1, 2] }] });
  assert.equal(projected.assets[0].hash, undefined);
});

test('production execution never produces a fixture result or sends a compute request', async () => {
  assert.deepEqual(await liveDemoClient.listAssets({}), { available: false, manifest_version: null, assets: [] });
  for (const operation of ['reportReference', 'checkUpload', 'resetReference']) await assert.rejects(liveDemoClient[operation]({ asset_id: 'fixture' }), { code: 'demo_execution_unavailable' });
  assert.throws(() => createFixture({}), /Development fixture is disabled/);
  assert.equal(canExecute({ ...selection(), session: { ...session, execution_available: false } }), false);
  assert.equal(canExecute({ ...selection(), session: { ...session, runs_remaining: 0 } }), false);
});

test('development catalogue uses neutral slots without borrowing production artwork', async () => {
  const previous = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'development';
    const fixture = createFixture({ delay: 0 });
    await fixture.startSession({});
    const catalogue = readCatalogue(await fixture.listAssets({}));
    assert.equal(catalogue.assets.length, 24);
    assert.equal(catalogue.assets[0].label, 'Demo asset 01');
    assert.equal(catalogue.assets[23].label, 'Demo asset 24');
    for (const asset of catalogue.assets) {
      assert.equal(asset.preview_url, '/demo-development/neutral-slot');
      assert.equal(asset.can_reference, true);
      assert.equal(asset.can_upload, true);
    }
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});
