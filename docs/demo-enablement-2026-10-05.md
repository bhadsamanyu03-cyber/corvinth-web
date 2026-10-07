# Live demo access enablement — 2026-10-05

Scope: restore founder-token entry, session resume and exit after explicit user
confirmation that the DINO staging work had finished. No classifier wiring.

## Failure and fix

Both deployments lacked `CORVINTH_DEMO_ENABLED` and their dedicated shared
`CORVINTH_DEMO_GATEWAY_SECRET`. After adding these, the intended API became ready,
but frontend token POSTs still returned 503 at approximately the gateway's
eight-second timeout. The shared sensitive `CORVINTH_API_URL` value could not be
retrieved; no claim is made about its exact previous target.

One route-line change makes the demo prefer `CORVINTH_DEMO_BACKEND_URL`, retaining
`CORVINTH_API_URL` as a fallback. The dedicated URL is explicitly configured to:

```text
https://co-b18e5043552e498e9626d4b28fa82be8.ecs.us-east-1.on.aws
```

This removed the timeout and restored live redemption. The shared waitlist URL
and API key were not changed.

## Deployed changes

- New independent Secrets Manager secret: `corvinth/demo/gateway`.
- New execution-role inline policy: `CorvinthDemoGatewaySecretRead`, granting only
  `secretsmanager:GetSecretValue` for that exact new secret ARN.
- API Express Gateway configuration: enable flag plus the new secret reference.
  ECS task definition `default-corvinth-api-staging:54` became `:55` and completed
  rollout with one running task and zero pending tasks.
- Task definitions were compared after sorting environment/secret entries and
  excluding AWS revision metadata. No substantive differences beyond those two
  demo additions. The DINO image digest, existing secrets, roles, CPU/memory and
  task configuration were preserved. No worker/controller, ALB, scaling, Qdrant
  or Mongo authority changes were made. Demo startup initialized its own indexes.
- Vercel production: the two access settings plus `CORVINTH_DEMO_BACKEND_URL`.
  Existing production/preview settings were not overwritten.
- An initial rebuild of the production deployment established that configuration
  alone did not resolve the remaining upstream timeout. Final production
  deployment: `dpl_DdPiuPZh7WV2Y7ALEQrKu5J6CeaG`, aliased to `www.corvinth.com`.
  It used a clean archive of production commit
  `c76c49db5c257f89d7b14668b9e37700bcca5ac9` plus only the one-line route fix.
  No dirty/untracked asset, console or other homepage work was deployed.

## Verification

- API health: 200, engine ready and change stream healthy.
- Backend session GET without gateway credential: 401 `demo_gateway_required`.
- Backend GET with the correct gateway but no session: 401 `demo_session_invalid`.
- Frontend fresh session GET: 200 inactive.
- Provided founder token was found enabled in the deployed Mongo authority with
  zero sessions issued before successful verification. One real browser
  redemption then returned 200 active, ten runs remaining, zero used, and
  `execution_available: false`. No token/session secret is recorded here.
- Live Chrome: homepage token gate to `/demo`; reload retained the same opaque
  session cookie, expiry and allowance; Exit demo returned inactive and removed
  the cookie. No browser exceptions.
- Cookie: host-only `__Host-corvinth_demo`, Secure, HttpOnly, SameSite Strict,
  Path `/`; not exposed in document.cookie or browser local/session storage.
- Foreign-origin redemption request: 403.
- Desktop 1440px and mobile 390px screenshots inspected. Mobile had no horizontal
  overflow or broken images. This was live Chrome verification, not Safari proof.
- 29 focused frontend tests passed, including three new route-configuration
  regressions; `npm run build` and `git diff --check` passed. Lint had zero errors
  and eight pre-existing warnings. The final Vercel build also passed.

## Remaining boundary

Phase 1 access is live; reporting/checking images and real classification are not
enabled. The existing production workspace still uses its previous asset-slot
state. Local approved-asset work was deliberately not included in this release.
No fake results, backend matching changes or legacy `/demo/check` changes.

The route fix and its tests/docs remain uncommitted in the frontend checkout.
Include the route fix in the next reviewed Git release; redeploying the unchanged
Git baseline would lose the dedicated URL preference and reintroduce the failure.
