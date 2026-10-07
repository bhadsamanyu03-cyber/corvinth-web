import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../app/api/live-demo/session/route.js', import.meta.url), 'utf8');
// Exercise the actual route's environment projection without importing Next's
// server-only package into Node's standalone test runtime.
const script = new vm.Script(source.replace(/^import .*;\n/gm, '').replace(/^export /gm, '') + '\nGET({});');
function configuration(env) {
  const context = { process: { env }, handleDemoSession: (_request, config) => config };
  return script.runInNewContext(context);
}

test('demo backend override does not retarget the shared waitlist API URL', () => {
  const env = { CORVINTH_DEMO_BACKEND_URL: 'https://demo-api.example', CORVINTH_API_URL: 'https://lead-api.example' };
  assert.equal(configuration(env).backendUrl, 'https://demo-api.example');
  assert.equal(env.CORVINTH_API_URL, 'https://lead-api.example');
  const waitlist = readFileSync(new URL('../app/api/waitlist/route.js', import.meta.url), 'utf8');
  assert.ok(waitlist.includes('process.env.CORVINTH_API_URL'));
  assert.ok(!waitlist.includes('CORVINTH_DEMO_BACKEND_URL'));
});

test('existing deployments retain the legacy backend URL fallback', () => {
  assert.equal(configuration({ CORVINTH_API_URL: 'https://api.example' }).backendUrl, 'https://api.example');
});

test('an explicitly empty demo URL is not silently replaced with the shared URL', () => {
  assert.equal(configuration({ CORVINTH_DEMO_BACKEND_URL: '', CORVINTH_API_URL: 'https://api.example' }).backendUrl, '');
  assert.equal(configuration({}).backendUrl, undefined);
});
