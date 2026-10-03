import { DemoError, readSession } from './demo-contract.mjs';

async function sessionRequest(method, token, signal) {
  try {
    const response = await fetch('/api/live-demo/session', {
      method, signal, credentials: 'same-origin', cache: 'no-store',
      ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) } : {}),
    });
    const data = await response.json();
    if (!response.ok) throw new DemoError(typeof data.error === 'string' ? data.error : 'demo_unavailable');
    return readSession(data);
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof DemoError) throw error;
    throw new DemoError();
  }
}

const disconnected = async () => { throw new DemoError('demo_execution_unavailable'); };

// Execution has one explicit connection point. No guessed routes or fallback results.
export const liveDemoClient = Object.freeze({
  getSession: ({ signal }) => sessionRequest('GET', undefined, signal),
  startSession: ({ token, signal }) => sessionRequest('POST', token, signal),
  endSession: ({ signal }) => sessionRequest('DELETE', undefined, signal),
  listAssets: async () => ({ available: false, manifest_version: null, assets: [] }),
  reportReference: disconnected,
  checkUpload: disconnected,
  resetReference: disconnected,
});
