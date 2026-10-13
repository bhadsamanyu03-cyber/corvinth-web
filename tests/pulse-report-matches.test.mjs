import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire, Module } from 'node:module';

const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transformSync } = require('next/dist/build/swc');
const root = resolve(import.meta.dirname, '..');
let matchResponse;
const modules = new Map();

// Render the actual Reports/StorageReference/Badge/DataState components.
// Replace only the asynchronous data hook with explicit console API fixtures.
function load(filename) {
  filename = resolve(filename);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = new Module(filename);
  modules.set(filename, module);
  module.filename = filename;
  module.paths = Module._nodeModulePaths(dirname(filename));
  const originalRequire = module.require.bind(module);
  module.require = id => {
    if (id.startsWith('.')) {
      const base = resolve(dirname(filename), id);
      const source = existsSync(base) ? base : existsSync(base + '.js') ? base + '.js' : null;
      if (source?.endsWith('.js')) {
        const exports = load(source);
        if (id === './data') return { ...exports, useConsoleData(path) {
          const data = path?.startsWith('matches?') ? matchResponse
            : path?.startsWith('jobs?') ? { items: [], next_skip: null } : null;
          return { data, loading: false, error: null, reload() {} };
        } };
        return exports;
      }
    }
    return originalRequire(id);
  };
  const code = transformSync(readFileSync(filename, 'utf8'), {
    filename, jsc: { parser: { syntax: 'ecmascript', jsx: true },
      transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' },
  }).code;
  module._compile(code, filename);
  return module.exports;
}
const { CaseDetail } = load(resolve(root, 'app/console/ui/Reports.js'));
const reference = { type: 'storage_object', storage_provider: 's3', storage_bucket: 'tenant-owned-library',
  object_key: '  library + % ü/bordered.jpg  ', object_version: 'exact-version-id' };
function render(items, options = {}) {
  matchResponse = { items, next_skip: null, availability: 'indexed_library_candidates',
    decision_state: 'calibration_pending', ...options };
  return renderToStaticMarkup(React.createElement(CaseDetail, {
    kind: options.kind || 'pulse', reference: 'owned-reference', matchesOnly: true,
  }));
}

test('Pulse candidates show authoritative matched bucket/key/version and truthful raw-score labels', () => {
  const html = render([{ platform_content_id: 'non-authoritative-display-name', similarity: .8043227,
    matched_reference: reference, action_reference: null, action_required: false }]);
  assert.ok(html.includes(reference.object_key));
  assert.ok(html.includes(reference.storage_bucket));
  assert.ok(html.includes('Version: exact-version-id'));
  assert.ok(html.includes('Matched library object'));
  assert.ok(html.includes('Raw cosine: 0.8043'));
  assert.ok(html.includes('data-state="calibration_pending"'));
  assert.ok(html.includes('No moderation action requested or confirmed'));
  assert.ok(html.includes('capped at 50'));
  assert.ok(!html.includes('data-state="match"'));
  assert.ok(!html.includes('Removal confirmed'));
});

test('Immutable references preserve significant key text and React escapes hostile object names', () => {
  const html = render([{ platform_content_id: 'display', similarity: .3,
    matched_reference: { ...reference, object_version: null, object_key: '<script>private</script> + ü ' } }]);
  assert.ok(html.includes('Immutable key'));
  assert.ok(html.includes('&lt;script&gt;private&lt;/script&gt; + ü '));
  assert.ok(!html.includes('<script>private'));
});

test('Affected object and matching evidence remain separate when both references exist', () => {
  const html = render([{ platform_content_id: 'display', similarity: .9,
    action_reference: { ...reference, storage_bucket: 'affected-bucket', object_key: 'affected.jpg' },
    matched_reference: reference }]);
  assert.ok(html.includes('affected-bucket') && html.includes('affected.jpg'));
  assert.ok(html.includes('Matching evidence:') && html.includes(reference.object_key));
  assert.ok(html.includes('No moderation action requested or confirmed'));
});

test('PDQ detection links, classifications and affected storage identity retain their behavior', () => {
  const html = render([{ case_uuid: 'pdq-case', platform_content_id: 'display', classification: 'EXACT',
    hamming_distance: 0, action_reference: reference }], {
    kind: 'pdq', availability: 'recorded_cases', decision_state: undefined,
  });
  assert.ok(html.includes('/console/detections/pdq-case'));
  assert.ok(html.includes('EXACT · Hamming distance: 0'));
  assert.ok(html.includes(reference.object_key) && html.includes(reference.storage_bucket));
  assert.ok(!html.includes('data-state="calibration_pending"'));
});

test('Legacy Pulse rows and withheld/withdrawn states do not fabricate object references or scores', () => {
  const html = render([{ platform_content_id: 'legacy-content', similarity: .7,
    matched_reference: { type: 'complaint', complaint_id: 'complaint' } }], {
    availability: 'initial_library_top_50', decision_state: undefined,
  });
  assert.ok(html.includes('legacy-content') && html.includes('Similarity: 0.7000'));
  assert.ok(html.includes('data-state="match"'));
  assert.ok(!html.includes('Matched library object'));
  const withdrawn = render([], { availability: 'withdrawn', decision_state: undefined });
  assert.ok(withdrawn.includes('withdrawn') && withdrawn.includes('Results unavailable'));
  assert.ok(!withdrawn.includes('Raw cosine:'));
});
