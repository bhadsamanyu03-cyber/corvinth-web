// Local-only browser regression check. Start dev:3091, production:3092 and a
// disposable Chrome --remote-debugging-port=9333; set DEMO_SCREENSHOTS to a temp dir.
// Gateway replies are intercepted: this verifies UI, NOT backend integration.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const production = 'http://127.0.0.1:3092';
const development = 'http://localhost:3091';
const target = await (await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
let id = 0, mockSession = null, rejectToken = false, failEnd = false;
const awaiting = new Map(), errors = [], requests = [], accessCalls = [], dimensions = [];
const active = () => ({ status: 'active', expires_at: new Date(Date.now() + 600000).toISOString(), max_runs: 10, runs_used: 3, runs_remaining: 7, execution_available: false });
socket.addEventListener('message', async (event) => {
  const data = JSON.parse(event.data);
  if (data.id) {
    const task = awaiting.get(data.id); awaiting.delete(data.id);
    if (data.error) task.reject(new Error(JSON.stringify(data.error))); else task.resolve(data.result);
  }
  if (data.method === 'Runtime.exceptionThrown') errors.push(data.params.exceptionDetails.text);
  if (data.method === 'Network.requestWillBeSent') requests.push(data.params.request.url);
  if (data.method === 'Fetch.requestPaused') {
    const method = data.params.request.method;
    accessCalls.push(method);
    const failure = (method === 'POST' && rejectToken) || (method === 'DELETE' && failEnd);
    if (method === 'POST' && !failure) mockSession ||= active();
    if (method === 'DELETE' && !failure) mockSession = null;
    const body = failure ? { error: method === 'POST' ? 'demo_token_invalid' : 'demo_unavailable' }
      : mockSession || { status: method === 'DELETE' ? 'ended' : 'inactive' };
    await send('Fetch.fulfillRequest', { requestId: data.params.requestId, responseCode: failure ? 403 : 200,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(body)).toString('base64') });
  }
});
function send(method, params = {}) {
  return new Promise((resolve, reject) => { const number = ++id; awaiting.set(number, { resolve, reject }); socket.send(JSON.stringify({ id: number, method, params })); });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function wait(expression) {
  for (let n = 0; n < 150; n++) { if (await evaluate(`Boolean(${expression})`)) return; await delay(100); }
  throw new Error(`Timeout: ${expression}`);
}
async function click(text) {
  assert.equal(await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith(${JSON.stringify(text)}));if(!b||b.disabled)return false;b.click();return true})()`), true, `Click ${text}`);
}
async function input(name, value) { await evaluate(`document.querySelector('input[name="${name}"]').value=${JSON.stringify(value)}`); }
async function chooseMode(mode) { await evaluate(`document.querySelector('#demo-mode-${mode}').click()`); }
async function selectAsset(index) { await evaluate(`document.querySelector('[data-asset-id="fixture_asset_${index}"]').click()`); }
async function search(value) {
  await evaluate(`(()=>{const input=document.querySelector('input[type="search"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}))})()`);
}
async function control(index, value) {
  await evaluate(`(()=>{const s=document.querySelectorAll('select')[${index}];s.value=${JSON.stringify(value)};s.dispatchEvent(new Event('change',{bubbles:true}))})()`);
}
async function size(width) { await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false }); }
async function navigate(url, width = 1440) {
  await size(width); await send('Page.navigate', { url });
  await wait(`document.readyState === 'complete' && (document.querySelector('#demo-start') || document.querySelector('input[name="token"]') || document.querySelector('#demo-mode-managed'))`);
  await delay(300);
}
async function shot(name, selector = '[data-demo-shell]', offset = 0) {
  await evaluate('document.fonts.ready');
  const metrics = await evaluate(`(()=>{document.documentElement.style.scrollBehavior='auto';const el=document.querySelector(${JSON.stringify(selector)});window.scrollTo({top:scrollY+el.getBoundingClientRect().top-${offset},behavior:'instant'});return {name:${JSON.stringify(name)},width:innerWidth,overflow:el.scrollWidth>el.clientWidth,images:[...el.querySelectorAll('img')].filter(i=>i.complete&&!i.naturalWidth).length}})()`);
  assert.equal(metrics.overflow, false, `${name} overflow`); assert.equal(metrics.images, 0, `${name} images`); dimensions.push(metrics);
  await delay(350);
  // Next's fragment navigation can finish after hydration. Reframe after it settles.
  await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});window.scrollTo({top:scrollY+el.getBoundingClientRect().top-${offset},behavior:'instant'})})()`);
  await delay(100);
  if (process.env.DEMO_SCREENSHOTS) {
    const data = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(join(process.env.DEMO_SCREENSHOTS, `${name}.png`), Buffer.from(data.data, 'base64'));
  }
}
async function unlock() {
  await wait(`document.querySelector('input[name="token"]') && !document.querySelector('input[name="token"]').disabled`);
  await input('token', 'fixture-local-only'); await click('Start demo');
  await wait(`document.querySelector('#demo-mode-managed')`);
}
async function assets(count) { await wait(`document.querySelectorAll('button[aria-pressed] [class*="thumbnail"]').length===${count}`); }

try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*api/live-demo/session*' }] });
  await navigate(`${production}/#demo`);
  const surrounding = await evaluate(`({sections:document.querySelectorAll('section').length, links:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.getAttribute('href').slice(1))).map(a=>a.getAttribute('href'))})`);
  assert.deepEqual(surrounding.links, []);
  assert.equal(await evaluate(`document.querySelector('#demo').querySelectorAll('img, #demo-workspace').length`), 0);
  await shot('homepage-context-desktop', '#demo', 150);
  await click('Try Corvinth'); await wait(`document.querySelector('input[name="token"]') && !document.querySelector('input[name="token"]').disabled`);
  await shot('homepage-access-desktop', '#demo-access', 120);
  await click('Request a token');
  assert.equal(await evaluate(`document.querySelectorAll('#demo-access input').length`), 2);
  await input('work_email', 'buyer@example.com'); await input('company_url', 'https://example.com');
  const count = accessCalls.length;
  await click('Request demo token'); await wait(`document.querySelector('#demo-access [role="alert"]')`);
  assert.equal(await evaluate(`document.querySelector('#demo-access').textContent.includes('Request sent.')`), false);
  assert.equal(accessCalls.length, count);
  await shot('homepage-request-unavailable', '#demo-access', 120);
  await click('I have a token'); rejectToken = true;
  await input('token', 'fixture-local-only'); await click('Start demo'); await wait(`document.querySelector('#demo-access [role="alert"]')`);
  assert.equal(await evaluate('location.pathname'), '/');
  rejectToken = false; await unlock();
  assert.equal(await evaluate('location.pathname'), '/demo');
  assert.ok((await evaluate(`document.querySelector('[class*="allowance"]').textContent`)).includes('7 runs remaining'));
  assert.equal(await evaluate(`document.querySelectorAll('[data-empty-slot], [data-asset-id]').length`), 0, 'Choose compute before opening the library');
  await shot('workspace-mode-desktop');
  const redemptions = accessCalls.filter((method) => method === 'POST').length;
  await navigate(`${production}/demo`);
  assert.equal(accessCalls.filter((method) => method === 'POST').length, redemptions);
  await chooseMode('managed'); await assets(4);
  assert.equal(await evaluate(`document.querySelectorAll('[data-empty-slot]').length`), 0);
  assert.equal(await evaluate(`document.querySelectorAll('[data-asset-id]').length`), 4, 'Only four approved originals can be reported');
  assert.equal(await evaluate(`[...document.querySelectorAll('[data-demo-library] img')].every(image => new URL(image.src).pathname.startsWith('/demo-assets/originals/'))`), true);
  await evaluate(`document.querySelector('[data-asset-id]').click()`);
  await wait(`document.querySelector('[data-demo-selection] img')?.naturalWidth > 0`);
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.startsWith('Report image')).disabled`), true);
  assert.equal(await evaluate(`!!document.querySelector('[data-classification]')`), false);
  assert.equal(await evaluate(`document.body.textContent.includes('a fresh, short-lived presigned URL')`), true);
  await shot('workspace-approved-originals-desktop');
  failEnd = true; await click('Exit demo'); await wait(`document.querySelector('[role="alert"]')`);
  assert.equal(await evaluate('location.pathname'), '/demo'); failEnd = false;
  await click('Exit demo'); await wait(`location.pathname==='/' && document.querySelector('#demo-start')`);
  await navigate(`${production}/demo`); await wait(`document.querySelector('input[name="token"]')`);
  assert.equal(await evaluate(`!!document.querySelector('#demo-workspace')`), false);
  await shot('workspace-access-desktop');

  for (const width of [390, 320]) {
    await navigate(`${production}/#demo`, width); await shot(`homepage-context-${width}`, '#demo', 90);
    await click('Try Corvinth'); await wait(`document.querySelector('input[name="token"]') && !document.querySelector('input[name="token"]').disabled`);
    await shot(`homepage-access-${width}`, '#demo-access', 90);
    await click('Request a token'); await shot(`homepage-request-${width}`, '#demo-access', 90);
    await navigate(`${production}/demo`, width); await shot(`workspace-access-${width}`);
    await unlock(); await chooseMode('managed'); await assets(4);
    assert.equal(await evaluate(`[...document.querySelectorAll('[data-demo-library] img')].every(image => new URL(image.src).pathname.startsWith('/demo-assets/originals/'))`), true);
    await evaluate(`document.querySelector('[data-asset-id]').click()`);
    await wait(`document.querySelector('[data-demo-selection] img')?.naturalWidth > 0`);
    await shot(`workspace-approved-originals-${width}`);
    await shot(`workspace-approved-preview-${width}`, '[data-demo-selection]');
    assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent.startsWith('Report image')).disabled`), true);
    await click('Exit demo'); await wait(`location.pathname==='/'`);
  }

  await navigate(`${development}/demo-development`);
  await click('Request a token'); await input('work_email', 'buyer@example.com'); await input('company_url', 'https://example.com');
  await control(3, 'demo_request_unconfirmed'); await click('Request demo token'); await wait(`document.querySelector('[role="alert"]')`);
  assert.equal(await evaluate(`document.body.textContent.includes('Request sent.')`), false);
  await control(3, ''); await click('Request demo token'); await wait(`document.body.textContent.includes('Request sent.')`);
  assert.equal(await evaluate(`document.body.textContent.includes('I’ll send your demo token to your work email.')`), true);
  await shot('fixture-request-receipt');
  await click('I have a token'); await unlock(); await chooseMode('managed'); await assets(6);
  await selectAsset(0);
  await chooseMode('managed');
  assert.equal(await evaluate(`document.querySelector('[data-asset-id="fixture_asset_0"]').getAttribute('aria-pressed')`), 'true', 'Re-selecting the active mode keeps the selected image');
  await chooseMode('customer'); await assets(6);
  assert.equal(await evaluate(`document.querySelectorAll('[data-asset-id][aria-pressed="true"]').length`), 0, 'Mode change clears the selection');
  assert.equal(await evaluate(`document.body.textContent.includes('derived signals computed by the Corvinth SDK')`), true);
  assert.ok((await evaluate(`document.querySelector('[class*="allowance"]').textContent`)).includes('10 runs remaining'));
  await chooseMode('managed'); await assets(6);
  await evaluate(`document.querySelector('[aria-label="Next images"]').click()`);
  await wait(`document.querySelector('[data-asset-id="fixture_asset_6"]')`);
  await selectAsset(6);
  assert.equal(await evaluate(`document.querySelector('[class*="previewHeading"]').textContent.includes('Demo asset 07')`), true);
  await search('24'); await assets(1); await selectAsset(23);
  await search('not an image'); await assets(0);
  assert.equal(await evaluate(`document.body.textContent.includes('No images match.')`), true);
  await search(''); await assets(6); await selectAsset(0);
  assert.equal(await evaluate(`document.querySelector('#demo-workspace').querySelectorAll('img').length`), 0, 'Development uses neutral slots, never website images');
  assert.equal(await evaluate(`(()=>{const preview=document.querySelector('[data-demo-selection]').getBoundingClientRect();const library=document.querySelector('[data-demo-library]').getBoundingClientRect();return preview.right<library.left})()`), true, 'Desktop preview is beside the library');
  await shot('fixture-reference-desktop');
  await control(2, '6000'); await click('Report image'); await shot('fixture-loading-desktop');
  await wait(`document.querySelector('[class*="activeReference"]')`); await assets(6); await control(2, '700');
  assert.equal(await evaluate(`!!document.querySelector('#demo-mode-managed')`), false, 'Active reference freezes compute mode');
  await selectAsset(1); await shot('fixture-upload-desktop'); await click('Check image');
  await wait(`document.querySelector('[data-classification="EXACT"]')`); await shot('fixture-result-desktop');
  for (const classification of ['FUZZY', 'NEAR_MISS', 'CLEAN']) {
    await click('Try another upload'); await control(0, classification); await selectAsset(2); await click('Check image');
    await wait(`document.querySelector('[data-classification="${classification}"]')`);
  }
  const budget = await evaluate(`document.querySelector('[class*="allowance"]').textContent`);
  await click('Choose another reference'); await wait(`document.querySelector('#demo-mode-customer')`);
  assert.equal(await evaluate(`document.querySelector('[class*="allowance"]').textContent`), budget);
  await chooseMode('customer'); await assets(6); await selectAsset(0);
  await shot('fixture-customer-desktop');
  await control(1, 'demo_unavailable'); await click('Report image'); await wait(`document.querySelector('[role="alert"]')`);
  await assets(6); await shot('fixture-error-desktop');
  await control(1, ''); await click('Report image'); await wait(`document.querySelector('[class*="activeReference"]')`); await assets(6); await selectAsset(1);
  await control(1, 'demo_session_invalid'); await click('Check image'); await wait(`document.querySelector('input[name="token"]')`);
  assert.equal(await evaluate(`!!document.querySelector('#demo-workspace')`), false);
  await shot('fixture-expired-desktop');

  for (const width of [390, 320]) {
    await navigate(`${development}/demo-development`, width); await unlock(); await shot(`fixture-mode-${width}`);
    await chooseMode('managed'); await assets(6); await selectAsset(0); await shot(`fixture-reference-${width}`);
    assert.equal(await evaluate(`(()=>{const preview=document.querySelector('[data-demo-selection]').getBoundingClientRect();const library=document.querySelector('[data-demo-library]').getBoundingClientRect();return preview.top>library.bottom})()`), true, 'Mobile library precedes preview');
    await shot(`fixture-preview-${width}`, '[data-demo-selection]');
    await click('Report image'); await wait(`document.querySelector('[class*="activeReference"]')`); await assets(6); await selectAsset(1); await shot(`fixture-upload-${width}`);
    await click('Check image'); await wait(`document.querySelector('[data-classification="EXACT"]')`); await shot(`fixture-result-${width}`);
  }
  assert.equal((await fetch(`${production}/demo-development`)).status, 404);
  assert.deepEqual(requests.filter((url) => /hash\/|demo\/check|api\/waitlist/.test(url)), []);
  assert.deepEqual(requests.filter((url) => /demo-development\/neutral-slot/.test(url)), [], 'Neutral fixture sentinels must never be requested');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ surrounding, dimensions, exceptions: errors, productionFixtures: 404, gateway: 'Intercepted locally; no real token or backend call', flows: 'access, invalid token, request unavailable, redirect, resume, failed exit, exit, locked route, mode, reference, upload, four results, reset, error, expiry' }, null, 2));
} catch (error) {
  console.error(await evaluate('({path:location.pathname,text:document.body.innerText})'), errors);
  throw error;
} finally {
  await send('Page.close'); socket.close();
}
