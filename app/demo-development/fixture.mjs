import { DemoError } from '../lib/demo-contract.mjs';

// Existing hero artwork is reused only to inspect layout. These are NOT registered demo assets.
const artwork = ['original', 'blurred', 'filtered', 'rotate90', 'cropped', 'darkened'];
const labels = ['Original', 'Blurred', 'Color filtered', 'Rotated', 'Cropped', 'Darkened'];

export function createFixture(initialControl) {
  if (process.env.NODE_ENV !== 'development') throw new Error('Development fixture is disabled');
  let control = { ...initialControl };
  let session = null;
  let reference = null;
  let revision = 0;
  const assets = Array.from({ length: 24 }, (_, index) => ({
    id: `fixture_asset_${index}`, preview_url: `/hero-matches/${artwork[index % 6]}.png`,
    label: `${labels[index % 6]} ${Math.floor(index / 6) + 1}`,
    alt: 'Development fixture: an existing hero image, with the face covered by a phone.',
    can_reference: index % 6 === 0, can_upload: true,
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
  function execute() {
    active();
    if (control.failure) throw new DemoError(control.failure);
    if (!session.runs_remaining) throw new DemoError('demo_rate_limited');
    session.runs_used += 1; session.runs_remaining -= 1;
  }
  return Object.freeze({
    async getSession({ signal }) { await pause(signal); return session ? active() : null; },
    async startSession({ signal }) {
      await pause(signal);
      session = { status: 'active', expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
        max_runs: 10, runs_used: 0, runs_remaining: 10, execution_available: true };
      reference = null; return { ...session };
    },
    async endSession({ signal }) { await pause(signal); session = null; reference = null; return null; },
    async listAssets({ signal }) { await pause(signal); active(); return { available: true, manifest_version: 'fixture_manifest_v1', assets }; },
    async reportReference({ asset_id, mode, manifest_version, signal }) {
      await pause(signal); execute(); revision += 1;
      reference = { status: 'active', reference_id: `fixture_reference_${revision}`, asset_id, mode, manifest_version, cycle_revision: revision };
      return { reference: { ...reference }, session: active() };
    },
    async checkUpload({ asset_id, reference_id, mode, cycle_revision, signal }) {
      await pause(signal); execute();
      if (!reference || reference.reference_id !== reference_id || reference.mode !== mode) throw new DemoError('demo_invalid_response');
      return { result: { classification: control.classification, upload_asset_id: asset_id,
        reference_id, mode, cycle_revision, request_id: `fixture_request_${session.runs_used}` }, session: active() };
    },
    async resetReference({ signal }) { await pause(signal); active(); reference = null; revision += 1; return { status: 'reset', cycle_revision: revision, session: active() }; },
    expire() { if (session) session.expires_at = new Date(Date.now() - 1).toISOString(); },
    configure(values) { control = { ...control, ...values }; },
  });
}
