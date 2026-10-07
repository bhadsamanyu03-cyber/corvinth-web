# Demo access: post-DINO enablement

The initial preparation below was executed after the user confirmed DINO staging
was released and authorized enablement on 2026-10-05. See
[Enablement result](demo-enablement-2026-10-05.md) for the actual changes and checks.
The deployment boundary still applies to future overlapping staging work.
This enables Phase 1 access, not image matching or compute.

## Verified target and configuration

Intended `CORVINTH_DEMO_BACKEND_URL` (legacy fallback: `CORVINTH_API_URL`):

```text
https://co-b18e5043552e498e9626d4b28fa82be8.ecs.us-east-1.on.aws
```

AWS Express Gateway currently advertises this hostname for ECS cluster `default`,
service `corvinth-api-staging`, region `us-east-1`. Read-only inspection on
2026-10-05 confirmed `/demo/v1/session` returns HTTP 503 `demo_unavailable`.
The accepted diagnosis found the enable flag and dedicated secret absent on both
the API deployment and Vercel deployment. Reconfirm the latest configuration after
DINO finishes; do not reuse an earlier task definition or image.

| Environment variable | Next.js / Vercel production | Corvinth API |
| --- | --- | --- |
| `CORVINTH_DEMO_ENABLED` | Exactly `true` | Exactly `true` |
| `CORVINTH_DEMO_GATEWAY_SECRET` | Sensitive server-only value | Same value, injected through a dedicated Secrets Manager reference |
| `CORVINTH_DEMO_BACKEND_URL` | HTTPS origin above; no path, credentials, query or fragment | Not required by demo access |
| `MONGO_URI` | Not required by the frontend | Preserve existing value and authority; replica set or sharded deployment supporting transactions |

Generate one independent, cryptographically random gateway secret of at least 32
characters when enablement is authorized. Share that exact value between these
two services. Do not reuse the console gateway secret, customer API key,
`DEMO_API_KEY`, founder token or session secret. Never use a `NEXT_PUBLIC_` variable
for credentials, or record their values in this document, logs or chat.

Other production demo configuration:

- `CORVINTH_DEMO_ALLOWED_ORIGINS` is optional; defaults already permit exactly
  `https://corvinth.com` and `https://www.corvinth.com`.
- Do not enable `CORVINTH_DEMO_ALLOW_LOCAL` in production.
- `NEXT_PUBLIC_API_URL` does not configure this server gateway.

Vercel exposes the existing `CORVINTH_API_URL` as sensitive metadata; its actual
deployed value was not retrieved. It also serves the waitlist integration and was
preserved. The demo now prefers its independently configured backend URL, so
enabling demo access does not retarget the waitlist.

## Smallest safe deployment sequence — deferred

1. Obtain the DINO completion/handoff. Read the latest active API service/image,
   task configuration and health. Preserve every DINO setting, image, process
   role, existing secret reference, routing and database authority. Historical
   Shield process roles do not mount demo access; do not change roles to force it.
2. Provision the single dedicated gateway secret and add only
   `CORVINTH_DEMO_ENABLED=true` plus its secret injection to the latest API
   configuration. Perform one authorized API rollout using the existing deployment
   mechanism. No backend source change is required for this configuration fix.
   Enabled startup verifies Mongo transaction support and initializes indexes in
   `corvinth.demo_tokens`, `demo_sessions` and `demo_rate_limits`; this is an
   intentional database write, deferred until this step.
3. Before enabling the frontend, verify API health and startup success. Without
   gateway credentials, GET `/demo/v1/session` must return HTTP 401
   `demo_gateway_required`, replacing the current HTTP 503. This tests the
   fail-closed gateway boundary and initialized access service without redeeming
   a token. If startup/index initialization fails or it remains 503, stop; do not
   weaken the readiness guard or roll back the DINO image.
4. Set the two required demo variables in Vercel **production** and confirm
   `CORVINTH_DEMO_BACKEND_URL` above. Redeploy the intended current production source once
   so the server receives the new environment. Do not deploy the dirty local
   checkout or unrelated untracked console work. No homepage/workspace code
   changes are needed. Preview settings are not required for production access.
