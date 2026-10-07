# Buyer demo frontend boundary

The homepage uses `DemoPreview` → `DemoAccess`: invitation and access only. It does
not import the gallery, workflow reducer, workspace, or development fixtures.
Confirmed access navigates to `/demo` without an intermediate confirmation screen.
That route uses `DemoWorkspace` → `useDemo` → `liveDemoClient`. Access uses
GET/POST/DELETE `/api/live-demo/session`; isolated execution uses POST
`/api/live-demo/report`, `/check`, `/reset` and `/input`. Each maps only to the corresponding
`/demo/v1/` backend operation with dedicated demo credentials.

## Access and navigation

Opening homepage access checks for an existing session first. A valid response
navigates straight to `/demo`; otherwise the buyer can enter a token or request one.
`/demo` starts with a checking screen (including on reload), then resumes a valid
session's allowance. Missing/expired access shows the same Corvinth token-entry
component on `/demo`, not the workspace. Status failure stays locked with retry.
Exit demo ends the backend session and clears its cookie through the existing
gateway, then returns to `/#demo`; failure does not pretend to end access.

This client gate is a presentation boundary, not server authorization. Every
execution operation validates the backend session. No credentials,
tokens, selections or results are stored in URLs or browser storage.

## Inline token requests (delivery pending)

`DemoAccess` accepts a separate `requests` adapter with `available` and
`submit({ work_email, company_url, signal })`. Only those two buyer fields are
accepted. `readTokenRequest` validates and projects them. A confirmed receipt must
be `{ status: "accepted", request_id: <opaque ID> }`; only then is the founder-led
“Request sent. I’ll send your demo token to your work email.” displayed.

Production `liveTokenRequests` is explicitly unavailable. The form states this
before submission and returns “Nothing was submitted” on submit; it makes no network
request and retains the input. No invented endpoint, email, logging, or fake receipt.
The existing `/api/waitlist` requires additional API-access fields and is not reused.
A later approved delivery path must persist/acknowledge the request and handle spam,
rate limiting, duplicate submissions and uncertain outcomes before setting
`available: true`. An accepted receipt means the founder received the request, not
that a token has already been issued or emailed. This is separate from redemption.

## Flow and invariants

Homepage invitation → token → `/demo` → compute choice → reference selection → confirmed reference →
upload selection → confirmed classification. The progress indicator cannot skip
steps. Only a successful report response activates a reference. Its compute mode,
manifest and cycle are fixed until a successful server reset. Changing mode before
reporting clears the selection. Reset keeps the same session and its remaining
budget. Checking another upload keeps the same reference. Reload resumes the safe
active-reference snapshot and hydrates its approved display asset.

There is one pending operation. Request IDs within the UI reject late responses;
expiry aborts the operation and clears the cycle. Failed registration cannot advance
the flow. Failed checks retain the selected upload for recovery. Session status is
refreshed every 30 seconds; failures lock access again. Local expiry also locks the
UI immediately. The backend independently enforces session/token expiry, revocation,
mode/cycle compatibility, atomic run reservation and shared compute admission.

No token, reference, result, or mode is persisted in browser storage. Session
credentials remain in the Phase 1 HttpOnly cookie. Run counters are read from
responses and never replenished locally. `execution_available` is an actual backend
readiness boolean; absent or unqualified execution remains fail-closed.

## Connected adapter operations

All functions receive an AbortSignal. Field names below are the frontend contract,
implemented by the explicit gateway routes above. The gateway projects backend
responses into these shapes. The browser never submits image bytes, buyer-provided
signals or a production API key. It submits controlled asset IDs and server-minted
short-lived input receipts; Managed receipts bind the inspectable, asset-scoped
presigned read capability. A preview URL is a same-origin public display path, not the processing
URL; it must depict the exact immutable asset identified by `id`.

| Operation | Buyer input | Confirmed response |
| --- | --- | --- |
| `getSession`, `startSession`, `endSession` | Token only at start | Existing Phase 1 session projection or inactive/ended |
| `listAssets` | `mode` | `{ available, manifest_version, assets }` |
| `reportReference` | `{ asset_id, mode, manifest_version }` | `{ reference, session }` |
| `getInput` | `{ asset_id, mode, manifest_version }` | `{ input }`: short-lived receipt plus URL or PDQ hash sets |
| `checkUpload` | `{ asset_ids: [1–3 IDs], reference_id, mode, manifest_version, cycle_revision }` | `{ results: [{ asset_id, result or error }], session }` |
| `resetReference` | `{ reference_id, cycle_revision }` | `{ status: "reset", cycle_revision, session }` |

Report/check/reset inputs also carry an `operation_key` generated for the buyer's
intent. A retry of the same failed operation reuses it; confirmed success clears it.
The backend makes this key idempotent within the session. It cannot
charge twice or register another reference for a replay. No automatic retry occurs.

Report/check also carry selected `input_tokens`. Their authenticated receipts bind
the actual displayed machine inputs; they are not persisted or part of the stable
idempotency intent. Legacy single-image checks remain compatible.

