// Explicit browser-facing demo projection; never exposes storage credentials.
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
    execution_available: data.execution_available,
    ...(data.reference !== undefined ? { reference: data.reference === null ? null : { status: 'active', ...readReference(data.reference, data.reference) } } : {}) };
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
      && typeof asset.can_upload === 'boolean' && (asset.slide === undefined || ['slide1', 'slide2', 'slide3'].includes(asset.slide)));
    return { id: asset.id, preview_url: asset.preview_url, label: asset.label, alt: asset.alt,
      can_reference: asset.can_reference, can_upload: asset.can_upload,
      ...(asset.slide ? { slide: asset.slide } : {}) };
  });
  return { available: true, manifest_version: data.manifest_version, assets };
}

export function readReference(data, expected) {
  valid(data?.status === 'active' && opaque(data.reference_id) && opaque(data.asset_id) && opaque(data.manifest_version) && data.asset_id === expected.asset_id
    && modes.has(data.mode) && data.mode === expected.mode && data.manifest_version === expected.manifest_version
    && Number.isInteger(data.cycle_revision) && data.cycle_revision > 0);
  return { status: 'active', reference_id: data.reference_id, asset_id: data.asset_id, mode: data.mode,
    manifest_version: data.manifest_version, cycle_revision: data.cycle_revision };
}

export function readResult(data, expected) {
  // Existing Corvinth contracts use NEAR_MISS. NEARMISS is its display label only.
  valid(classifications.has(data?.classification) && data.reference_id === expected.reference_id
    && data.upload_asset_id === expected.asset_id && data.mode === expected.mode
    && data.cycle_revision === expected.cycle_revision && opaque(data.request_id));
  let dino;
  if (data.dino !== undefined) {
    const profile = data.dino?.profile;
    const vector = (values) => Array.isArray(values) && values.length === 384
      && values.every((value) => typeof value === 'number' && Number.isFinite(value));
    valid(data.mode === 'managed' && profile
      && typeof profile.algorithm_version === 'string' && profile.algorithm_version.length > 0
      && typeof profile.model_version === 'string' && profile.model_version.length > 0
      && typeof profile.configuration_version === 'string' && profile.configuration_version.length > 0
      && Number.isFinite(data.dino.cosine_similarity)
      && data.dino.cosine_similarity >= -1.000001 && data.dino.cosine_similarity <= 1.000001
      && vector(data.dino.reference_vector) && vector(data.dino.candidate_vector));
    dino = { profile: { algorithm_version: profile.algorithm_version, model_version: profile.model_version,
      configuration_version: profile.configuration_version }, cosine_similarity: data.dino.cosine_similarity,
    reference_vector: data.dino.reference_vector, candidate_vector: data.dino.candidate_vector };
  }
  let pdq;
  if (data.pdq !== undefined) {
    const p = data.pdq;
    valid(Number.isInteger(p?.hamming_distance) && p.hamming_distance >= 0 && p.hamming_distance <= 256
      && ['standard', 'normalized'].includes(p.lane)
      && p.pair_kind === (data.classification === 'CLEAN' ? 'closest' : 'winning')
      && hash(p.reference_hash) && hash(p.attempted_hash));
    const reference = readHashes(p.reference_hashes), attempted = readHashes(p.attempted_hashes);
    valid(reference[p.lane].includes(p.reference_hash) && attempted[p.lane].includes(p.attempted_hash)
      && hamming(p.reference_hash, p.attempted_hash) === p.hamming_distance);
    pdq = { hamming_distance: p.hamming_distance, lane: p.lane, pair_kind: p.pair_kind,
      reference_hash: p.reference_hash, attempted_hash: p.attempted_hash,
      reference_hashes: reference, attempted_hashes: attempted };
  }
  return { classification: data.classification, reference_id: data.reference_id,
    upload_asset_id: data.upload_asset_id, mode: data.mode, cycle_revision: data.cycle_revision,
    request_id: data.request_id, ...(pdq ? { pdq } : {}), ...(dino ? { dino } : {}) };
}

const hash = (value) => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
function readHashes(data) {
  valid(data && ['standard', 'normalized'].every((lane) => Array.isArray(data[lane])
    && data[lane].length === 8 && data[lane].every(hash)));
  return { standard: [...data.standard], normalized: [...data.normalized] };
}
function hamming(left, right) {
  let bits = BigInt('0x' + left) ^ BigInt('0x' + right), count = 0;
  while (bits) { bits &= bits - 1n; count++; }
  return count;
}

export function readInput(data, expected) {
  valid(data && data.asset_id === expected.asset_id && data.mode === expected.mode
    && data.manifest_version === expected.manifest_version && Number.isInteger(data.expires_at)
    && typeof data.input_token === 'string' && /^[A-Za-z0-9_-]+\.[0-9a-f]{64}$/.test(data.input_token)
    && data.input_token.length <= 4096);
  const result = { asset_id: data.asset_id, mode: data.mode, manifest_version: data.manifest_version,
    expires_at: data.expires_at, input_token: data.input_token };
  if (data.mode === 'managed') {
    const url = new URL(data.presigned_url);
    valid(url.protocol === 'https:' && !url.username && !url.password && !url.hash
      && /(^|\.)s3[.-].*amazonaws\.com$/.test(url.hostname));
    result.presigned_url = data.presigned_url;
  } else { valid(data.mode === 'customer'); result.hashes = readHashes(data.hashes); }
  return result;
}

export function readBatch(data, expected) {
  valid(Array.isArray(data.results) && data.results.length === expected.asset_ids.length);
  return data.results.map((entry, index) => {
    valid(entry.asset_id === expected.asset_ids[index]);
    if (entry.error !== undefined) {
      valid(entry.error === 'demo_unavailable' && entry.result === undefined);
      return { asset_id: entry.asset_id, error: entry.error };
    }
    return { asset_id: entry.asset_id, result: readResult(entry.result, { ...expected, asset_id: entry.asset_id }) };
  });
}
