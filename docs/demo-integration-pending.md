# Homepage demo: execution pending

`app/components/DemoPreview.js` renders the demo at `#demo`. Phase 1 connects
founder-issued token redemption, session status/end, and an HttpOnly cookie through
`/api/live-demo/session`. Mode selection requires an active session. The progressive
buyer flow replaces the old stage preview. The production catalogue is explicitly
unavailable; image selection and execution remain disconnected.
No image is registered, matching request sent, or classification fabricated.

The old hash-entry component and Next.js `app/api/demo/route.js` proxy have been
removed. The legacy backend endpoint has not been changed.

## Required before enabling execution

- An authoritative server-owned gallery: opaque asset ID and display image must
  refer to the exact approved storage object and verified SDK signal payload.
  Existing hero images are not automatically registered as demo inputs.
- The Phase 1 gate must be configured on both services (see `demo-access.md`).
  Execution must additionally enforce run reservation and shared compute admission;
  Phase 1 records the run allowance but exposes no compute operation.
- An isolated backend demo reference lifecycle that cannot read or write customer
  data or another visitor's reference. Reset and expiry must discard that state.
- Confirmed contracts for reference registration, upload checks, reset, and
  safe result details. The frontend must send only the permitted opaque choices;
  URLs, storage identities, hashes, vectors, and credentials remain server-owned.
- Real registration success must precede the active-reference state. Only a real
  check response may supply the displayed classification. Do not derive results
  from image labels, transformations, or the selected compute model.

Progression now requires validated operation responses. See `demo-frontend-contract.md`
for the adapter boundary, cycle invariants and development-only visualization.
Preserve `#demo` so the current navigation and hero links still work.
