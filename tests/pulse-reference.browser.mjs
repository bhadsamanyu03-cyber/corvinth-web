// Isolated UI fixtures only. No fixture is imported by application code.
// Run dev on 3099 and a disposable Chrome CDP profile on 9340.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { API_CATALOG } from '../app/lib/console-catalog.mjs';

const base = 'http://127.0.0.1:3099';
const target = await (await fetch('http://127.0.0.1:9340/json/new?about:blank', { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
const pending = new Map(), errors = [], requests = [], dimensions = [];
let serial = 0, authenticated = false, failure = false, jobStatus = 'draft', registered = 0;
let detectionsPublished = false;
let referenceStatus='queued'; const preparationId='02461023-2a7d-4d44-95e8-7d9553cc5a72';
let scanStatus = 'running', scanAfter = '', scanNumber = 1;
const complaintId = '4c4194fd-c292-50ea-8e54-0d1236da0674';
const scanId = '94152ebd-19d8-510c-bef5-b938a9ad68b0';
const secondScanId = '628df4ff-f728-48d9-92fe-5e0bdf37b07e';
function logical() { return { scan_id: scanNumber === 1 ? scanId : secondScanId, complaint_id: complaintId, status: scanStatus, expected: 23, counts: { completed: scanStatus === 'completed' ? 23 : 10, failed: 0, cancelled: scanStatus === 'cancelled' ? 13 : 0, pending: scanStatus === 'running' ? 13 : 0, processing: 0, pending_publication: 0 }, discovery:{status:'sealed',pages:1},created_at:now, completed_at:scanStatus === 'completed' ? now : null, ...(scanStatus === 'completed' || scanStatus === 'cancelled' ? {completion_event:{event_id:'one-logical-completion'}} : {}) }; }
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
  if(path === 'reference-preparations' && method === 'POST') { assert.equal(body.storage_reference.object_key,'images/reference.jpg');assert.equal(body.storage_reference.object_version,null);assert.ok(body.request_id);assert.equal(body.presigned_url,undefined);return {body:{preparation_id:preparationId,status:referenceStatus}}; }
  if(path === 'reference-preparations') return {body:{items:[{preparation_id:preparationId,case_id:'NEW-REFERENCE',status:referenceStatus}],next_cursor:null}};
  if(path.startsWith('reference-preparations/')) { if(path.endsWith('/cancel'))referenceStatus='cancelled';return {body:{preparation_id:preparationId,complaint_id:complaintId,case_id:'NEW-REFERENCE',status:referenceStatus,decision_state:'calibration_pending'}};}
  if (path === 'pulse-setup') return {body:{enabled:true,member_limit:5000,api_origin:'https://api.example.test',integrations:[{...overview.integrations[0],pulse_eligible:true,approved_prefix:'images/'}]}};
  if (path.startsWith('historical-scans/')) {
    const [,id,action]=path.split('/');
    if (action === 'start') return {body:logical()};
    if (action === 'rescan') { scanNumber=2; scanStatus='running';return {body:logical()}; }
    if (['pause','resume','cancel'].includes(action)) {scanStatus={pause:'paused',resume:'running',cancel:'cancelled'}[action];return {body:logical()};}
    if (action === 'operations') return {body:{connector_status:'connected',capacity_status:scanStatus==='completed'?'stopped':'active',cleanup_status:scanStatus==='completed'?'zero_verified':'awaiting_drain',required_action:null}};
    if (action === 'results') {
      scanAfter=url.searchParams.get('after')||'';const start=scanAfter?20:0;
      return {body:{...logical(),items:Array.from({length:start?3:20},(_,i)=>({storage_identity_key:'object-'+(start+i),status:'completed',storage_reference:{object_key:'images/item-'+(start+i)+'.jpg',storage_bucket:'offline-test-bucket'},current_source_valid:true,result:{cosine_similarity:0.8,decision:'calibration_pending'}})),next_cursor:start?null:'opaque-cursor-page-2'}};
    }
    return {body:logical()};
  }
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
  if (path === 'report') return {body:{...report(url.searchParams.get('kind')),reference:complaintId,latest_scan:scanNumber===2?{kind:'logical',...logical()}:null}};
  if (path.startsWith('pulse/')) return {body:{...report('pulse'),status:'active',vector_stored:true,scan_status:'pending_manifest',created_at:now}};
  if (path === 'matches') return {body:{items:[{case_uuid:'offline-detection',platform_content_id:'OFFLINE-CONTENT-1',classification:'EXACT',hamming_distance:0,similarity:.98}],next_skip:null,availability:'recorded_cases'}};
  if (path === 'jobs' && url.searchParams.get('kind') === 'logical') return {body:{items:[{kind:'logical',...logical()}],next_skip:null}};
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
  if(message.method==='Page.javascriptDialogOpening')await send('Page.handleJavaScriptDialog',{accept:true});
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
  await navigate('/console');await wait('document.querySelector("input[name=token]")');
  await input('input[name=token]','offline-invitation');await click('Open console');await wait('document.querySelector(".cc-dashboard-grid")');
  await navigate('/console/report/pulse');await wait('document.querySelector("input[name=object_key]")');await input('input[name=case_id]','NEW-REFERENCE');await input('input[name=object_key]','images/reference.jpg');await evaluate('document.querySelector("input[type=checkbox]").click()');await click('Prepare reference');await wait('location.pathname.endsWith("'+preparationId+'")');await wait('document.body.innerText.includes("Status: queued")');await shot('reference-queued');referenceStatus='completed';await navigate('/console/references/'+preparationId);await wait('document.body.innerText.includes("raw reference")');await click('Open reported case','a');await wait('location.pathname.includes("/cases/pulse/")');
  await navigate('/console/references');await wait('document.body.innerText.includes("NEW-REFERENCE")');
  await navigate('/console/cases/pulse/'+complaintId);await wait('document.body.innerText.includes("Library: ")');
  await click('Scan historical library');await wait('location.pathname.includes("/scans/logical/")');await wait('document.querySelectorAll("tbody tr").length===20');
  assert.equal(requests.filter(r=>r.path.endsWith('/start')).length,1);
  await shot('pulse-progress-desktop');
  await click('Next results');await wait('document.querySelectorAll("tbody tr").length===3');assert.equal(scanAfter,'opaque-cursor-page-2');
  await click('← Previous results');await wait('document.querySelectorAll("tbody tr").length===20');
  await click('Pause scan');await wait('document.querySelector("dialog[open]")');await click('Pause scan','dialog[open] button');await wait('document.body.innerText.includes("Paused — resume")');
  await click('Resume scan');await wait('document.querySelector("dialog[open]")');await click('Resume scan','dialog[open] button');await wait('document.body.innerText.includes("Processing your library")');
  scanStatus='completed';await navigate('/console/scans/logical/'+scanId);await wait('document.body.innerText.includes("Results ready for review")');
  assert.equal(await evaluate('document.body.innerText.includes("one-logical-completion")'),true);
  assert.equal(await evaluate('document.body.innerText.includes("Cleanup complete · capacity stopped")'),true);
  await click('Rescan library');await wait('document.querySelector("dialog[open]")');await click('Rescan library','dialog[open] button');await wait('location.pathname.endsWith("'+secondScanId+'")');
  await click('Cancel scan');await wait('document.querySelector("dialog[open]")');await click('Cancel scan','dialog[open] button');await wait('document.body.innerText.includes("Scan ended with recorded outcomes")');
  for(const width of [390,768,1440]) {await navigate('/console/scans/logical/'+secondScanId,width);await wait('document.querySelectorAll("tbody tr").length===20');await shot('pulse-results-'+width);await navigate('/console/integration',width);await wait('document.body.innerText.includes("Download connector bundle")');await shot('pulse-connector-'+width);}
  failure=true;await navigate('/console/scans');await wait('document.querySelector("[role=alert]")');failure=false;await click('Try again');await wait('document.querySelectorAll("tbody tr").length===1');
  referenceStatus='queued';await navigate('/console/references/'+preparationId);await wait('document.body.innerText.includes("Status: queued")');await click('Cancel preparation');await wait('document.body.innerText.includes("Status: cancelled")');
  assert.deepEqual(errors,[]);
  for(const operation of ['/leases','/pages','/bind','/compute-claim','/settled-drain']) assert.equal(requests.some(r=>r.path.endsWith(operation)),false);
  console.log(JSON.stringify({status:'PASS',evidence:'isolated UI fixtures; no live mutations/GPU',flows:['new reference form and durable intent','preparation progress and prepared case handoff','preparation list','admin complaint start','logical progress','authoritative cursor pages','pause and same-scan resume','completion receipt','explicit new rescan','cancellation','cleanup status','connector setup','error recovery'],dimensions,exceptions:errors.length},null,2));
}finally{socket.close();await fetch(`http://127.0.0.1:9340/json/close/${target.id}`);}