5. Issue one founder smoke-test token against the API's existing Mongo authority,
   then complete the browser checks below. Do not issue prospect tokens until
   these checks pass.

API readiness probes, without credentials:

```sh
curl -sS --max-time 15 -w '\nHTTP %{http_code}\n' \
  https://co-b18e5043552e498e9626d4b28fa82be8.ecs.us-east-1.on.aws/health
curl -sS --max-time 15 -w '\nHTTP %{http_code}\n' \
  https://co-b18e5043552e498e9626d4b28fa82be8.ecs.us-east-1.on.aws/demo/v1/session
```

Expected: health 200 with existing readiness checks passing; demo session 401
`demo_gateway_required`. Health alone does not establish demo readiness.

## End-to-end verification — deferred

Run the operator CLI from the backend checkout using its existing dependencies.
Explicitly supply the existing API Mongo authority through the operator
environment's `MONGO_URI`; the CLI does not load dotenv and uses database
`corvinth`. Keep the one-time raw-token output out of persistent logs.

```sh
python3 demo_tokens_cli.py issue --label "Founder access smoke" \
  --expires-days 1 --max-sessions 3 --session-minutes 1 --max-runs 10
```

Use `https://www.corvinth.com` throughout, including `/demo`. The apex redirects
to www; the `__Host-corvinth_demo` cookie is host-specific.

1. Fresh browser context: GET `/api/live-demo/session` returns 200
   `{ "status": "inactive" }`. This checks frontend configuration only: without
   a cookie, GET does **not** contact the backend.
2. Enter the issued token in the real homepage gate. POST
   `/api/live-demo/session` must return 200, active status, a future `expires_at`,
   `max_runs: 10`, `runs_used: 0`, `runs_remaining: 10`, and
   `execution_available: false`. This is the real gateway/backend/Mongo test.
   Verify a Secure, HttpOnly, SameSite=Strict cookie named
   `__Host-corvinth_demo`, Path=/, with no Domain attribute. Neither JSON nor page
   storage should contain a session secret, gateway credential or production key.
3. `/demo` loads; reload before the one-minute expiry resumes the same session
   through GET without another token POST or a replenished allowance. Exit demo
   produces a successful DELETE, clears the cookie, and leaves GET inactive.
4. Redeem again (second session), wait past its returned expiry, then verify
   access ends. Browsers normally expire the cookie themselves, so session GET
   returns 200 inactive; if an expired cookie reaches the gateway, it must return
   401 and clear it. `/demo` must no longer grant access. Backend tests separately
   verify logical expiry independently of eventual Mongo TTL cleanup.
5. Redeem again (third session). Revoke using the non-secret ID printed at issuance:

   ```sh
   python3 demo_tokens_cli.py revoke --token-id TOKEN_ID_FROM_ISSUANCE
   ```

   Before this session expires, its next status request must return 401 and clear
   the cookie. Reusing the revoked token must fail without exposing backend
   details. If the short test lifetime expires before a check, distinguish that
   result from revocation proof; use a new bounded test token if necessary.

Phase 1 must still expose no live classification or executable report/re-upload
actions. Real asset mapping and isolated execution remain separate work.
Automated tests cover redemption limits, concurrent issuance and invalid origins;
do not brute-force the shared staging gateway to demonstrate its rate limits.

## Local release checks and scope

Frontend:

```sh
node --test tests/demo-gateway.test.mjs tests/public-privileged-route-boundary.test.mjs
npm run lint
npm run build
git diff --check
```

Backend: `python3 -m pytest tests/test_demo_access.py -q` uses a disposable local
Mongo replica set, not staging. Run with the documented test dependencies; never
redirect these tests to the shared database.

No changes to `/demo/check`, matching routes, DINO workers/controllers, ALB/DNS,
Qdrant, production API keys or existing Mongo/Secrets Manager authority are
required. Enabling the API flag/secret and replacing its task **does** touch the
shared API deployment, so it cannot happen while the DINO run is active. If the
latest post-DINO configuration differs, rebase these two additions onto that
configuration rather than deploying the earlier inspected revision.
