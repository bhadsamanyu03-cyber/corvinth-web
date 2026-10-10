import test from 'node:test';
import assert from 'node:assert/strict';
import {handleDemoSession,handleDemoOperation,DEMO_COOKIE} from '../app/lib/demo-gateway.mjs';
const config={enabled:true,runtimeReadiness:true,secret:'synthetic-demo-gateway-at-least-32-characters',backendUrl:'https://api.example.test',origins:['https://console.example.test']};
const token='cdt_'+'a'.repeat(43),session='cds_'+'b'.repeat(43);
function request(method='POST',body={token}){return new Request('https://console.example.test/api/live-demo/session',{method,headers:{origin:config.origins[0],'content-type':'application/json',...(method!=='POST'?{cookie:`${DEMO_COOKIE}=${session}`}:{})},...(body?{body:JSON.stringify(body)}:{})});}
test('cold demo validates token and sends only readiness GET before redemption',async()=>{
 const calls=[];const r=await handleDemoSession(request(),config,async(url,init)=>{calls.push([url,init]);return Response.json({protocol:'corvinth-runtime-v1',state:'starting'},{status:202});});
 assert.equal(r.status,202);assert.equal(r.headers.get('x-corvinth-admission'),'not-submitted');assert.equal(calls.length,1);assert.equal(calls[0][1].method,'GET');assert.equal(calls[0][1].headers['X-Corvinth-Demo-Token'],token);assert.equal((await r.json()).submitted,false);
});
test('demo invalid local inputs and fresh credential denial cannot submit',async()=>{
 let calls=0;let r=await handleDemoSession(request('POST',{token:'invalid'}),config,async()=>{calls++;});assert.equal(r.status,400);assert.equal(calls,0);
 r=await handleDemoSession(request(),config,async()=>{calls++;return Response.json({error_code:'runtime_access_denied'},{status:401});});assert.equal(r.status,401);assert.equal(calls,1);
});
test('demo transient probe failure is safely unsubmitted; absent session never wakes',async()=>{
 let calls=0;let r=await handleDemoSession(request(),config,async()=>{calls++;throw Error('private transport detail');});assert.equal(r.status,202);assert.equal(calls,1);assert.ok(!(await r.text()).includes('private transport detail'));
 r=await handleDemoSession(new Request('https://console.example.test/api/live-demo/session'),config,async()=>{calls++;});assert.equal(r.status,200);assert.equal(calls,1);
});
test('uncertain demo operation is never converted to retryable admission',async()=>{
 const req=new Request('https://console.example.test/api/live-demo/reset',{method:'POST',headers:{origin:config.origins[0],'content-type':'application/json',cookie:`${DEMO_COOKIE}=${session}`},body:JSON.stringify({operation_key:'synthetic-key',reference_id:'synthetic-ref',cycle_revision:1})});let calls=0;
 const r=await handleDemoOperation(req,'reset',config,async()=>{calls++;if(calls===1)return Response.json({protocol:'corvinth-runtime-v1',state:'ready'});throw Error('ambiguous POST');});
 assert.equal(calls,2);assert.equal(r.status,503);assert.equal(r.headers.get('x-corvinth-admission'),null);
});
