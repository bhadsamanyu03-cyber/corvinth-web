// Isolated browser fixtures: no real API, source, budget or GPU mutations.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const base = process.env.PULSE_BROWSER_BASE || 'http://127.0.0.1:3099';
const output = process.env.PULSE_BROWSER_EVIDENCE;
if (output) await mkdir(output, { recursive: true });
const cdp = 'http://127.0.0.1:9340';
const target = await (await fetch(cdp+'/json/new?about:blank', { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
const pending = new Map(), errors = [], requests = [], shots = [];
let serial = 0, state = 'running', preparation = 'completed', missingConnection = false, noApproval = false;
let loseStartResponse = true, cleanup = 'awaiting_drain', after = '', scanNumber = 1;
const id = '94152ebd-19d8-510c-bef5-b938a9ad68b0', second = '628df4ff-f728-48d9-92fe-5e0bdf37b07e';
const complaint = '4c4194fd-c292-50ea-8e54-0d1236da0674', ref = '02461023-2a7d-4d44-95e8-7d9553cc5a72';
const now = new Date().toISOString();
const session = { status:'active', platform_id:'fixture-tenant', platform_name:'Fixture customer', permissions:{pdq_report:true,pulse_report:true} };
const integration = { id:'fixture-library',storage_bucket:'customer-images',bucket_region:'us-east-1',approved_prefix:'images/',version_policy:'immutable_keys',pulse_eligible:true };
function scan() { return { scan_id:scanNumber===1?id:second,complaint_id:complaint,status:state,expected:23,counts:{completed:state==='completed'?23:10,failed:0,cancelled:state==='cancelled'?13:0,pending:state==='running'?13:0,processing:0,pending_publication:0},discovery:{status:'sealed'},created_at:now,completed_at:state==='completed'?now:null,...(['completed','cancelled'].includes(state)?{completion_event:{event_id:'authoritative-completion'}}:{}) }; }
function fixture(path, method, body, url) {
  if(path==='session')return session;
  if(path==='pulse-setup')return {enabled:!noApproval,member_limit:5000,api_origin:'https://fixture.invalid',integrations:[{...integration,pulse_eligible:!noApproval,connector_status:{connected:!missingConnection,last_seen_at:now,reference_preparation_supported:true}}]};
  if(path==='overview')return {platform:{platform_id:'fixture-tenant',platform_name:'Fixture customer',status:'active'},permissions:session.permissions,integrations:[{...integration,status:'active'}],webhook:{configured:false}};
  if(path==='reference-preparations')return {items:[{preparation_id:ref,complaint_id:complaint,case_id:'REVIEWED-REFERENCE',status:preparation}],next_cursor:null};
  if(path===`reference-preparations/${ref}`)return {preparation_id:ref,complaint_id:complaint,case_id:'REVIEWED-REFERENCE',status:preparation,cleanup_status:preparation==='completed'?'zero_verified':'not_started'};
  if(path==='report')return {reference:complaint,case_id:'REVIEWED-REFERENCE',status:'active'};
  if(path==='reports')return {items:[{reference:complaint,case_id:'REVIEWED-REFERENCE',status:'active'}],next_skip:null};
  if(path==='jobs')return {items:[scan()],next_skip:null};
  if(path.startsWith('historical-scans/')) {
    const action=path.split('/')[2];
    if(action==='start') {
      assert.deepEqual(body.storage_scope,{storage_integration_id:integration.id,selected_prefix:integration.approved_prefix});
      assert.deepEqual(Object.keys(body).sort(),['request_id','storage_scope']);
      return scan();
    }
    if(action==='rescan'){scanNumber=2;state='running';cleanup='awaiting_drain';return scan();}
    if(['pause','resume','cancel'].includes(action)){state={pause:'paused',resume:'running',cancel:'cancelled'}[action];return scan();}
    if(action==='operations')return {connector_status:'connected',capacity_status:cleanup==='zero_verified'?'stopped':'active',cleanup_status:cleanup,required_action:null};
    if(action==='results'){
      after=url.searchParams.get('after')||'';
      return {items:Array.from({length:after?3:20},(_,i)=>({storage_identity_key:`object-${after?20+i:i}`,storage_reference:{object_key:`images/${i}.jpg`,storage_bucket:integration.storage_bucket},status:'completed',current_source_valid:true,result:{cosine_similarity:0.8,decision:'calibration_pending'}})),next_cursor:after?null:'opaque-next-page'};
    }
    return scan();
  }
  throw new Error('Unhandled fixture: '+method+' '+path);
}
function send(method,params={}) {return new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});}
socket.addEventListener('message',async event=>{
  const m=JSON.parse(event.data);
  if(m.id){const wait=pending.get(m.id);pending.delete(m.id);m.error?wait.reject(new Error(JSON.stringify(m.error))):wait.resolve(m.result);}
  if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);
  if(m.method==='Fetch.requestPaused'){
    const request=m.params.request,url=new URL(request.url),path=url.pathname.replace('/api/console/',''),body=request.postData?JSON.parse(request.postData):{};
    requests.push({path,method:request.method,body});
    try {
      let result=fixture(path,request.method,body,url),status=200;
      if(path.endsWith('/start')&&loseStartResponse){loseStartResponse=false;status=503;result={message:'Response was lost. Retry the same intent.'};}
      await send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify(result)).toString('base64')});
    }catch(error){if(!error.message.includes('Invalid InterceptionId')){errors.push({message:error.message});await send('Fetch.failRequest',{requestId:m.params.requestId,errorReason:'Failed'}).catch(()=>{});}}
  }
});
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function wait(expression){for(let i=0;i<300;i++){if(await evaluate(`Boolean(${expression})`))return;await sleep(100);}throw new Error('Timed out: '+expression);}
async function navigate(path,width=1440){await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+path});await wait('document.querySelector(".cc-sidebar")');}
async function click(text,selector='button'){await wait(`[...document.querySelectorAll(${JSON.stringify(selector)})].some(x=>x.textContent.trim().startsWith(${JSON.stringify(text)})&&!x.disabled)`);await evaluate(`(()=>{[...document.querySelectorAll(${JSON.stringify(selector)})].find(x=>x.textContent.trim().startsWith(${JSON.stringify(text)})&&!x.disabled).click()})()`);}
async function shot(name){await evaluate('document.fonts.ready');await sleep(250);assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false,name+' overflow');shots.push(name);if(output){const r=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,name+'.png'),Buffer.from(r.data,'base64'));}}
try {
  await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*api/console/*'}]});
  for(const width of [390,768,1440]){await navigate('/console/pulse',width);await wait('document.body.innerText.includes("Library connected")');await shot('pulse-'+width);}
  assert.equal(requests.some(r=>r.method!=='GET'),false,'Visiting Pulse must not enable spending or create intent');
  noApproval=true;await navigate('/console/pulse');await wait('document.body.innerText.includes("Onboarding required")');assert.equal(await evaluate('[...document.querySelectorAll("a.cc-primary")].some(x=>x.textContent==="Scan historical library")'),false);noApproval=false;
  missingConnection=true;await navigate('/console/pulse');await wait('document.body.innerText.includes("Waiting for your connector")');missingConnection=false;
  await navigate('/console/integration');await wait('document.body.innerText.includes("Your connector is connected")');assert.equal(await evaluate('[...document.querySelectorAll("details")].find(x=>x.textContent.includes("Download installer")).open'),false);
  preparation='queued';await navigate('/console/references/'+ref);await wait('document.body.innerText.includes("Status: queued")');assert.equal(await evaluate('document.body.innerText.includes("GPU spending is disabled")'),false);
  preparation='completed';await navigate('/console/references/'+ref);await wait('document.body.innerText.includes("Library: customer-images")');assert.equal(await evaluate('document.querySelectorAll("select").length'),0);
  await click('Scan historical library');await wait('document.body.innerText.includes("Response was lost")');
  await navigate('/console/references/'+ref);await click('Scan historical library');await wait('location.pathname.endsWith("'+id+'")');await wait('document.body.innerText.includes("Processing your library")');
  const starts=requests.filter(r=>r.path.endsWith('/start'));assert.equal(starts.length,2);assert.equal(starts[0].body.request_id,starts[1].body.request_id);
  await click('Next results');await wait('document.querySelectorAll("tbody tr").length===3');assert.equal(after,'opaque-next-page');
  await click('← Previous results');await wait('document.querySelectorAll("tbody tr").length===20');
  await click('Pause scan');await click('Pause scan','dialog[open] button');await wait('document.body.innerText.includes("Paused — resume")');
  await click('Resume scan');await click('Resume scan','dialog[open] button');await wait('document.body.innerText.includes("Processing your library")');
  state='completed';cleanup='in_progress';await navigate('/console/scans/logical/'+id);await wait('document.body.innerText.includes("Results ready for review")');await wait('document.body.innerText.includes("shutting down compute automatically")');
  assert.equal(await evaluate('document.body.innerText.includes("capacity stopped")'),false);
  cleanup='zero_verified';await navigate('/console/scans/logical/'+id);await wait('document.body.innerText.includes("Cleanup complete · capacity stopped")');await shot('completed');
  await click('Rescan library');await click('Rescan library','dialog[open] button');await wait('location.pathname.endsWith("'+second+'")');
  const rescans=requests.filter(r=>r.path.endsWith('/rescan'));assert.equal(rescans.length,1);assert.notEqual(rescans[0].body.request_id,starts[0].body.request_id);
  await click('Cancel scan');await click('Cancel scan','dialog[open] button');await wait('document.body.innerText.includes("Scan ended with recorded outcomes")');
  assert.deepEqual(errors,[]);
  const proof={verdict:'PASS',scope:'Isolated UI fixtures only; no live compute or storage writes',shots,ambiguous_start_same_identity:true,explicit_rescan_distinct:true,pagination:true,pause_resume_cancel:true,completion_cleanup_separate:true,exceptions:errors.length};
  if(output)await writeFile(join(output,'browser.json'),JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
}finally{socket.close();await fetch(cdp+'/json/close/'+target.id);}
