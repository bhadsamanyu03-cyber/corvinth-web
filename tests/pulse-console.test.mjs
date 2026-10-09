import test from 'node:test';
import assert from 'node:assert/strict';
import { scanIntent, scanSummary, scanStage, connectionReadiness, cleanupSummary } from '../app/lib/pulse-console.mjs';

test('ambiguous start/reload preserves intent; tenant, scope and explicit rescan stay distinct', () => {
  const map = new Map(); const storage = { getItem: k => map.get(k), setItem: (k,v) => map.set(k,v) };
  let next = 0; const uuid = () => `628df4ff-f728-48d9-92fe-${String(++next).padStart(12, '0')}`;
  const a = scanIntent(storage, 'A', 'start', 'complaint', { prefix: 'a/' }, uuid);
  assert.equal(scanIntent(storage, 'A', 'start', 'complaint', { prefix: 'a/' }, uuid).request_id, a.request_id);
  assert.notEqual(scanIntent(storage, 'A', 'start', 'complaint', { prefix: 'b/' }, uuid).request_id, a.request_id);
  assert.notEqual(scanIntent(storage, 'B', 'start', 'complaint', { prefix: 'a/' }, uuid).request_id, a.request_id);
  assert.notEqual(scanIntent(storage, 'A', 'rescan', 'scan', null, uuid).request_id, a.request_id);
});

test('connection readiness distinguishes approval, missing heartbeat, duplicates and old connector capabilities', () => {
  const ready = { pulse_eligible: true, connector_status: { connected: true, reference_preparation_supported: true } };
  assert.equal(connectionReadiness(null).state, 'approval');
  assert.equal(connectionReadiness({ ...ready, pulse_eligible: false }).state, 'approval');
  assert.equal(connectionReadiness({ pulse_eligible: true }).state, 'offline');
  assert.equal(connectionReadiness({ ...ready, connector_status: { connected: true } }).state, 'upgrade');
  assert.equal(connectionReadiness({ ...ready, connector_status: { ...ready.connector_status, multiple_installations: true } }).state, 'attention');
  assert.equal(connectionReadiness(ready).state, 'connected');
  assert.match(connectionReadiness(ready).detail, /only within your approved allowance/);
});

test('progress follows authoritative work and cleanup independently without promising budget or completion', () => {
  const scan = { status: 'running', expected: 2, counts: { completed: 2 }, discovery: { status: 'sealed' } };
  assert.equal(scanStage(scan, { capacity_status: 'awaiting_approved_capacity' }), 'Queued for approved compute');
  assert.equal(scanStage(scan, { connector_status: 'awaiting_connector' }), 'Waiting for your library connection');
  assert.equal(scanStage({ ...scan, status: 'paused' }, { connector_status: 'awaiting_connector' }), 'Paused — resume this scan to continue');
  assert.notEqual(scanStage({ ...scan, status: 'completed' }), 'Results ready for review');
  assert.equal(scanStage({ ...scan, status: 'completed', completion_event: { event_id: 'receipt' } }), 'Results ready for review');
  assert.equal(cleanupSummary({ cleanup_status: 'in_progress' }), 'Corvinth is shutting down compute automatically');
  assert.equal(cleanupSummary({ cleanup_status: 'zero_verified' }), 'Cleanup complete · capacity stopped');
  assert.equal(cleanupSummary({ cleanup_status: 'verification_unavailable' }), 'Shutdown has not yet been verified.');
  assert.equal(cleanupSummary(null), 'Shutdown has not yet been verified.');
});
test('completion comes from the logical receipt; discovery and publication never imply completion', () => {
  const scan = { status: 'running', expected: 2, counts: { completed: 1, failed: 1, pending_publication: 0 }, discovery: { status: 'capturing' } };
  assert.equal(scanSummary(scan).percent, null);
  scan.discovery.status = 'sealed'; assert.equal(scanSummary(scan).percent, 100);
  assert.equal(scanSummary(scan).complete, false);
  scan.status = 'completed_with_failures'; assert.equal(scanSummary(scan).complete, false);
  scan.completion_event = { event_id: 'one-logical-event' }; assert.equal(scanSummary(scan).complete, true);
});
