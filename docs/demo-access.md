# Demo access and isolated execution

The browser calls `/api/live-demo/session`; Next.js calls only `/demo/v1/session`.
POST exchanges a founder-issued token, GET resumes/status-checks the session,
and DELETE ends it. Every backend method requires the dedicated gateway secret.
Neither service uses the customer API key or the legacy demo endpoint. Execution
adds only `/api/live-demo/report`, `/check`, `/reset` → `/demo/v1/` counterparts.

For the production configuration, deployment order and live smoke test,
see [Post-DINO enablement](demo-post-dino-enablement.md).

## Configuration (server environment only)

- Both services: `CORVINTH_DEMO_ENABLED=true` and the same independently generated
  `CORVINTH_DEMO_GATEWAY_SECRET` (at least 32 characters).
- Next.js: `CORVINTH_DEMO_BACKEND_URL` must be the HTTPS demo backend origin, without a path,
  credentials, query or fragment. `CORVINTH_DEMO_ALLOWED_ORIGINS` optionally lists
  exact browser origins, comma-separated; defaults are `https://corvinth.com` and
  `https://www.corvinth.com`. Set these in the hosting environment, not client code.
  If the dedicated URL is unset, existing deployments fall back to `CORVINTH_API_URL`.
  The access-request form continues using `CORVINTH_API_URL`; do not retarget it
  merely to enable the demo.
- Local development only: `CORVINTH_DEMO_ALLOW_LOCAL=true` permits an HTTP loopback
  backend when NODE_ENV is not production. Explicitly allow the local page origin.
  The cookie still uses Secure, HttpOnly, SameSite=Strict and the __Host- prefix;
  browser testing must use a trustworthy loopback context or local HTTPS.
- Backend: existing `MONGO_URI`; Mongo must support transactions. Enabled access
  initializes indexes after the existing C8 startup gate. Historical Shield
  process roles do not mount demo access. Missing configuration fails closed.
- Backend execution: `CORVINTH_DEMO_MANIFEST_PATH=/app/demo_assets.manifest.json`.
  Startup verifies the exact qualified runtime/profile and approved immutable asset
  mapping before enabling execution. The existing task role can read only demo
  object versions under the dedicated `corvinth-demo/512-v1/` S3 prefix.

The backend stores only token/session hashes in `demo_tokens` and `demo_sessions`.
Session expiry is checked on every request, as is token revocation/expiry. There
is no customer-auth cache. Token issuance count and session creation commit in
one transaction. Refresh resumes a cookie; it does not issue another session.

Founder operations are documented in the backend's `DEMO_ACCESS.md`. There is no
public issuance route. An inbound buyer emails founder@corvinth.com manually.

## Limits and failures

Defaults: token valid 7 days, 3 total sessions, each at most 30 minutes and carrying
a 15-run allowance. Founder CLI can set bounded alternatives. Sessions cannot
outlive their token. Ending a session does not refund issuance or allowance.
Reporting/resetting costs no runs. Only checked images reserve runs: a batch of
1–3 images reserves exactly 1–3 runs atomically, or is rejected in full.
`execution_available` is true only after qualified isolated execution initializes.

Redemption limits are shared Mongo fixed-window counters: 30 attempts/minute,
300/hour across the gateway, 5/minute per well-formed token, and 100 issued
sessions/day. Failed validation still consumes attempt allowance. Limits do not
trust client IP or forwarding headers. They may deliberately deny all new access
when the shared ceiling is reached. Execution additionally reserves one global
demo job and one per-session operation transactionally. Idempotent receipts do
not charge twice. The global slot does not expire while accepted work is running.

On database/network uncertainty, access is denied. A committed session whose
response is lost may consume a session slot; the application does not blindly
retry redemption. Operator reissuance is the recovery if a prospect exhausts
slots this way. Active-cookie submissions resume instead of issuing again.

Session TTL cleanup occurs a day after logical expiry; TTL deletion is eventual.
Token records retain revocation/audit metadata and are not automatically deleted.
Active references include server-only approved asset digest, mode, exact profile
and derived PDQ signals; Managed references also bind the qualified DINO profile
and real vector. No raw image, signed URL or customer archive/case identifier is
persisted. The gated input response can expose a fresh signed URL or real SDK
hashes on demand. Result details expose real PDQ hashes and Managed DINO vectors,
never production API keys or worker/gateway credentials.

Never enable body/header capture of credentials in hosting logs, tracing or
analytics. The routes emit fixed errors without raw backend error bodies. A
gateway credential authenticates a request; it is not a network firewall.

## Verification

`node --test tests/demo-gateway.test.mjs tests/public-privileged-route-boundary.test.mjs`
tests cookies, CSRF origin enforcement, credential stripping, session resumption,
failure responses, and preservation of removed privileged proxies.

Run `npm run build`, `npm run lint`, and `git diff --check` before release. Backend
transaction tests use a fresh local Mongo replica set, never the configured
production database. Configure and verify the real hosting environment before
announcing live access. The release and actual verification evidence are recorded
in [End-to-end release evidence](demo-end-to-end-2026-10-05.md).
