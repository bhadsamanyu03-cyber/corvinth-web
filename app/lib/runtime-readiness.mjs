// The browser only repeats requests explicitly rejected BEFORE BFF submission.
// Network failures or ordinary processing responses never enter this loop.
export async function waitForConsoleRequest(send, { signal, onStarting, clock = () => performance.now(),
  sleep = (ms, signal) => new Promise((resolve, reject) => {
    const done = () => { signal?.removeEventListener('abort', abort); resolve(); };
    const timer = setTimeout(done, ms);
    const abort = () => { clearTimeout(timer); reject(signal.reason || new Error('Cancelled')); };
    if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
  }) } = {}) {
  const deadline = clock() + 180000;
  while (true) {
    signal?.throwIfAborted();
    const response = await send(); // No catch: an uncertain mutation is not replayed.
    if (response.status !== 202 || response.headers.get('x-corvinth-admission') !== 'not-submitted') return response;
    const data = await response.clone().json().catch(() => ({}));
    if (data.protocol !== 'corvinth-runtime-v1' || data.state !== 'starting' || data.submitted !== false) return response;
    const remaining = deadline - clock();
    if (remaining <= 0) throw new Error('Corvinth did not become ready within 3 minutes. No operation was submitted.');
    onStarting?.();
    await sleep(Math.min(2000, remaining), signal);
    if (clock() >= deadline) throw new Error('Corvinth did not become ready within 3 minutes. No operation was submitted.');
  }
}
