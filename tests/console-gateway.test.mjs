import assert from 'node:assert/strict';
import test from 'node:test';
import { handleConsole, CONSOLE_COOKIE } from '../app/lib/console-gateway.mjs';
import { API_CATALOG, filterOpenApi } from '../app/lib/console-catalog.mjs';

const secret = 'server-gateway-secret-never-in-browser';
const key = `crv_dashboard_${'a'.repeat(64)}`;
const bearer = `ccs_${'b'.repeat(43)}`;
const token = `cci_${'c'.repeat(43)}`;
const config = { enabled: true, backendUrl: 'https://backend.example.test', origins: ['https://console.example.test'], secret, credentials: { tenantA: key } };
const active = () => ({ status: 'active', platform_id: 'tenantA', platform_name: 'Platform A', label: 'Admin', expires_at: new Date(Date.now() + 3600000).toISOString(), permissions: { pdq_report: true, pulse_report: true } });
function request(path, method = 'GET', body, headers = {}) {
  return new Request(`https://console.example.test/api/console/${path}`, { method,
    headers: { origin: config.origins[0], cookie: `${CONSOLE_COOKIE}=${bearer}`, 'Content-Type': 'application/json', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
function backend(respond = () => ({})) {
  const calls = [];
  const fetch = async (url, init) => {
    const path = url.pathname;
    calls.push({ path, ...init, body: init.body ? JSON.parse(init.body) : undefined });
    assert.equal(init.redirect, 'error');
    if (path === '/console/v1/session') {
      assert.equal(init.headers['X-Corvinth-Console-Gateway'], secret);
      assert.equal(init.headers['X-API-Key'], undefined);
      return Response.json(init.method === 'DELETE' ? { status: 'ended' } : { ...active(), session_secret: bearer, private_value: key });
    }
    assert.equal(init.headers['X-API-Key'], key);
    if (path === '/platform/verify') return Response.json({ platform_id: 'tenantA', status: 'active' });
    const result = respond(path, init);
    return result instanceof Response ? result : Response.json(result);
  };
  return { fetch, calls };
}

test('invitation exchange uses a secure cookie and projects out server secrets', async () => {
  const upstream = backend();
  const response = await handleConsole(request('session', 'POST', { token }, { cookie: '' }), ['session'], config, upstream.fetch);
  assert.equal(response.status, 200);
  const body = await response.text();
  for (const value of [secret, key, bearer, token, 'private_value']) assert.equal(body.includes(value), false);
  assert.match(response.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Strict/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(upstream.calls[0].body.token, token);
});
test('an existing session resumes without consuming another invitation', async () => {
  const upstream = backend();
  const response = await handleConsole(request('session', 'POST', { token }), ['session'], config, upstream.fetch);
  assert.equal(response.status, 200);
  assert.equal(upstream.calls.length, 1);
  assert.equal(upstream.calls[0].method, 'GET');
});
test('absent session cannot trigger a backend operation', async () => {
  const upstream = backend();
  const response = await handleConsole(request('report/pdq', 'POST', {}, { cookie: '' }), ['report', 'pdq'], config, upstream.fetch);
  assert.equal(response.status, 401); assert.equal(upstream.calls.length, 0);
});
test('cross-origin mutations and duplicate cookies fail closed', async () => {
  const upstream = backend();
  const foreign = await handleConsole(request('report/pdq', 'POST', {}, { origin: 'https://attacker.test' }), ['report','pdq'], config, upstream.fetch);
  assert.equal(foreign.status, 403); assert.equal(upstream.calls.length, 0);
  const duplicate = await handleConsole(request('overview', 'GET', undefined, { cookie: `${CONSOLE_COOKIE}=${bearer}; ${CONSOLE_COOKIE}=${bearer}` }), ['overview'], config, upstream.fetch);
  assert.equal(duplicate.status, 401); assert.equal(upstream.calls.length, 0);
});
test('a credential mapped to the wrong tenant cannot read or mutate tenant data', async () => {
  const calls = [];
  const response = await handleConsole(request('report/pdq','POST',{}), ['report','pdq'], config, async url => {
    calls.push(url.pathname);
    return Response.json(url.pathname === '/console/v1/session' ? active() : { platform_id: 'tenantB', status: 'active' });
  });
  assert.equal(response.status, 503);
  assert.deepEqual(calls, ['/console/v1/session','/platform/verify']);
});
test('PDQ URL intake computes then reports both lanes without archiving', async () => {
  const upstream = backend(path => path === '/hash/compute-from-url' ? {
    pdq_hash: '1'.repeat(64), pdq_dihedral_hashes: Array(8).fill('1'.repeat(64)),
    pdq_hash_normalized: '2'.repeat(64), pdq_dihedral_hashes_normalized: Array(8).fill('2'.repeat(64)),
  } : { hash_set_id: 'case-1', status: 'registered', hashes_stored: 16 });
  const response = await handleConsole(request('report/pdq','POST', { mode:'url', case_id:'case-1', presigned_url:'https://bucket.s3.amazonaws.com/image?secret=temporary', platform_id:'tenantB', source:'stopncii' }), ['report','pdq'], config, upstream.fetch);
  assert.equal(response.status, 200);
  assert.deepEqual(upstream.calls.map(call => call.path), ['/console/v1/session','/platform/verify','/hash/compute-from-url','/complaint/report']);
  const payload = upstream.calls.at(-1).body;
  assert.equal(payload.source,'platform_report'); assert.equal(payload.platform_id,undefined); assert.equal(payload.presigned_url,undefined);
  assert.equal(payload.pdq_dihedral_hashes_normalized.length,8);
});
test('Mode B reports directly and rejects malformed hash arrays before submission', async () => {
  const upstream = backend();
  const body = { mode:'hashes', case_id:'case-2', pdq_dihedral_hashes:Array(8).fill('f'.repeat(64)) };
  assert.equal((await handleConsole(request('report/pdq','POST',body), ['report','pdq'],config,upstream.fetch)).status,200);
  assert.equal(upstream.calls.some(call => call.path.includes('compute')),false);
  body.pdq_dihedral_hashes.pop();
  const other = backend();
  assert.equal((await handleConsole(request('report/pdq','POST',body), ['report','pdq'],config,other.fetch)).status,400);
  assert.equal(other.calls.length,2);
});
test('Pulse builds an exact schema and never retries uncertain writes', async () => {
  const upstream = backend(() => { throw new Error('secret backend message'); });
  const response = await handleConsole(request('report/pulse','POST',{ mode:'url', case_id:'case-3',presigned_url:'https://bucket.s3.amazonaws.com/a',arbitrary:'drop me' }),['report','pulse'],config,upstream.fetch);
  assert.equal(response.status,503);
  assert.equal(upstream.calls.filter(call => call.path === '/complaint/pulse').length,1);
  assert.equal(upstream.calls.at(-1).body.arbitrary,undefined);
  assert.equal((await response.text()).includes('secret backend message'),false);
});
test('item registration preserves exact storage identity and coordination revision', async () => {
  const upstream = backend();
  const response = await handleConsole(request('job/id/items','POST',{registration_request_id:'request-1',expected_coordination_revision:3,items:[{storage_bucket:'my-bucket',object_key:' leading and trailing ',object_version:'version-one',platform_content_id:'content-id'}]}),['job','id','items'],config,upstream.fetch);
  assert.equal(response.status,200);
  assert.equal(upstream.calls.at(-1).body.items[0].storage_reference.object_key,' leading and trailing ');
  assert.equal(upstream.calls.at(-1).body.expected_coordination_revision,3);
});
test('unknown and internal worker routes cannot be proxied', async () => {
  for (const path of ['v2/pulse/storage-jobs/id/leases','job/id/heartbeat','hash/check-and-archive','admin/platforms']) {
    const upstream = backend();
    const response = await handleConsole(request(path,'POST',{}),path.split('/'),config,upstream.fetch);
    assert.equal(response.status,404); assert.equal(upstream.calls.length,2);
  }
});
test('API Reference contains exactly 7 PDQ and 15 Pulse operations and no unrelated schemas', () => {
  assert.equal(API_CATALOG.pdq.length,7); assert.equal(API_CATALOG.pulse.length,15);
  const paths = {};
  for (const entry of [...API_CATALOG.pdq,...API_CATALOG.pulse]) {
    paths[entry.path] ||= {};
    paths[entry.path][entry.method.toLowerCase()] = { requestBody:{content:{'application/json':{schema:{$ref:'#/components/schemas/Allowed'}}}},responses:{200:{description:'OK'}} };
  }
  for (const path of ['/v2/pulse/storage-jobs/{job_id}/leases','/cases/{case_uuid}/challenge','/hash/compute-from-url','/hash/check-and-archive']) paths[path] = {post:{}};
  const result = filterOpenApi({openapi:'3.1.0',paths,components:{schemas:{Allowed:{type:'object'},WorkerSecret:{type:'object'}}}},'pulse');
  assert.equal(Object.values(result.paths).reduce((count, methods) => count + Object.keys(methods).length,0),15);
  assert.deepEqual(Object.keys(result.components.schemas),['Allowed']);
  for (const denied of ['leases','heartbeat','challenge','compute-from-url','check-and-archive']) assert.equal(JSON.stringify(result).includes(denied),false);
});
test('backend errors never expose arbitrary response bodies', async () => {
  const upstream = backend(() => Response.json({detail:key,token:bearer},{status:422}));
  const response = await handleConsole(request('report/pulse','POST',{mode:'url',case_id:'x',presigned_url:'https://bucket.s3.amazonaws.com/a'}),['report','pulse'],config,upstream.fetch);
  assert.equal(response.status,422);
  const body = await response.text(); assert.equal(body.includes(key),false); assert.equal(body.includes(bearer),false);
});
