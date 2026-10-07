import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { approvedDemoCatalogue } from '../app/lib/demo-catalogue.mjs';
import { displayManifest } from '../app/lib/demo-display-manifest.mjs';
import { readCatalogue } from '../app/lib/demo-contract.mjs';
import { canExecute, demoReducer, initialDemoState } from '../app/lib/demo-state.mjs';

const sha = (value) => createHash('sha256').update(value).digest('hex');
const catalogue = readCatalogue(approvedDemoCatalogue());
const originals = catalogue.assets.filter((asset) => asset.can_reference);
const variants = catalogue.assets.filter((asset) => asset.can_upload);
const session = { status: 'active', expires_at: new Date(Date.now() + 600000).toISOString(),
  max_runs: 10, runs_used: 0, runs_remaining: 10, execution_available: false };
const complete = (state, operation, data) => demoReducer(
  demoReducer(state, { type: 'BEGIN', id: 1, operation }), { type: 'DONE', id: 1, data });

test('approved catalogue has four reference-only originals and the explicit 31-variant slides', () => {
  assert.equal(catalogue.assets.length, 35);
  assert.equal(originals.length, 4);
  assert.equal(variants.length, 31);
  assert.deepEqual(originals.map((asset) => asset.label), ['Original 01', 'Original 02', 'Original 03', 'Original 04']);
  for (const asset of catalogue.assets) {
    assert.notEqual(asset.can_reference, asset.can_upload);
    assert.ok(asset.preview_url.startsWith(asset.can_reference ? '/demo-assets/originals/' : '/demo-assets/variants/'));
  }
  const slides = {
    slide1: ['filtered','mirrored','coffee','posed','brightness','text','grayscale','rot90','second_person','pose_variant','channel_rotate','brightened'],
    slide2: ['rot180 2','half_cropped','rot180','desk','dog','darkened','contrast_035','red_channel','rot90 2','white_filtered','darkened copy','mirrored_flipped'],
    slide3: ['zoomed_out','noise_070','watermark','white','beach','coffee','zoomed'],
  };
  for (const [slide, labels] of Object.entries(slides)) {
    assert.deepEqual(variants.filter((asset) => asset.slide === slide).map((asset) => asset.label), labels);
  }
});

test('all display files retain approved SHA-256 digests, sizes, filenames and nested paths', async () => {
  const files = (await readdir(new URL('../public/demo-assets/', import.meta.url), { recursive: true }))
    .filter((path) => /\.(png|jpg)$/i.test(path)).sort();
  // Old public URLs remain for already-loaded older deployments, but cannot
  // appear in the current picker or authorize compute through this manifest.
  for (const asset of displayManifest.assets) assert.ok(files.includes(asset.path));
  for (const item of displayManifest.assets) {
    const asset = catalogue.assets.find((asset) => asset.id === item.id);
    const path = asset.preview_url.split('/').map(decodeURIComponent).join('/');
    assert.equal(path, '/demo-assets/' + item.path);
    const bytes = await readFile(new URL('../public' + asset.preview_url, import.meta.url));
    assert.equal(bytes.length, item.byte_length, item.path);
    assert.equal(sha(bytes), item.content_sha256, item.path);
    // Replacing approved bytes must not change the existing variant identity.
    const replacementId = item.path === 'variants/slide3/zoomed_out.png'
      ? 'demo_fa80929909eb140b501fe5b0' : null;
    assert.equal(item.id, replacementId || 'demo_' + sha(item.path + '\0' + item.content_sha256).slice(0, 24));
  }
});

test('display projection has no storage URLs, signals, test outcomes or guessed family assignments', () => {
  for (const asset of catalogue.assets) {
    assert.deepEqual(Object.keys(asset).sort(), ['alt', 'can_reference', 'can_upload', 'id', 'label', 'preview_url', ...(asset.can_upload ? ['slide'] : [])]);
  }
  const first = approvedDemoCatalogue();
  first.assets[0].can_upload = true;
  assert.equal(approvedDemoCatalogue().assets[0].can_upload, false, 'Callers cannot mutate the underlying role mapping');
});

test('both compute modes reject variants before reporting and originals after confirmed reporting', () => {
  for (const mode of ['managed', 'customer']) {
    let state = complete(initialDemoState, 'session', session);
    state = demoReducer(state, { type: 'MODE', mode });
    state = complete(state, 'assets', catalogue);
    for (const variant of variants) assert.equal(demoReducer(state, { type: 'SELECT', id: variant.id }), state);
    state = demoReducer(state, { type: 'SELECT', id: originals[0].id });
    assert.equal(state.selection.id, originals[0].id);
    assert.equal(state.reference, null);
    assert.equal(canExecute(state), false, 'Display availability never enables compute');
    const pending = demoReducer(state, { type: 'BEGIN', id: 2, operation: 'report' });
    const failed = demoReducer(pending, { type: 'FAIL', id: 2, error: 'demo_execution_unavailable' });
    assert.equal(failed.stage, 'reference'); assert.equal(failed.reference, null);
    // Reducer-only confirmed-response fixture, never a production backend result.
    state = complete(state, 'report', { session,
      reference: { reference_id: 'test_reference', asset_id: originals[0].id, mode,
        manifest_version: catalogue.manifest_version, cycle_revision: 1 } });
    assert.equal(state.stage, 'upload');
    assert.equal(state.reference.asset.id, originals[0].id);
    assert.equal(state.selection, null);
    for (const original of originals) assert.equal(demoReducer(state, { type: 'SELECT', id: original.id }), state);
    for (const variant of variants) {
      const selected = demoReducer(state, { type: 'SELECT', id: variant.id });
      assert.equal(selected.selection.id, variant.id);
      assert.equal(selected.reference.asset.id, originals[0].id);
    }
    assert.equal(demoReducer(state, { type: 'MODE', mode: mode === 'managed' ? 'customer' : 'managed' }), state);
    const reset = complete(state, 'reset', { session });
    assert.equal(reset.reference, null); assert.equal(reset.session.runs_remaining, 10);
  }
});
