# Homepage demo: isolated execution connected

`app/components/DemoPreview.js` renders the demo at `#demo`. Phase 1 connects
founder-issued token redemption, session status/end, and an HttpOnly cookie through
`/api/live-demo/session`. Mode selection requires an active session. The progressive
buyer flow replaces the old stage preview. The production display catalogue now
contains four approved reference-only originals and 31 upload-only variants.
Image selection, session-local reporting, real checking and reset are connected
through the dedicated demo gateway. Classifications come from the existing real
matcher, not image filenames, hard-coded results or development fixtures.

The old hash-entry component and Next.js `app/api/demo/route.js` proxy have been
removed. The legacy backend endpoint has not been changed.

## Implemented boundaries

- A server-owned immutable mapping binds every approved display image/ID to exact
  S3 versioned bytes and qualified SDK 1.1.0 signals. Hero artwork is not demo input.
- The Phase 1 gate must be configured on both services (see `demo-access.md`).
  Execution enforces transactional run reservation, per-session concurrency and
  one globally admitted demo job across processes/tasks.
- An isolated backend demo reference lifecycle that cannot read or write customer
  data or another visitor's reference. Reset clears the reference without refunding
  runs; logical expiry denies access immediately and TTL later purges records.
- Confirmed contracts for reference registration, upload checks, reset, and
  safe result details. The frontend must send only the permitted opaque choices;
  URLs, storage identities, hashes, vectors, and credentials remain server-owned.
- Real registration success must precede the active-reference state. Only a real
  check response may supply the displayed classification. Do not derive results
  from image labels, transformations, or the selected compute model.

Progression requires validated operation responses. See `demo-frontend-contract.md`
for the adapter boundary, cycle invariants and development-only visualization.
Preserve `#demo` so the current navigation and hero links still work.

## Separate outstanding work

The inline token-request form has no approved delivery adapter. It remains truthful
and unavailable; manual founder-issued tokens and redemption work independently.
No email, OTP or account system has been added. See
[End-to-end release evidence](demo-end-to-end-2026-10-05.md) for deployed verification.
