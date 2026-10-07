# Isolated live demo release — 2026-10-05

## Deployed

- Frontend: `https://www.corvinth.com`, Vercel deployment
  `dpl_2XRmTpSnV5hbdf7QKVR398qpkKT8` (READY), underlying URL
  `https://corvinth-b3foqn0ow-corvinth.vercel.app`.
- API: ECS `default/corvinth-api-staging`, revision 57; immutable image
  `sha256:c9e74c33f94dd1d94570b730a2e44ac80a95b30556449417a6f99d0a3bf8097c`.
- Existing versioned S3 bucket `corvinth-live-qualification-samanyu`, new dedicated
  `corvinth-demo/512-v1/` prefix. Exactly 32 original-byte assets; readback verified
  size and SHA-256 for every object version. No new bucket/service was created.
- Existing task role: added `CorvinthDemoVersionRead`, only `s3:GetObjectVersion`
  on that prefix. Added `CORVINTH_DEMO_MANIFEST_PATH` to the API task environment.
  Existing demo gateway configuration was preserved; no new frontend secret.

The release was built from the already-deployed source, not the dirty checkout.
Other local `main.py`/console work was not included. DINO configuration, routing,
worker, authority and customer endpoints were not changed. No commits were made.

## Actual runtime correction

Fresh inspection confirmed revision 56 was running image
`sha256:534e0dcb251ae176e0e3e2028bf3a64ffccaf2483de91db235ac92948626e5a8`,
with the canonical 512-capped path and SDK 1.1.0 metadata. Its real verifier still
failed: CPython was 3.12.15, but the existing qualified profile requires 3.12.14.
This was not the prior full-resolution/SDK-1.0.0 mismatch.

Revision 57 preserves revision 56 application and site-packages and restores only
the exact qualified Python runtime. No classifier policy or verifier was widened.
The exact deployed image passes `mode_b_pdq.verify_runtime()` and
`shield_pdq_profile.verified_runtime_descriptor()`:

- CPython 3.12.14; Linux x86_64; glibc 2.41.
- Native PDQ: `0.2.8+corvinth.fusedluma.1`.
- Canonical compute SHA:
  `484a4e023b03a424cca978e25d94429525b6a8c35d44985bccc24bf018d0dbb4`.
- Preserved `main.py` SHA:
  `b1dd3bc52024054a5a1f6ce2b07b2f1a5b809745be0118c045ddcd75510086fa`.
- SDK wheel 1.1.0 SHA:
  `82a80a4f10b127e65098026a9ffa7989991ea8b7d56147d1bbf46923d800f2f5`.

The running ECS image digest matches that verified artifact. Startup invokes the
same verifier before execution becomes available; CloudWatch confirms startup,
and real live execution confirms that gate opened. A separate interactive ECS
Exec verification connection did not return output; it is not counted as a pass.

## Behavior and verification

Buyer flow: token → choose compute → select one of four originals → report →
select one of 28 variants → check → actual classification → reset/repeat.

Managed input is a fresh 60-second URL for an exact immutable S3 version. Fetched
size/digest must match before canonical server compute; derived signals must also
equal the qualified manifest. Customer input is the actual SDK wheel's precomputed
signals for those exact bytes. DINO is not enabled for this demo path.

The existing real classifier receives a tree containing only the session's
reference. No customer archive/case/webhook route is called. The backend uses
only `demo_tokens`, `demo_sessions`, `demo_operations`, `demo_rate_limits` for demo
state. Tokens/credentials, processing URLs and signals stay out of browser inputs
and responses. Mode/profile/cycle are frozen until confirmed reset.

- Exact SDK/server signal parity: all 32 assets, both ordered dihedral lanes.
- Offline real classifier: all 112 original/variant pairs in both modes, 224 calls;
  customer database access explicitly forbidden. Same classifications in both modes.
- Live production gateway: all 28 variants checked in each mode (56 checks), all
  four originals reported in each mode. Every classification matched real classifier
  evidence. Replays did not double-charge; reset/switch preserved session budget.
- All 32 public image responses: HTTP 200, exact approved byte length/SHA.
- Real browser: token entry, Managed/Customer report/check, reload active-reference
  recovery, pagination, reset, budget and exit. Secure HttpOnly SameSite=Strict cookie;
  no raw processing credentials or signals in execution requests; zero exceptions.
- Visual inspection: 1440px desktop and 390/320px mobile, no horizontal overflow.
  Desktop shows 12 readable variants per page; narrow mobile uses two columns.
- Frontend Node tests: 52 passed. Backend access/execution tests: 14 passed using a
  disposable local Mongo replica set. Local DINO contract regression tests: 14 passed
  (not a new DINO live qualification run). Build passed; lint: zero errors, eight existing
  warnings. Both repositories' diff checks passed.
- Browser verification found and corrected a gateway projection bug: `readReference`
  must retain `status: active` for the browser's second validation. Regression added.
- `/demo-development` returns HTTP 404 on production. Without a demo cookie,
  session status returns inactive and report/check access is denied.

JSON records and selected screenshots: `demo-verification-2026-10-05/` beside this
report. Test tokens are founder-issued bounded operator tokens, not the user's
provided token; the browser sessions were ended and the test tokens revoked.

## Scoped implementation files

Frontend runtime:

- `app/api/live-demo/[operation]/route.js` — explicit demo-only execution gateway.
- `app/api/live-demo/session/route.js` — preserved dedicated backend origin handling.
- `app/lib/demo-gateway.mjs` — safe execution/session projections and validation.
- `app/lib/demo-client.mjs` — real report/check/reset transport, no fixture fallback.
- `app/lib/demo-contract.mjs` — safe resumable active reference; idempotent projection.
- `app/lib/demo-state.mjs`, `app/components/useDemo.js` — reload reference recovery.
- `app/components/DemoWorkspace.js` — reference hydration and fixed operation errors.
- `app/components/DemoImageWorkspace.js`, `DemoWorkspace.module.css` — 12-item dense
  variant pages, responsive grid; unchanged approved images and reference-only picker.

Frontend tests: `tests/demo-execution-gateway.test.mjs`, `demo-gateway.test.mjs`,
`demo-flow.test.mjs`. Documentation: this report, `demo-access.md`, `demo-assets.md`,
`demo-frontend-contract.md`, `demo-integration-pending.md` and its evidence directory.
The already-supplied `public/demo-assets/` files were deployed unchanged.

Backend: `demo_api.py`, new `demo_execution.py`, `demo_assets.manifest.json`,
`deploy/Dockerfile.demo`, `tests/test_demo_execution.py`, `tests/verify_demo_artifact.py`,
small expected-status update in `tests/test_demo_access.py`, `DEMO_ACCESS.md`.
`main.py`, production matching routes and legacy `/demo/check` were not edited.

## Operational boundaries

Report and check each reserve a run. Reset refunds none. There is one accepted
demo job globally and one per session; expiry/revocation are checked again before
commit. Receipts are idempotent; uncertain responses are not automatically retried.
If an owner process crashes, global admission stays closed until the operator
confirms it stopped and recovers only that demo operation/session/owner. This is
intentional bounded-compute behavior, not a time-based lease that could over-admit.

Inline token-request delivery is still separately unavailable; manual founder
issuance/redemption works. This release proves the controlled PDQ demo, not DINO
qualification, production customer corpus migration or arbitrary-image matching.
