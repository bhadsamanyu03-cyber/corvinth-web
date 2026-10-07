import test from 'node:test';
import assert from 'node:assert/strict';
import { handleDemoOperation, DEMO_COOKIE } from '../app/lib/demo-gateway.mjs';
import { readBatch, readResult } from '../app/lib/demo-contract.mjs';
import { initialDemoState, demoReducer, canExecute } from '../app/lib/demo-state.mjs';

const config = { enabled:true, secret:'gateway-'.repeat(6), backendUrl:'https://backend.test' };
const body = {asset_ids:['v1','v2','v3'],mode:'managed',manifest_version:'manifest',reference_id:'reference',cycle_revision:1,operation_key:'batch'};
const session = {status:'active',max_runs:15,runs_used:3,runs_remaining:12,execution_available:true,expires_at:new Date(Date.now()+600000).toISOString()};
const request = (b) => new Request('https://corvinth.com/api/live-demo/check',{method:'POST',headers:{origin:'https://corvinth.com','content-type':'application/json',cookie:DEMO_COOKIE+'=cds_'+'x'.repeat(43)},body:JSON.stringify(b)});
const hashes = {standard:Array(8).fill('0'.repeat(64)),normalized:Array(8).fill('0'.repeat(64))};
const result = (id) => ({classification:'EXACT',reference_id:'reference',upload_asset_id:id,mode:'managed',cycle_revision:1,request_id:'request_'+id,
  pdq:{hamming_distance:0,lane:'standard',pair_kind:'winning',reference_hash:'0'.repeat(64),attempted_hash:'0'.repeat(64),reference_hashes:hashes,attempted_hashes:hashes},
  dino:{profile:{algorithm_version:'qualified',model_version:'dinov2-small',configuration_version:'qualified'},cosine_similarity:0.8734,reference_vector:Array(384).fill(0.1),candidate_vector:Array(384).fill(0.2)}});

test('batch gateway returns the ordered real result projection and no DINO classifier',async()=>{
  const response = await handleDemoOperation(request(body),'check',config,async(url,init)=>{
    assert.equal(url,'https://backend.test/demo/v1/check'); assert.deepEqual(JSON.parse(init.body),body);
    return Response.json({results:body.asset_ids.map(id=>({asset_id:id,result:{...result(id),private:'credential'}})),session});
  });
  assert.equal(response.status,200); const data=await response.json();
  assert.deepEqual(data.results.map(e=>e.asset_id),body.asset_ids);
  assert.equal(data.results[0].result.pdq.hamming_distance,0);
  assert.equal(data.results[0].result.dino.candidate_vector.length,384);
  assert.equal(data.results[0].result.dino.classification,undefined);
  assert.ok(!JSON.stringify(data).includes('credential'));
});

test('invalid whole selections never reach backend; insufficient budget and failed attempts stay truthful',async()=>{
  let calls=0; const forbidden=async()=>{calls++;throw Error();};
  for(const ids of [[],['v1','v1'],['v1','v2','v3','v4']]) assert.equal((await handleDemoOperation(request({...body,asset_ids:ids}),'check',config,forbidden)).status,400);
  assert.equal(calls,0);
  assert.equal((await handleDemoOperation(request(body),'check',config,async()=>Response.json({error:'demo_run_limit'},{status:429}))).status,429);
  const entries=readBatch({results:[{asset_id:'v1',error:'demo_unavailable'},{asset_id:'v2',result:result('v2')},{asset_id:'v3',result:result('v3')}]},body);
  assert.equal(entries[0].result,undefined); assert.equal(entries[2].result.classification,'EXACT');
  assert.throws(()=>readBatch({results:[{asset_id:'v2',result:result('v2')}]},body));
});

test('input projection preserves actual short-lived URL only on gated input response',async()=>{
  const context={asset_id:'original',mode:'managed',manifest_version:'manifest'};
  const input={...context,expires_at:Math.floor(Date.now()/1000)+60,input_token:'opaque.'+'a'.repeat(64),presigned_url:'https://bucket.s3.us-east-1.amazonaws.com/exact?signature=live'};
  const response=await handleDemoOperation(request(context),'input',config,async()=>Response.json({input:{...input,secret:'private'}}));
  assert.equal(response.status,200); const data=await response.json(); assert.equal(data.input.presigned_url,input.presigned_url); assert.equal(data.input.secret,undefined);
});

test('PDQ pair must be real distance and from the returned lane sets; Customer DINO is rejected',()=>{
  const data=result('v1'); const expected={...body,asset_id:'v1'};
  assert.equal(readResult(data,expected).pdq.reference_hash,'0'.repeat(64));
  assert.throws(()=>readResult({...data,pdq:{...data.pdq,hamming_distance:1}},expected));
  assert.throws(()=>readResult({...data,mode:'customer'},{...expected,mode:'customer'}));
  const {dino,...pdqOnly}=data;
  assert.equal(dino.candidate_vector.length,384);
  assert.equal(readResult({...pdqOnly,mode:'customer'},{...expected,mode:'customer'}).dino,undefined);
});

test('three selections toggle across slides, cap at three, and never permit partial budget execution',()=>{
  const assets=['v1','v2','v3','v4'].map(id=>({id,can_upload:true}));
  let state={...initialDemoState,session:{...session,runs_used:13,runs_remaining:2},stage:'upload',library:'ready',assets,reference:{reference_id:'reference'}};
  for(const id of ['v1','v2','v3']) state=demoReducer(state,{type:'SELECT',id});
  assert.equal(state.selections.length,3); assert.equal(canExecute(state),false);
  assert.equal(demoReducer(state,{type:'SELECT',id:'v4'}),state);
  state=demoReducer(state,{type:'SELECT',id:'v2'}); assert.deepEqual(state.selections.map(a=>a.id),['v1','v3']); assert.equal(canExecute(state),true);
});
