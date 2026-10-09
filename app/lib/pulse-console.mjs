export const TERMINAL_SCANS = new Set(['completed', 'completed_with_failures', 'cancelled']);
export const scanHref = id => `/console/scans/logical/${encodeURIComponent(id)}`;
export const reviewNotice = 'Review only · calibration pending. Similarity is evidence for human review, not a match or removal decision.';

// Persist explicit intent across a lost response/reload. No credentials or URLs.
export function scanIntent(storage, tenant, operation, id, scope, randomUUID) {
  const key = `corvinth:pulse-intent:${tenant}:${operation}:${id}`;
  const identity = JSON.stringify(scope ?? null);
  let saved;
  try { saved = JSON.parse(storage.getItem(key)); } catch { /* A malformed local value has no authority. */ }
  if (!saved || saved.identity !== identity || !/^[0-9a-f-]{36}$/i.test(saved.request_id || '')) {
    saved = { identity, request_id: randomUUID() };
    storage.setItem(key, JSON.stringify(saved));
  }
  return { key, request_id: saved.request_id };
}

export function scanSummary(scan) {
  const counts = scan.counts || {};
  const terminal = (counts.completed || 0) + (counts.failed || 0) + (counts.cancelled || 0);
  const sealed = !scan.discovery || scan.discovery.status === 'sealed';
  return { terminal, total: scan.expected, sealed,
    percent: sealed && scan.expected > 0 ? Math.min(100, terminal / scan.expected * 100) : null,
    complete: TERMINAL_SCANS.has(scan.status) && Boolean(scan.completion_event),
  };
}

// Presentation only. A connector heartbeat never grants compute or budget authority.
export function connectionReadiness(integration) {
  if (!integration?.pulse_eligible) return { state: 'approval', title: 'Onboarding required', detail: 'Corvinth must approve this library before Pulse can use it.' };
  const connector = integration.connector_status;
  if (connector?.multiple_installations) return { state: 'attention', title: 'Connection needs attention', detail: 'More than one connector is reporting for this library. Contact the person who manages your connector before starting new work.' };
  if (!connector?.connected) return { state: 'offline', title: 'Waiting for your connector', detail: 'Your library connector has not checked in recently. Restore the existing installation; keep its saved scan progress.' };
  if (!connector.reference_preparation_supported) return { state: 'upgrade', title: 'Connector update available', detail: 'Historical scans are supported. Update the connector once to prepare new reference images.' };
  return { state: 'connected', title: 'Library connected', detail: 'Corvinth discovers requested work and reuses compatible embeddings automatically. Compute starts only within your approved allowance.' };
}

export function scanStage(scan, operations) {
  if (scanSummary(scan).complete) return scan.status === 'completed' ? 'Results ready for review' : 'Scan ended with recorded outcomes';
  if (scan.status === 'paused') return 'Paused — resume this scan to continue';
  if (scan.status === 'cancelling') return 'Cancelling — accepted work is settling';
  if (operations?.connector_status === 'awaiting_connector') return 'Waiting for your library connection';
  if (!scanSummary(scan).sealed) return 'Discovering your library';
  if (operations?.capacity_status === 'awaiting_approved_capacity') return 'Queued for approved compute';
  if (scan.counts?.pending_publication) return 'Processing and saving verified results';
  return 'Processing your library';
}

export function cleanupSummary(operations) {
  if (!operations || operations.cleanup_status === 'verification_unavailable') return 'Shutdown has not yet been verified.';
  if (operations.cleanup_status === 'zero_verified') return 'Cleanup complete · capacity stopped';
  if (operations.cleanup_status === 'not_required') return 'No compute capacity was required';
  if (operations.cleanup_status === 'in_progress') return 'Corvinth is shutting down compute automatically';
  return 'Corvinth handles compute and cleanup automatically';
}
