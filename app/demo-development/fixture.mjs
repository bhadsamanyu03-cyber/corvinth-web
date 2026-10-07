import { DemoError } from '../lib/demo-contract.mjs';

export function createFixture(initialControl) {
  if (process.env.NODE_ENV !== 'development') throw new Error('Development fixture is disabled');
  let control = { ...initialControl };
  let session = null;
  let reference = null;
  let revision = 0;
  // Inert catalogue entries for interaction tests, not approved production assets.
  // The guarded preview renders neutral slots and never requests these sentinel URLs.
  const assets = Array.from({ length: 24 }, (_, index) => ({
    id: `fixture_asset_${index}`, preview_url: '/demo-development/neutral-slot',
    label: `Demo asset ${String(index + 1).padStart(2, '0')}`,
    alt: 'Neutral development asset slot.',
    can_reference: true, can_upload: true,
  }));
  function active() {
    if (!session || Date.parse(session.expires_at) <= Date.now()) throw new DemoError('demo_session_invalid');
    return { ...session };
  }
  async function pause(signal) {
    await new Promise((resolve, reject) => {
      const finish = () => { signal?.removeEventListener('abort', abort); resolve(); };
      const timer = setTimeout(finish, control.delay);
      const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
      if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
    });
  }
  function execute(count = 1) {
    active();
    if (control.failure) throw new DemoError(control.failure);
    if (session.runs_remaining < count) throw new DemoError('demo_run_limit');
    session.runs_used += count; session.runs_remaining -= count;
  }
  return Object.freeze({
    tokenRequests: Object.freeze({ available: true, async submit({ signal }) {
      await pause(signal);
      if (control.requestFailure) throw new DemoError(control.requestFailure);
      return { status: 'accepted', request_id: 'fixture_request_receipt' };
    } }),
    async getSession({ signal }) { await pause(signal); return session ? active() : null; },
    async startSession({ signal }) {
      await pause(signal);
      session = { status: 'active', expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
        max_runs: 15, runs_used: 0, runs_remaining: 15, execution_available: true };
      reference = null; return { ...session };
    },
    async endSession({ signal }) { await pause(signal); session = null; reference = null; return null; },
    async listAssets({ signal }) { await pause(signal); active(); return { available: true, manifest_version: 'fixture_manifest_v1', assets }; },
    async reportReference({ asset_id, mode, manifest_version, signal }) {
      await pause(signal); execute(0); revision += 1;
      reference = { status: 'active', reference_id: `fixture_reference_${revision}`, asset_id, mode, manifest_version, cycle_revision: revision };
      return { reference: { ...reference }, session: active() };
    },
    async checkUpload({ asset_id, asset_ids, reference_id, mode, cycle_revision, signal }) {
      await pause(signal);
      if (!reference || reference.reference_id !== reference_id || reference.mode !== mode) throw new DemoError('demo_invalid_response');
      const ids = asset_ids || [asset_id]; execute(ids.length);
      const result = (id) => ({ classification: control.classification, upload_asset_id: id,
        reference_id, mode, cycle_revision, request_id: `fixture_request_${session.runs_used}` });
      return { ...(asset_ids ? { results: ids.map(id => ({ asset_id:id, result:result(id) })) } : { result:result(asset_id) }), session:active() };
    },
    async resetReference({ signal }) { await pause(signal); active(); reference = null; revision += 1; return { status: 'reset', cycle_revision: revision, session: active() }; },
    expire() { if (session) session.expires_at = new Date(Date.now() - 1).toISOString(); },
    configure(values) { control = { ...control, ...values }; },
  });
}