Asset: `{ id, preview_url, label, alt, can_reference, can_upload, slide? }`. The gallery supports
up to 50 approved items, six per reference page and 12 per upload page; search
appears when the eligible inventory exceeds that stage's page size.
Reference: `{ status: "active", reference_id, asset_id, mode, manifest_version,
cycle_revision }`. Result: `{ classification, reference_id, upload_asset_id, mode,
cycle_revision, request_id, pdq, dino? }`. PDQ includes actual distance, lane,
winning/closest hash pair and both full dihedral sets. Managed DINO includes real
384-d vectors, profile and cosine similarity only. Unknown properties are discarded before rendering.
The demo result UI interprets the unrounded DINO cosine score as MATCH (>= 0.85),
NEAR MISS (>= 0.70 and < 0.85), or CLEAN (< 0.70), explicitly labelled
"Demo interpretation" and not a production classification. These UI-only bands
are never added to response fields, persisted, or used by backend matching.
A per-image summary combines the actual PDQ classification with that similarity
band; Customer Compute remains PDQ-only. Exact cosine, model/profile and both
384-d vectors remain available alongside the unchanged PDQ evidence.
Mismatched asset, mode, manifest or cycle responses are rejected.

## Product workspace and approved image insertion

The charcoal workspace has its own compact header; it does not import the homepage
navigation. Compute choice comes before the library. Before registration, the buyer
can change modes; after registration the active-reference strip replaces mode choices.
The header displays the server's 15-run allowance. Selection/report/reset is free;
only checked images consume runs. The complete multi-selection must fit the budget.

`DemoImageWorkspace` is shared by reference and upload selection, and both compute
modes. Desktop puts the selected preview/action left and paginated library right;
mobile puts the library before the preview. Display images use `object-fit: contain`
to retain the approved composition. Managed input is explained as selected image →
presigned URL → Corvinth; customer input as selected image → Corvinth SDK → image
hashes → Corvinth. Actual inputs are collapsed by default, with View/Copy for the
fresh URL or expandable real precomputed hashes. No input is stored in browser storage.

Production now loads the approved display catalogue from `demo-catalogue.mjs`.
`demo-display-manifest.mjs` records each file's SHA-256 digest, byte length, approved
display-relative path and role. Processing provenance lives in the separately
qualified backend manifest, bound to the exact same IDs and digests. See
[Approved demo assets](demo-assets.md).

- `public/demo-assets/originals/`: exactly four selectable originals, reference-only.
  The reference picker shows all four in a compact 2×2 grid.
- `public/demo-assets/variants/slide1`, `slide2`, `slide3`: 31 upload-only
  files, in explicit 12/12/7 placement and order. They appear only in the upload stage, after a
  successful report response establishes the reference. No original is selectable
  as an upload and no variant is selectable as a reference.
- The supplied PNG/JPG files are unchanged copies, with their filenames and nested
  slide structure retained. URLs encode spaces; direct `<img>` rendering does
  not request Next.js image optimization. No transformation is applied by CSS.

These exact display identities are bound to immutable backend storage and
qualified Mode A/Mode B inputs. Do not add
processing URLs, hashes or vectors to browser display entries, infer image-family
relationships, or manufacture presigned URLs from these public display paths.
Availability of display files alone does **not** authorize execution: backend
session, token, budget, cycle and runtime guards apply to every operation.

Classifier wire values retain the existing backend vocabulary: EXACT, FUZZY,
NEAR_MISS, CLEAN. The existing visible label for NEAR_MISS remains NEARMISS. No
classification is inferred from artwork or labels. Request details show only the
projected fields; production API responses and enforcement actions are not exposed.

## Development inspection

Run `npm run dev` and visit `/demo-development`. It renders the same dedicated
workspace shell. Enter any nonempty token in this fixture page. Its controls exercise
all four classifications, delay, failures, expiry and token-request receipts/errors.
The development control bar identifies neutral slots and simulated replies; result
labels say simulated. Its 24 synthetic entries exercise selection/search/pagination
without photos. Their preview paths are inert sentinels; the development-only neutral
renderer never requests them. No website artwork is reused as a demo asset.

The server page calls `notFound()` outside NODE_ENV=development, before importing
the preview. Fixture creation also rejects non-development environments. The
homepage and `/demo` import only live adapters. There is no query parameter, token, public
environment flag or production fallback that selects fixtures. The production
adapter returns the approved display catalogue and calls only the gated isolated
execution routes. Verify the production preview URL returns HTTP 404 before release.

Verification commands:

- `node --test tests/*.test.mjs`
- `npm run lint` and `npm run build`
- `node tests/demo-workspace.browser.mjs` with local dev on 3091, a built production
  server on 3092 and disposable Chrome debugging on 9333. Optional
  `DEMO_SCREENSHOTS=<existing temp directory>` captures desktop/390px/320px states.
  This test intercepts session replies locally; it is not live backend integration
  evidence. It checks route gating, redirect/resume/exit, token rejection, truthful
  request failure, fixture receipts, pagination/search, neutral slots, mode locks,
  budget preservation and all results.

## Verification boundary

Execution is connected, not simulated. See [Current batch release evidence](demo-batch-release-2026-10-07.md).
An uncertain response is not automatically retried: the same operation key retrieves
the confirmed receipt without another charge, or returns pending/failed. Reload
reconciles the active reference. A process crash leaves shared admission closed;
operators must confirm the owner task has stopped before recovering only demo state.
Inline token-request delivery remains a separate, explicitly unavailable adapter.
