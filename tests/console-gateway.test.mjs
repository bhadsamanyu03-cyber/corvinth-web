import assert from 'node:assert/strict';
import test from 'node:test';
import { handleConsole, consoleCredentials, CONSOLE_COOKIE, CONSOLE_COOKIE_MAX_AGE } from '../app/lib/console-gateway.mjs';
import { API_CATALOG, filterOpenApi } from '../app/lib/console-catalog.mjs';

const secret = 'server-gateway-secret-never-in-browser';
const key = `crv_dashboard_${'a'.repeat(64)}`;
const bearer = `ccs_${'b'.repeat(43)}`;
const token = `cci_${'c'.repeat(43)}`;
const scanId = '94152ebd-19d8-510c-bef5-b938a9ad68b0';
const intentId = '628df4ff-f728-48d9-92fe-5e0bdf37b07e';
const config = { enabled: true, backendUrl: 'https://backend.example.test', origins: ['https://console.example.test'], secret, credentials: { tenantA: key } };
test('per-tenant managed secrets add only scoped dashboard keys and preserve existing bindings', () => {
  const tenant='a3e4e11c-8cf2-4edc-9686-4480f3199e17';
  const name='CORVINTH_CONSOLE_TENANT_A3E4E11C_8CF2_4EDC_9686_4480F3199E17';
  assert.deepEqual(consoleCredentials({CORVINTH_CONSOLE_CREDENTIALS_JSON:JSON.stringify({tenantA:key}),[name]:key}),{tenantA:key,[tenant]:key});
  const other=`crv_dashboard_${'c'.repeat(64)}`;
  assert.equal(consoleCredentials({CORVINTH_CONSOLE_CREDENTIALS_JSON:JSON.stringify({[tenant]:key}),[name]:other})[tenant],key);
  for(const value of ['crv_synthetic_integration','crv_console_'+ 'a'.repeat(64),'invalid'])assert.deepEqual(consoleCredentials({[name]:value}),{});
  assert.deepEqual(consoleCredentials({'CORVINTH_CONSOLE_TENANT_OTHER':key}),{});
});
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
    calls.push({ path, query: url.searchParams.toString(), ...init, body: init.body ? JSON.parse(init.body) : undefined });
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
  assert.match(response.headers.get('set-cookie'), /Max-Age=34560000; Expires=/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(upstream.calls[0].body.token, token);
});
test('an existing session resumes without consuming another invitation', async () => {
  const upstream = backend();
  const response = await handleConsole(request('session', 'POST', { token }), ['session'], config, upstream.fetch);
  assert.equal(response.status, 200);
  assert.equal(upstream.calls.length, 1);
  assert.equal(upstream.calls[0].method, 'GET');
  assert.match(response.headers.get('set-cookie'), /Max-Age=34560000/);
});
test('session checks and authenticated operations renew the persistent cookie', async () => {
  assert.equal(CONSOLE_COOKIE_MAX_AGE, 34560000);
  for (const path of ['session', 'overview', 'detections']) {
    const upstream = backend();
    const response = await handleConsole(request(path), [path], config, upstream.fetch);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('set-cookie'), /Max-Age=34560000; Expires=/);
    assert.ok(response.headers.get('set-cookie').startsWith(`${CONSOLE_COOKIE}=${bearer};`));
    assert.equal((await response.text()).includes(bearer), false);
  }
});
test('revoked sessions cannot renew and logout clears the cookie after server invalidation', async () => {
  const invalid = async () => Response.json({ error: 'console_session_invalid' }, { status: 401 });
  for (const path of ['session', 'overview']) {
    const response = await handleConsole(request(path), [path], config, invalid);
    assert.equal(response.status, 401);
    assert.match(response.headers.get('set-cookie'), /Max-Age=0$/);
    assert.equal(response.headers.get('set-cookie').includes(bearer), false);
  }
  const upstream = backend();
  const response = await handleConsole(request('session', 'DELETE'), ['session'], config, upstream.fetch);
  assert.equal(response.status, 200);
  assert.equal(upstream.calls[0].method, 'DELETE');
  assert.match(response.headers.get('set-cookie'), /Max-Age=0$/);
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

test('detection reads forward only supported filters and preserve stored references', async () => {
  const object = {type:'storage_object',storage_provider:'s3',storage_bucket:'test-bucket',object_key:' folder/image.png ',object_version:'v1'};
  const match = {type:'confirmed_hash',confirmation_key:'canonical-1',matched_lane:'standard'};
  const item = {case_uuid:'case-1',action_reference:object,matched_reference:match,client_reference_id:'client-1',hamming_distance:0};
  const upstream = backend(path => path === '/console/v1/detections' ? {items:[item],next_skip:null} : item);
  const response = await handleConsole(request('detections?classification=EXACT&state=MATCHED&skip=20&limit=20&platform_id=tenantB&source=historical'),['detections'],config,upstream.fetch);
  assert.equal(response.status,200);
  assert.deepEqual((await response.json()).items,[item]);
  assert.equal(upstream.calls.at(-1).query,'classification=EXACT&state=MATCHED&skip=20&limit=20');
  const detail = await handleConsole(request('detection/case-1'),['detection','case-1'],config,upstream.fetch);
  assert.deepEqual(await detail.json(),item);
  const unauthorized = backend();
  assert.equal((await handleConsole(request('detections','GET',undefined,{cookie:''}),['detections'],config,unauthorized.fetch)).status,401);
  assert.equal(unauthorized.calls.length,0);
});

test('case audit retains withdrawal and structured evidence without arbitrary private fields', async () => {
  const event = {sequence:1,event_type:'case_withdrawn',withdrawal_reason:'Customer review complete',withdrawn_by:'Admin',
    action_reference:{type:'storage_object',storage_bucket:'test-bucket',object_key:'image.png',object_version:'v1'},
    matched_reference:{type:'confirmed_hash',confirmation_key:'canonical-1',matched_lane:'standard'},pipeline_1_distance:0};
  const upstream = backend(() => ({case_uuid:'case-1',chain_verified:true,chain_verification:{verified:true,entries_checked:2},
    events:[{...event,private_token:key,presigned_url:'secret-url'}]}));
  const response = await handleConsole(request('audit/case-1'),['audit','case-1'],config,upstream.fetch);
  const body = await response.json();
  assert.deepEqual(body.events,[event]);
  assert.equal(body.chain_verification.entries_checked,2);
});

test('detection actions retain confirm and withdrawal semantics and session actor', async () => {
  const upstream = backend(() => ({status:'withdrawn'}));
  const response = await handleConsole(request('detection/case-1/withdraw','POST',{reason:'Reviewed by the platform',withdrawn_by:'forged'}),['detection','case-1','withdraw'],config,upstream.fetch);
  assert.equal(response.status,200);
  assert.deepEqual(upstream.calls.at(-1).body,{reason:'Reviewed by the platform',withdrawn_by:'Admin'});
  assert.equal(upstream.calls.at(-1).path,'/cases/case-1/withdraw');
  const confirm = await handleConsole(request('detection/case-1/confirm','POST',{}),['detection','case-1','confirm'],config,upstream.fetch);
  assert.equal(confirm.status,200);
  assert.equal(upstream.calls.at(-1).path,'/cases/case-1/confirm');
  const deletion = await handleConsole(request('detection/case-1','DELETE'),['detection','case-1'],config,upstream.fetch);
  assert.equal(deletion.status,404);
});

test('historical scan start preserves stable intent/scope and cannot inject authority', async () => {
  const upstream = backend(() => ({ scan_id: scanId }));
  const body = { request_id: intentId, platform_id: 'tenantB', generation: 9,
    storage_scope: { storage_integration_id: 'registered', selected_prefix: ' leading/prefix ', secret: 'drop' } };
  const response = await handleConsole(request(`historical-scans/${scanId}/start`, 'POST', body), ['historical-scans', scanId, 'start'], config, upstream.fetch);
  assert.equal(response.status, 200);
  assert.equal(upstream.calls.at(-1).path, `/v2/pulse/complaints/${scanId}/historical-scans`);
  assert.deepEqual(upstream.calls.at(-1).body, { request_id: intentId,
    storage_scope: { storage_integration_id: 'registered', selected_prefix: ' leading/prefix ' } });
});
test('logical results forward only the exact opaque cursor and bounded page size', async () => {
  const upstream = backend(() => ({ items: [], next_cursor: 'abc123' }));
  const response = await handleConsole(request(`historical-scans/${scanId}/results?after=abc123&limit=20&platform_id=tenantB`), ['historical-scans', scanId, 'results'], config, upstream.fetch);
  assert.equal(response.status, 200);
  assert.equal(upstream.calls.at(-1).query, 'limit=20&after=abc123');
  const bad = backend();
  assert.equal((await handleConsole(request(`historical-scans/${scanId}/results?limit=101`), ['historical-scans', scanId, 'results'], config, bad.fetch)).status, 400);
  assert.equal(bad.calls.length, 2);
});
test('resume/cancel and explicit rescan never expose internal controller routes', async () => {
  for (const action of ['pause', 'resume', 'cancel', 'rescan']) {
    const upstream = backend();
    const response = await handleConsole(request(`historical-scans/${scanId}/${action}`, 'POST', { request_id: intentId, generation: 35, storage_scope: {} }), ['historical-scans', scanId, action], config, upstream.fetch);
    assert.equal(response.status, 200);
    assert.deepEqual(upstream.calls.at(-1).body, action === 'rescan' ? { request_id: intentId } : {});
  }
  for (const action of ['bind', 'open', 'settled-drain', 'pages', 'compute-claim']) {
    const upstream = backend();
    assert.equal((await handleConsole(request(`historical-scans/${scanId}/${action}`, 'POST', {}), ['historical-scans', scanId, action], config, upstream.fetch)).status, 404);
    assert.equal(upstream.calls.length, 2);
  }
});
test('new scan routes retain session/origin/tenant gates and ambiguous POST is not replayed', async () => {
  const upstream = backend(() => { throw new Error('private transport detail'); });
  const path = `historical-scans/${scanId}/rescan`, segments = path.split('/');
  assert.equal((await handleConsole(request(path, 'POST', { request_id: intentId }, { origin: 'https://other.test' }), segments, config, upstream.fetch)).status, 403);
  assert.equal(upstream.calls.length, 0);
  const response = await handleConsole(request(path, 'POST', { request_id: intentId }), segments, config, upstream.fetch);
  assert.equal(response.status, 503);
  assert.equal(upstream.calls.filter(row => row.method === 'POST').length, 1);
  assert.equal((await response.text()).includes('private transport'), false);
});
test('connector setup uses the configured backend origin, not a returned arbitrary URL', async () => {
  const upstream = backend(() => ({ api_origin: 'https://attacker.test', integrations: [] }));
  const response = await handleConsole(request('pulse-setup'), ['pulse-setup'], config, upstream.fetch);
  assert.equal((await response.json()).api_origin, config.backendUrl);
});

test('reference intent carries only exact customer source identity and preserves ambiguous retry identity', async () => {
  const body={request_id:intentId,case_id:'PREP',storage_integration_id:'registered',storage_reference:{type:'storage_object',storage_provider:'s3',storage_bucket:'synthetic-bucket',object_key:'approved/key with spaces.jpg',object_version:'exact-version'}};
  const upstream=backend(()=>({preparation_id:scanId,status:'queued'}));
  for(let i=0;i<2;i++)assert.equal((await handleConsole(request('reference-preparations','POST',body),['reference-preparations'],config,upstream.fetch)).status,200);
  const calls=upstream.calls.filter(c=>c.path==='/v2/pulse/reference-preparations');
  assert.equal(calls.length,2);assert.deepEqual(calls[0].body,body);assert.deepEqual(calls[1].body,body);
  for(const change of [{generation:99},{presigned_url:'https://example.invalid/secret'},{run_id:scanId}]){
    const denied=await handleConsole(request('reference-preparations','POST',{...body,...change}),['reference-preparations'],config,upstream.fetch);assert.equal(denied.status,400);
  }
});
test('reference pagination and cancellation use authenticated exact route without controller authority', async () => {
  const upstream=backend(()=>({items:[],next_cursor:null}));
  assert.equal((await handleConsole(request('reference-preparations?after='+scanId),['reference-preparations'],config,upstream.fetch)).status,200);
  assert.equal(upstream.calls.at(-1).query,'after='+scanId);
  assert.equal((await handleConsole(request('reference-preparations/'+scanId+'/cancel','POST',{}),['reference-preparations',scanId,'cancel'],config,upstream.fetch)).status,200);
  assert.deepEqual(upstream.calls.at(-1).body,{});
  assert.equal((await handleConsole(request('reference-preparations/'+scanId+'/execute','POST',{}),['reference-preparations',scanId,'execute'],config,upstream.fetch)).status,404);
});
