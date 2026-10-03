# Buyer demo frontend boundary

The homepage uses `DemoExperience` → `useDemo` → `liveDemoClient`. The only connected
transport is the existing GET/POST/DELETE `/api/live-demo/session` gateway. No new
execution route or backend integration is introduced in this frontend pass.

## Flow and invariants

Entry → token → compute choice → reference selection → confirmed reference →
upload selection → confirmed classification. The progress indicator cannot skip
steps. Only a successful report response activates a reference. Its compute mode,
manifest and cycle are fixed until a successful server reset. Changing mode before
reporting clears the selection. Reset keeps the same session and its remaining
budget. Checking another upload keeps the same reference.

There is one pending operation. Request IDs within the UI reject late responses;
expiry aborts the operation and clears the cycle. Failed registration cannot advance
the flow. Failed checks retain the selected upload for recovery. Session status is
refreshed every 30 seconds; failures lock access again. Local expiry also locks the
UI immediately. The backend must enforce all of these independently.

No token, reference, result, or mode is persisted in browser storage. Session
credentials remain in the Phase 1 HttpOnly cookie. Run counters are read from
responses and never replenished locally. Phase 1 transport still requires
`execution_available: false`; that gateway validation must be deliberately updated
when the isolated execution backend is approved and connected.

## Adapter operations to connect later

All functions receive an AbortSignal. Field names below are the frontend contract,
not claims about routes that already exist. The future gateway must project backend
responses into these shapes. The browser never submits derived signals or storage
credentials. A preview URL is a same-origin public display path, not the processing
URL; it must depict the exact immutable asset identified by `id`.

| Operation | Buyer input | Confirmed response |
| --- | --- | --- |
| `getSession`, `startSession`, `endSession` | Token only at start | Existing Phase 1 session projection or inactive/ended |
| `listAssets` | `mode` | `{ available, manifest_version, assets }` |
| `reportReference` | `{ asset_id, mode, manifest_version }` | `{ reference, session }` |
| `checkUpload` | `{ asset_id, reference_id, mode, manifest_version, cycle_revision }` | `{ result, session }` |
| `resetReference` | `{ reference_id, cycle_revision }` | `{ status: "reset", cycle_revision, session }` |

Report/check/reset inputs also carry an `operation_key` generated for the buyer's
intent. A retry of the same failed operation reuses it; confirmed success clears it.
The future backend must make this key idempotent within the session. It cannot
charge twice or register another reference for a replay. No automatic retry occurs.

Asset: `{ id, preview_url, label, alt, can_reference, can_upload }`. The gallery supports
up to 50 approved items; upload selection adds search once there are more than nine.
Reference: `{ status: "active", reference_id, asset_id, mode, manifest_version,
cycle_revision }`. Result: `{ classification, reference_id, upload_asset_id, mode,
cycle_revision, request_id }`. Unknown properties are discarded before rendering.
Mismatched asset, mode, manifest or cycle responses are rejected.

Classifier wire values retain the existing backend vocabulary: EXACT, FUZZY,
NEAR_MISS, CLEAN. The visible label for NEAR_MISS is NEARMISS as requested. No
classification is inferred from artwork or labels. Request details show only the
projected fields; production API responses and enforcement actions are not exposed.

## Development inspection

Run `npm run dev` and visit `/demo-development`. Enter any nonempty token in this
fixture page. Its controls exercise all four classifications, delay, failures and
expiry. Every screen identifies itself as development visualization; result labels
say simulated. Existing hero artwork is reused solely to inspect aspect ratios and
a 24-item library; none is approved or registered as a real demo input.

The server page calls `notFound()` outside NODE_ENV=development, before importing
the preview. Fixture creation also rejects non-development environments. The
homepage imports only the live adapter. There is no query parameter, token, public
environment flag or production fallback that selects fixtures. The production
adapter returns an unavailable empty catalogue and throws for every execution
operation. Verify the production preview URL returns HTTP 404 before release.

## Remaining execution work

- Approve an immutable asset manifest with digest, mode-specific signal/profile/
  algorithm versions and matching display artwork. Provenance belongs on the server;
  manifest/cycle identifiers bind the frontend view to it.
- Connect isolated report/check/reset operations behind the existing token/session
  boundary with authoritative counters, atomic admission, idempotency and reference
  mode/version checks. A timeout may leave the backend outcome uncertain; do not
  blindly retry compute. Honor operation keys and add reconciliation for uncertain
  outcomes before allowing a different image or mode after an ambiguous failure.
- Define session reload recovery for an active cycle: return a validated reference
  snapshot and hydrate its catalogue, or explicitly clear the server cycle. Phase 1
  status currently carries no reference, so frontend reload starts at compute choice.
- Confirm safe demo result semantics and update only the adapter/gateway projection.
  Production cannot advance past the unavailable image library until these exist.
