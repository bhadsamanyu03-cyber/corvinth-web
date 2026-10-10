import { DemoError, readSession } from './demo-contract.mjs';
import { approvedDemoCatalogue } from './demo-catalogue.mjs';
import { waitForConsoleRequest } from './runtime-readiness.mjs';

async function sessionRequest(method, token, signal) {
  try {
    const response = await waitForConsoleRequest(() => fetch('/api/live-demo/session', {
      method, signal, credentials: 'same-origin', cache: 'no-store',
      ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) } : {}),
    }), { signal });
    const data = await response.json();
    if (!response.ok) throw new DemoError(typeof data.error === 'string' ? data.error : 'demo_unavailable');
    return readSession(data);
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof DemoError) throw error;
    throw new DemoError();
  }
}

async function operationRequest(operation, { signal, ...body }) {
  try {
    const response = await waitForConsoleRequest(() => fetch('/api/live-demo/' + operation, { method: 'POST', signal,
      credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), { signal });
    const data = await response.json();
    if (!response.ok) throw new DemoError(typeof data.error === 'string' ? data.error : 'demo_unavailable');
    return data;
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof DemoError) throw error;
    throw new DemoError();
  }
}

// Execution has one explicit connection point. No guessed routes or fallback results.
export const liveDemoClient = Object.freeze({
  startupWaitSupported: true,
  getSession: ({ signal }) => sessionRequest('GET', undefined, signal),
  startSession: ({ token, signal }) => sessionRequest('POST', token, signal),
  endSession: ({ signal }) => sessionRequest('DELETE', undefined, signal),
  listAssets: async () => approvedDemoCatalogue(),
  getInput: (options) => operationRequest('input', options),
  reportReference: (options) => operationRequest('report', options),
  checkUpload: (options) => operationRequest('check', options),
  resetReference: (options) => operationRequest('reset', options),
});
