// Isolated UI fixtures only. No fixture is imported by application code.
// Run dev on 3095 and a disposable Chrome CDP profile on 9335.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { API_CATALOG } from '../app/lib/console-catalog.mjs';

const base = 'http://127.0.0.1:3095';
const target = await (await fetch('http://127.0.0.1:9335/json/new?about:blank', { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
const pending = new Map(), errors = [], requests = [], dimensions = [];
let serial = 0, authenticated = false, failure = false, jobStatus = 'draft', registered = 0;
let detectionsPublished = false;
const now = '2026-10-04T04:30:00Z';
const session = {status:'active',platform_id:'offline-test',platform_name:'Offline test platform',label:'Test admin',expires_at:new Date(Date.now()+3600000).toISOString(),permissions:{pdq_report:true,pulse_report:true}};
const overview = {platform:{platform_id:'offline-test',platform_name:'Offline test platform',status:'active',registered_at:now,webhook_url:'https://example.invalid/webhook'},permissions:{pdq_report:true,pulse_report:true,pulse_vector:true},archive_record_count:0,storage_jobs_enabled:true,integrations:[{id:'integration-local',storage_bucket:'offline-test-bucket',bucket_region:'us-east-1',version_policy:'immutable_keys',status:'active'}],webhook:{configured:true,delivery_health:'unknown'}};
const report = (kind, index = 1) => ({kind,reference:`offline-${kind}-${index}`,case_id:`TEST-REPORT-${String(index).padStart(3,'0')}`,status:'active',created_at:now,match_count:1,match_scope:kind === 'pdq' ? 'Recorded detection cases' : 'Initial library results',scan_status:null});
const detections = Array.from({length:23}, (_, index) => ({
  case_uuid:`offline-detection-${String(index + 1).padStart(2,'0')}`,
  classification:['EXACT','FUZZY','NEAR_MISS'][index % 3],
  state:['MATCHED','SHADOW_QUARANTINED','RECEIVED'][index % 3],
  action_taken:['content_removed','content_shadow_quarantined','content_allowed'][index % 3],
  created_at:new Date(Date.parse(now) - index * 300000).toISOString(),last_updated:now,hours_remaining:24,
  client_reference_id:`post-${1042 + index}`,hamming_distance:index % 3 ? 18 : 0,
  ...(index === 2 ? {} : {action_reference:{type:'storage_object',storage_provider:'s3',storage_bucket:'offline-test-bucket',object_key:`uploads/2026/10/photo-${1042 + index}.jpg`,object_version:`version-${index + 1}`}}),
  matched_reference:{type:'confirmed_hash',confirmation_key:'confirmed-reference-84',matched_lane:'standard'},
}));
const detectionEvents = new Map(detections.map(item => [item.case_uuid,[{sequence:0,event_type:'case_created',timestamp:now,
  action:item.action_taken,action_reference:item.action_reference,matched_reference:item.matched_reference,pipeline_1_distance:item.hamming_distance}]]));
function job() { return {job_id:'offline-job',client_job_id:'Offline backfill test',status:jobStatus,corpus_kind:'pulse_library',expected_item_count:1,registered_item_count:registered,coordination_revision:registered,created_at:now,counts:{completed:0,failed:0}}; }
function fixture(url, method, body) {
  const path = url.pathname.replace('/api/console/','');
  if (path === 'session') {
    if (method === 'POST') authenticated = true;
    if (method === 'DELETE') authenticated = false;
    return {status:200,body:authenticated ? session : {status:'inactive'}};
  }
  if (failure) return {status:503,body:{message:'Offline test: service unavailable.'}};
  if (path === 'overview') return {body:overview};
  if (path === 'counts') return {body:{platform_hash_count:0}};
  if (path === 'detections') {
    const rows = (detectionsPublished ? detections : []).filter(item =>
      (!url.searchParams.get('classification') || item.classification === url.searchParams.get('classification')) &&
      (!url.searchParams.get('state') || item.state === url.searchParams.get('state')));
    const skip = Number(url.searchParams.get('skip') || 0);
    return {body:{items:rows.slice(skip,skip+20),next_skip:rows.length > skip+20 ? skip+20 : null}};
  }
  if (path === 'reports') {
    const kind = url.searchParams.get('kind') || 'pdq', skip = Number(url.searchParams.get('skip') || 0), limit = Number(url.searchParams.get('limit') || 20);
    return {body:{items:Array.from({length:Math.min(limit,23-skip)},(_,i)=>report(kind,skip+i+1)),next_skip:skip+limit < 23 ? skip+limit : null}};
  }
  if (path === 'report') return {body:report(url.searchParams.get('kind'))};
  if (path.startsWith('pulse/')) return {body:{...report('pulse'),status:'active',vector_stored:true,scan_status:'pending_manifest',created_at:now}};
  if (path === 'matches') return {body:{items:[{case_uuid:'offline-detection',platform_content_id:'OFFLINE-CONTENT-1',classification:'EXACT',hamming_distance:0,similarity:.98}],next_skip:null,availability:'recorded_cases'}};
  if (path === 'jobs') return {body:method === 'POST' ? job() : {items:[{...job(),kind:'storage'}],next_skip:null}};
  if (path === 'report/pdq') return {body:{hash_set_id:'offline-pdq-1',hashes_stored:8,status:'registered'}};
  if (path === 'report/pulse') return {body:{complaint_id:'offline-pulse-1',vector_stored:true,backfill_matches:[{platform_content_id:'OFFLINE-CONTENT-1',similarity:.98}]}};
  if (path === 'job/offline-job/items') { registered=body.items.length; return {body:{registered_item_count:registered,coordination_revision:1}}; }
  if (path === 'job/offline-job/seal') { jobStatus='active'; return {body:{status:'active'}}; }
  if (path === 'job/offline-job/cancel') { jobStatus='cancelled'; return {body:{status:'cancelled'}}; }
  if (path.startsWith('job/')) return {body:job()};
  if (path.startsWith('items/')) return {body:{items:registered ? [{item_id:'offline-item',status:'registered',storage_reference:{object_key:'example/image.png',storage_bucket:'offline-test-bucket'}}] : [],next_after_item_id:null}};
  if (path.startsWith('detection/')) {
    const [,id,action] = path.split('/');
    const item = detections.find(row => row.case_uuid === id) || detections[0];
    if (method === 'POST') {
      item.state = action === 'confirm' ? 'CONFIRMED' : 'WITHDRAWN';
      item.last_updated = new Date().toISOString();
      if (action === 'withdraw') Object.assign(item,{withdrawn_at:item.last_updated,withdrawn_by:'Test admin',withdrawal_reason:body.reason});
      const events = detectionEvents.get(item.case_uuid);
      events.push({sequence:events.length,event_type:action === 'confirm' ? 'case_confirmed' : 'case_withdrawn',timestamp:item.last_updated,
        ...(action === 'confirm' ? {confirmed_by_platform:session.platform_id} : {withdrawn_by:'Test admin',withdrawal_reason:body.reason})});
    }
    return {body:item};
  }
  if (path.startsWith('audit/')) return {body:{chain_verified:true,events:detectionEvents.get(path.split('/')[1]) || []}};
  if (path.startsWith('schema/')) {
    const paths = {};
    for (const endpoint of API_CATALOG[path.split('/')[1]]) {
      paths[endpoint.path] ||= {};
      paths[endpoint.path][endpoint.method.toLowerCase()] = {responses:{200:{description:'Offline UI test schema',content:{'application/json':{schema:{type:'object'}}}}}};
    }
    return {body:{paths,components:{schemas:{}}}};
  }
  return {status:404,body:{message:`Unhandled test route: ${path}`}};
}
function send(method, params={}) { return new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));}); }
socket.addEventListener('message',async event=>{
  const message=JSON.parse(event.data);
  if(message.id){const waiter=pending.get(message.id);pending.delete(message.id);if(message.error)waiter.reject(new Error(JSON.stringify(message.error)));else waiter.resolve(message.result);}
  if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);
  if(message.method==='Fetch.requestPaused'){
    const req=message.params.request;const url=new URL(req.url);requests.push({path:url.pathname,method:req.method});
    const result=fixture(url,req.method,req.postData?JSON.parse(req.postData):{});
    try { await send('Fetch.fulfillRequest',{requestId:message.params.requestId,responseCode:result.status||200,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify(result.body)).toString('base64')}); }
    catch (error) { if (!error.message.includes('Invalid InterceptionId')) throw error; /* Navigation aborted this request. */ }
  }
});
async function evaluate(expression) { const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value; }
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function wait(expression){for(let i=0;i<250;i++){if(await evaluate(`Boolean(${expression})`))return;await pause(100);}throw new Error(`Timed out: ${expression}`);}
async function navigate(path,width=1440){await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+path});await wait('document.readyState === "complete" && document.querySelector(".cc-shell")');await pause(400);}
async function input(selector,value){await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));})()`);}
async function select(selector,value){await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('change',{bubbles:true}));})()`);}
async function click(text,selector='button'){assert.equal(await evaluate(`(()=>{const el=[...document.querySelectorAll(${JSON.stringify(selector)})].find(el=>el.textContent.trim().startsWith(${JSON.stringify(text)}));if(!el||el.disabled)return false;el.click();return true;})()`),true,`Click ${text}`);}
async function shot(name){await evaluate('document.fonts.ready');await pause(200);const result=await evaluate(`({name:${JSON.stringify(name)},width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth})`);assert.equal(result.overflow,false,`${name}: viewport overflow`);dimensions.push(result);if(process.env.CONSOLE_SCREENSHOTS){const data=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(process.env.CONSOLE_SCREENSHOTS,`${name}.png`),Buffer.from(data.data,'base64'));}}
try{
  await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*api/console/*'}]});
  await navigate('/console');await wait('document.querySelector("input[name=token]")');await shot('console-login');
  await input('input[name=token]','offline-invitation');await click('Open console');await wait('document.querySelector(".cc-dashboard-grid")');await wait('document.querySelectorAll(".cc-row").length >= 5');await shot('console-overview-desktop');
  await navigate('/console/cases');await wait('document.querySelectorAll("tbody tr").length === 20');await click('Next');await wait('document.querySelectorAll("tbody tr").length === 3');
  await click('Detections','nav a');await wait('document.body.innerText.includes("No detections in this view")');
  detectionsPublished = true;await wait('document.querySelectorAll("tbody tr").length === 20'); // Actual 15-second polling.
  assert.equal(await evaluate('document.body.innerText.includes("Removal confirmed")'),false);
  await shot('console-detections-inbox');
  await click('Next');await wait('document.querySelectorAll("tbody tr").length === 3');
  await select('.cc-detection-filters select','FUZZY');await wait('document.querySelectorAll("tbody tr").length === 8');
  assert.equal(await evaluate('document.querySelector(".cc-pagination").innerText.includes("Page 1")'),true);
  await select('.cc-detection-filters select','EXACT');
  await wait('document.querySelectorAll("tbody tr").length === 8');
  await select('.cc-detection-filters .cc-field:nth-child(2) select','CONFIRMED');await wait('document.body.innerText.includes("No detections in this view")');
  await select('.cc-detection-filters .cc-field:nth-child(2) select','');
  await select('.cc-detection-filters select','');await wait('document.querySelectorAll("tbody tr").length === 20');
  await click('uploads/2026/10/photo-1042.jpg','tbody a');await wait('document.body.innerText.includes("Case lifecycle") && document.body.innerText.includes("confirmed-reference-84")');
  await shot('console-detection-detail');
  const confirmsBefore = requests.filter(req=>req.path.endsWith('/confirm')).length;
  await click('Confirm removal');await wait('document.querySelector("dialog[open]")');
  assert.equal(requests.filter(req=>req.path.endsWith('/confirm')).length,confirmsBefore);
  await click('Confirm removal','dialog[open] button');await wait('document.body.innerText.includes("Removal confirmed") && document.body.innerText.includes("case confirmed")');
  await click('← Detections','a');await wait('document.querySelectorAll("tbody tr").length === 20');
  assert.equal(await evaluate('document.querySelector("tbody tr").innerText.includes("Removal confirmed")'),true);
  await click('uploads/2026/10/photo-1043.jpg','tbody a');await wait('document.body.innerText.includes("Case lifecycle")');
  await click('Withdraw case');await wait('document.querySelector("dialog[open]")');
  await evaluate(`(()=>{const el=document.querySelector('dialog textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,'Reviewed and withdrawn by the platform.');el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await click('Withdraw case','dialog[open] button');await wait('document.body.innerText.includes("case withdrawn") && document.body.innerText.includes("Recorded by: Test admin")');
  assert.equal(await evaluate('document.body.innerText.includes("Reviewed and withdrawn by the platform.")'),true);
  await navigate('/console/detections/offline-detection-03');await wait('document.body.innerText.includes("No storage reference recorded")');
  for (const width of [390,768]) { await navigate('/console/detections',width);await wait('document.querySelectorAll("tbody tr").length === 20');await shot(`console-detections-${width}`);await navigate('/console/detections/offline-detection-01',width);await wait('document.body.innerText.includes("Case lifecycle")');await shot(`console-detection-detail-${width}`); }
  failure=true;await navigate('/console/detections');await wait('document.querySelector("[role=alert]")');failure=false;await click('Try again');await wait('document.querySelectorAll("tbody tr").length === 20');
  await navigate('/console/report/pdq');await wait('document.querySelector("input[name=case_id]")');await input('input[name=case_id]','OFFLINE-PDQ');await input('input[name=presigned_url]','https://offline.s3.amazonaws.com/test.png');await evaluate('document.querySelector("input[type=checkbox]").click()');await click('Register report');await wait('document.body.innerText.includes("Your report is registered.")');
  await navigate('/console/cases/pdq/offline-pdq-1/matches');await wait('document.body.innerText.includes("OFFLINE-CONTENT-1")');
  await navigate('/console/report/pulse');await wait('document.querySelector("input[name=case_id]")');await input('input[name=case_id]','OFFLINE-PULSE');await input('input[name=presigned_url]','https://offline.s3.amazonaws.com/test.png');await evaluate('document.querySelector("input[type=checkbox]").click()');await click('Register report');await wait('document.body.innerText.includes("Matches returned with this report: 1")');
  await navigate('/console/scans/new');await wait('document.querySelector("input[name=client_job_id]")');await input('input[name=client_job_id]','offline-backfill');await select('select[name=storage_integration_id]','integration-local');await input('input[name=expected_item_count]','1');await click('Create backfill');await wait('document.body.innerText.includes("Register storage items")');await select('.cc-field select','offline-test-bucket');await input('input[aria-label="Object key, item 1"]','example/image.png');await click('Register 1 item');await wait('document.body.innerText.includes("example/image.png")');await click('Finalize inventory');await wait('document.querySelector("dialog[open]")');await click('Finalize inventory','dialog[open] button');await wait('!document.querySelector("dialog[open]") && document.body.innerText.includes("active")');
  await click('Cancel job');await wait('document.querySelector("dialog[open]")');assert.equal(requests.filter(req=>req.path.endsWith('/cancel')).length,0);await click('Cancel job','dialog[open] button');await wait('document.body.innerText.includes("cancelled")');assert.equal(requests.filter(req=>req.path.endsWith('/cancel')).length,1);
  await navigate('/console/api');await wait('document.querySelectorAll(".cc-api-choice").length === 2');await shot('console-api-hub');
  for(const family of ['pdq','pulse']){await navigate(`/console/api/${family}`);await wait(`document.querySelectorAll('.cc-endpoint-nav a').length === ${family==='pdq'?7:15}`);const content=await evaluate('document.querySelector("#console-main").innerText');for(const denied of ['/leases','/heartbeat','/challenge','/hash/compute-from-url','/hash/check-and-archive'])assert.equal(content.includes(denied),false);}
  await navigate('/console/integration');await wait('document.body.innerText.toLowerCase().includes("delivery health")');await shot('console-integration');
  failure=true;await navigate('/console/cases');await wait('document.querySelector("[role=alert]")');failure=false;await click('Try again');await wait('document.querySelectorAll("tbody tr").length === 20');
  for(const width of [390,768,1440]){for(const route of ['/console','/console/report/pdq','/console/cases','/console/api/pulse','/console/scans/storage/offline-job']){await navigate(route,width);await wait('document.querySelector(".cc-heading")');await shot(`${route.replaceAll('/','-').slice(1)}-${width}`);}}
  assert.deepEqual(errors,[]);
  await click('Sign out');await wait('document.querySelector("input[name=token]")');
  console.log(JSON.stringify({status:'passed',verification:'UI fixtures only; backend transport intercepted locally',flows:'login, overview, detection inbox polling/pagination/filters, structured and legacy detail, confirm/withdraw with refreshed status and audit, PDQ/Pulse forms, case matches, create/register/seal/cancel job, API reference allowlist, failure/retry, logout',dimensions,exceptions:errors.length},null,2));
}finally{socket.close();await fetch(`http://127.0.0.1:9335/json/close/${target.id}`);}
