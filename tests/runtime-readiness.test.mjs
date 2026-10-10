import assert from 'node:assert/strict';
import test from 'node:test';
import { waitForConsoleRequest } from '../app/lib/runtime-readiness.mjs';
import { handleConsole, CONSOLE_COOKIE } from '../app/lib/console-gateway.mjs';
const config={enabled:true,runtimeReadiness:true,backendUrl:'https://api.example.test',origins:['https://console.example.test'],secret:'synthetic-gateway-not-live-not-a-real-secret'};
const bearer='ccs_'+'a'.repeat(43), invite='cci_'+'b'.repeat(43);
function request(method='GET',body,passive=false){return new Request('https://console.example.test/api/console/session',{method,headers:{origin:config.origins[0],cookie:`${CONSOLE_COOKIE}=${bearer}`,'content-type':'application/json',...(passive?{'x-corvinth-runtime-passive':'1'}:{})},...(body?{body:JSON.stringify(body)}:{})});}
function starting(){return Response.json({protocol:'corvinth-runtime-v1',state:'starting',submitted:false},{status:202,headers:{'x-corvinth-admission':'not-submitted'}});}
test('cold dashboard does not redeem invitation or send business POST',async()=>{
 const calls=[];
 const response=await handleConsole(request('POST',{token:invite}),['session'],config,async(url,init)=>{calls.push([url.pathname,init]);return Response.json({protocol:'corvinth-runtime-v1',state:'starting'},{status:202});});
 assert.equal(response.status,202);assert.equal(response.headers.get('x-corvinth-admission'),'not-submitted');
 assert.equal(calls.length,1);assert.equal(calls[0][1].method,'GET');assert.equal(calls[0][0],'/_corvinth/runtime/ready');
 assert.equal(calls[0][1].headers['X-Corvinth-Console-Invitation'],invite);
 const body=await response.text();assert.ok(!body.includes(invite));assert.ok(!body.includes(config.secret));
});
test('passive idle polling never forwards a business call',async()=>{
 let count=0;const response=await handleConsole(request('GET',null,true),['session'],config,async(_,init)=>{count++;assert.equal(init.headers['X-Corvinth-Runtime-Passive'],'1');return Response.json({protocol:'corvinth-runtime-v1',state:'off'},{status:503});});
 assert.equal(count,1);assert.equal((await response.json()).state,'off');
});
test('readiness denial or malformed success sends no business mutation',async()=>{
 for(const mode of ['denied','malformed']){
  let count=0;const response=await handleConsole(request('POST',{token:invite}),['session'],config,async()=>{count++;if(mode==='uncertain')throw Error('secret raw transport');return Response.json(mode==='malformed'?{}:{error_code:'runtime_access_denied'},{status:mode==='denied'?401:200});});
  assert.equal(count,1);assert.ok(response.status>=400);assert.ok(!(await response.text()).includes('secret raw transport'));
 }
});
test('transient readiness transport remains explicitly unsubmitted',async()=>{
 for(const status of [429,502,503,504,'network']){
  let calls=0;const response=await handleConsole(request('POST',{token:invite}),['session'],config,async()=>{calls++;if(status==='network')throw Error('secret transport');return new Response('',{status});});
  assert.equal(calls,1);assert.equal(response.status,202);assert.equal(response.headers.get('x-corvinth-admission'),'not-submitted');
  assert.equal((await response.json()).submitted,false);
 }
});
test('disabled controller is not converted to transient startup',async()=>{
 const response=await handleConsole(request('POST',{token:invite}),['session'],config,async()=>Response.json({protocol:'corvinth-runtime-v1',state:'disabled'},{status:503}));
 assert.equal(response.status,503);
});
test('browser repeats only explicit unsubmitted admission and respects deadline',async()=>{
 let now=0,calls=0;
 await assert.rejects(waitForConsoleRequest(async()=>{calls++;return starting();},{clock:()=>now,sleep:async ms=>{now+=ms;}}),/3 minutes/);
 assert.equal(now,180000);assert.equal(calls,90);
});
test('browser never repeats uncertain network or ordinary processing responses',async()=>{
 let calls=0;await assert.rejects(waitForConsoleRequest(async()=>{calls++;throw Error('uncertain');}),/uncertain/);assert.equal(calls,1);
 for(const response of [new Response('',{status:503}),Response.json({status:'accepted'},{status:202}),Response.json({protocol:'other'},{status:202,headers:{'x-corvinth-admission':'not-submitted'}})]){
  calls=0;assert.equal(await waitForConsoleRequest(async()=>{calls++;return response;}),response);assert.equal(calls,1);
 }
});
test('browser proceeds once readiness starts the normal application operation',async()=>{
 let now=0,calls=0;
 const response=await waitForConsoleRequest(async()=>++calls===1?starting():Response.json({case_uuid:'test'}),{clock:()=>now,sleep:async ms=>{now+=ms;}});
 assert.equal(calls,2);assert.equal((await response.json()).case_uuid,'test');
});
