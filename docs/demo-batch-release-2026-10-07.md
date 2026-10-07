# Live demo batch release — 2026-10-07

Implemented and deployed only the approved demo changes. No DINO threshold,
Customer DINO producer, customer matching policy or unrelated screen was changed.

## Deployed artifacts and scope

- Frontend: `dpl_53JSaAEZSN4CbmcTGNHSEUfnkJRZ`,
  `corvinth-ck2k3gr9p-corvinth.vercel.app`, promoted to Corvinth production.
- API: `default-corvinth-api-staging:66`, rollout completed, running task healthy.
- API image: `sha256:e17a5053b996273d8bb2fad6f0ed124fbfc814e464991d2a7f37be3204f43445`.
- Based on immutable revision 64; only four demo files were replaced in the image:
  `demo_api.py`, `demo_execution.py`, `demo_assets.manifest.json`, `demo_tokens_cli.py`.
- Original and released `/app/main.py` SHA-256 are both
  `50c563b41c831f67ba7806b4cabe0cdde7afa823cdb7f6d756f7de28b030bfb0`.
- Task-definition configuration, including roles, resources, environment and secret
  references, is identical to revision 64 after excluding image/revision metadata.
- Frontend release reused 93 verified production-source files unchanged. Only the
  demo implementation and approved image files were overlaid onto that source.
- Existing CPU worker `corvinth-demo-dino-cpu:3`, private Service Connect client,
  worker auth, stopped GPU/backfill deployment and customer resources were untouched.
- No new compute/ALB/GPU infrastructure or production environment settings were added.
- Enabled, unexpired invitations using the old 10-run default were raised to 15;
  usage/session counters were not reset. Custom allowances remain unchanged.

## Changed files in this slice

Frontend implementation:

- `app/components/DemoImageWorkspace.js`
- `app/components/DemoWorkspace.js`
- `app/components/DemoWorkspace.module.css`
- `app/components/useDemo.js`
- `app/components/DemoResult.js` (new)
- `app/lib/demo-client.mjs`
- `app/lib/demo-contract.mjs`
- `app/lib/demo-gateway.mjs`
- `app/lib/demo-state.mjs`
- `app/lib/demo-catalogue.mjs`
- `app/lib/demo-display-manifest.mjs`
- `app/demo-development/fixture.mjs` (development-only accounting/batch adaptation)

Frontend tests/documentation:

- `tests/demo-batch.test.mjs` (new)
- `tests/demo-catalogue.test.mjs`
- `tests/demo-flow.test.mjs`
- `docs/demo-access.md`
- `docs/demo-assets.md`
- `docs/demo-frontend-contract.md`
- This release report.
- `docs/demo-verification-2026-10-07/`: four secret-free JSON evidence files linked below.

Assets: 35 exact copies under `public/demo-assets/originals/` and
`public/demo-assets/variants/slide1`, `slide2`, `slide3`. The source assets were not
renamed, edited or recompressed. Old public assets remain only for existing URL
compatibility, not in the current catalogue or execution manifest.

Backend implementation/tests/documentation:

- `demo_api.py`
- `demo_execution.py`
- `demo_tokens_cli.py`
- `demo_assets.manifest.json`
- `tests/test_demo_access.py`
- `tests/test_demo_batch.py` (new)
- `DEMO_ACCESS.md`

Other dirty/untracked checkout files predate this slice and are not part of this
release. No commit was made.

## API and state changes

The existing gated gateway now permits `POST /api/live-demo/input`, mapping only to
`/demo/v1/input`. It accepts asset ID, mode and manifest version. Managed replies
contain the actual fresh 60-second presigned URL for that immutable object version;
Customer replies contain the exact qualified precomputed SDK hash sets. A signed,
session/asset/mode-bound receipt ties the displayed input to actual execution.
The URL/receipt remains transient: it is not stored in asset, session, operation,
audit metadata, browser storage or navigation URLs. URL View/Copy is initially
collapsed. Customer hash inspection is initially collapsed too.

Checks accept ordered `asset_ids` of length 1–3 and return ordered independent
`results: [{asset_id, result | error}]`. The whole selection is validated and its
allowance reserved atomically before execution; insufficient allowance never
executes a partial batch. An admitted image costs one run even if compute fails or
the browser disconnects. An idempotent retry does not debit again. Input receipt
refresh does not create a new operation intent. Report/reset/select cost zero runs.
The issuance contract, operator CLI default and new sessions use 15 runs.

Each real result includes `pdq` with Hamming distance, lane, winning reference and
attempted hash pair, and both full standard/normalized eight-hash sets. CLEAN shows
the real closest pair, explicitly labelled **not a match**, rather than inventing
a winning pair. Existing EXACT/FUZZY/NEAR_MISS/CLEAN policy is unchanged.

