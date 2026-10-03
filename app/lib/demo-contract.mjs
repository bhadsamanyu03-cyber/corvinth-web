// Browser-facing contract. Server-owned signals and storage identities never enter it.
export class DemoError extends Error {
  constructor(code = 'demo_unavailable') { super(code); this.code = code; }
}

const classifications = new Set(['EXACT', 'FUZZY', 'NEAR_MISS', 'CLEAN']);
const modes = new Set(['managed', 'customer']);
const opaque = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,120}$/.test(value);
const valid = (condition) => { if (!condition) throw new DemoError('demo_invalid_response'); };

export function readSession(data) {
  if (data?.status === 'inactive' || data?.status === 'ended') return null;
  valid(data?.status === 'active' && Number.isFinite(Date.parse(data.expires_at))
    && typeof data.execution_available === 'boolean' && Number.isInteger(data.max_runs)
    && data.max_runs > 0 && data.max_runs <= 50 && Number.isInteger(data.runs_used)
    && data.runs_used >= 0 && data.runs_used <= data.max_runs
    && data.runs_remaining === data.max_runs - data.runs_used);
  return { status: 'active', expires_at: data.expires_at, max_runs: data.max_runs,
    runs_used: data.runs_used, runs_remaining: data.runs_remaining,
    execution_available: data.execution_available };
}

export function readCatalogue(data) {
  valid(typeof data?.available === 'boolean' && Array.isArray(data.assets));
  if (!data.available) { valid(data.assets.length === 0); return { available: false, assets: [], manifest_version: null }; }
  valid(opaque(data.manifest_version) && data.assets.length > 0 && data.assets.length <= 50);
  const ids = new Set();
  const assets = data.assets.map((asset) => {
    valid(opaque(asset.id) && !ids.has(asset.id)); ids.add(asset.id);
    // Public display images must be same-origin paths, never signed processing URLs.
    valid(typeof asset.preview_url === 'string' && /^\/(?!\/)/.test(asset.preview_url)
      && !/[?#\\]/.test(asset.preview_url) && typeof asset.label === 'string'
      && asset.label.length > 0 && asset.label.length <= 80 && typeof asset.alt === 'string'
      && asset.alt.length <= 200 && typeof asset.can_reference === 'boolean'
      && typeof asset.can_upload === 'boolean');
    return { id: asset.id, preview_url: asset.preview_url, label: asset.label, alt: asset.alt,
      can_reference: asset.can_reference, can_upload: asset.can_upload };
  });
  return { available: true, manifest_version: data.manifest_version, assets };
}

export function readReference(data, expected) {
  valid(data?.status === 'active' && opaque(data.reference_id) && data.asset_id === expected.asset_id
    && modes.has(data.mode) && data.mode === expected.mode && data.manifest_version === expected.manifest_version
    && Number.isInteger(data.cycle_revision) && data.cycle_revision > 0);
  return { reference_id: data.reference_id, asset_id: data.asset_id, mode: data.mode,
    manifest_version: data.manifest_version, cycle_revision: data.cycle_revision };
}

export function readResult(data, expected) {
  // Existing Corvinth contracts use NEAR_MISS. NEARMISS is its display label only.
  valid(classifications.has(data?.classification) && data.reference_id === expected.reference_id
    && data.upload_asset_id === expected.asset_id && data.mode === expected.mode
    && data.cycle_revision === expected.cycle_revision && opaque(data.request_id));
  return { classification: data.classification, reference_id: data.reference_id,
    upload_asset_id: data.upload_asset_id, mode: data.mode, cycle_revision: data.cycle_revision,
    request_id: data.request_id };
}