Managed results also include `dino` with profile, real 384-d reference/candidate
vectors and real cosine similarity. The result UI presents PDQ | DINOv2 side by side
on desktop and stacks on mobile. DINO has no classifier badge, threshold or combined
matched/missed summary. Customer returns and renders PDQ only; SDK 1.1.0 has no
qualified DINO producer in this release.

## Exact asset order

References: Original 01, Original 02, Original 03, Original 04. Only originals are
reportable. Original 01 is top-left. The supplied current originals/slide structure
contains 4 originals + **31** variants (not the earlier 28-file inventory).

- slide1: filtered, mirrored, coffee, posed, brightness, text, grayscale, rot90,
  second_person, pose_variant, channel_rotate, brightened.
- slide2: rot180 2, half_cropped, rot180, desk, dog, darkened, contrast_035,
  red_channel, rot90 2, white_filtered, darkened copy, mirrored_flipped.
- slide3: zoomed_out, noise_070, watermark, white, beach, coffee, zoomed.

Placement is explicit 12/12/7; no regrouping or alphabetical sorting. Search stays
within the active slide. Up to three selections persist across slides. Desktop
shows 12 complete cards at once; narrow mobile uses two columns. Every image uses
the original bytes with `object-fit: contain`, not a generated thumbnail derivative.

## Qualification and execution evidence

- All 35 assets: installed SDK 1.1.0 versus canonical 512-capped server signals,
  all 560 ordered hashes equal; immutable S3 readback digests equal supplied bytes.
- Canonical compute digest:
  `484a4e023b03a424cca978e25d94429525b6a8c35d44985bccc24bf018d0dbb4`.
- SDK wheel digest:
  `82a80a4f10b127e65098026a9ffa7989991ea8b7d56147d1bbf46923d800f2f5`.
- All 124 original/variant pairs exercised through the real isolated PDQ matcher
  in both modes: 248 calls, identical classifications, archive access forbidden.
  Results: 10 EXACT, 6 FUZZY, 1 NEAR_MISS, 107 CLEAN; no outcomes were remapped.
- Managed: existing server compute plus `extract_dino_vector(..., demo_only=True)`
  through authenticated private Service Connect `/embed`. Existing CPU
  `facebook/dinov2-small`, 384-d CLS and profile are reused unchanged.
- Customer: exact SDK 1.1.0 precomputed signals, no image fetch or DINO call.

## Live verification

Verified against final Corvinth production frontend and API revision 66:

Captured evidence: [live API](demo-verification-2026-10-07/live-api.json),
[live browser](demo-verification-2026-10-07/live-browser.json),
[qualified pair matrix](demo-verification-2026-10-07/qualified-pairs.json),
[frontend release provenance](demo-verification-2026-10-07/frontend-provenance.json).

- All 35 public image response bytes match approved SHA-256 digests.
- Both modes: new allowance 15; report 0; checks of 1, 2, 3 yield cumulative
  usage 1, 3, 6; reset 6; new reference report 6; another check 7 (8 remaining).
- Every replay returned the confirmed receipt with no additional usage.
- Production development-fixture route returned 404; unauthenticated input request
  returned 401 without compute access.
- A three-image batch against a custom two-run session was rejected before any
  operation or debit; two images consumed two runs; report/reset still worked at 0.
- Managed vectors contain 384 finite values; recomputed cosine equals returned
  cosine. Customer responses contain no DINO payload.
- Live browser Managed batch: EXACT, FUZZY, CLEAN; Customer batch: EXACT, EXACT,
  FUZZY. Main-card hash pairs, Hamming distances and expanded vectors were real.
- Browser: actual URL View/Copy, precomputed hash View, max-three/fourth-selection
  guard, exact slide IDs/order, retained selection, slide-local search,
  reload/resume and confirmed exit all passed.
- Chromium 154 at 1440, 390 and 320px: no page overflow, broken visible images or
  uncaught runtime exceptions. Screenshots were inspected after image loading.
  Safari/Firefox were not separately rerun in this slice.
- Final measured API batch responses (not isolated inference-only benchmarks):
  Managed 1/2/3 images: 0.928/1.214/1.616s; Customer: 0.324/0.290/0.285s.

Tests: 59 frontend tests, 28 backend demo tests passed. Local and Vercel production
builds passed. Lint: zero errors, eight existing homepage/font warnings. Diff
whitespace checks passed. Runtime failures/invalid receipts are covered by demo
tests; the live worker was not deliberately stopped in this slice.

Temporary verification tokens were revoked after tests. No DINO threshold
calibration, DINO SDK work, customer state, Qdrant write or backfill was introduced.
The absent DINO classification/Customer DINO are intentional qualification limits,
not blockers for the approved release.
