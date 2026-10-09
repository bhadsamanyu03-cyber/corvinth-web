'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useConsoleSession } from './ConsoleShell';
import { useConsoleData, consoleRequest, query, date, label } from './data';
import { Heading, DataState, Empty, Badge, Pagination, Field, Facts, ConfirmAction } from './primitives';
import { TERMINAL_SCANS, scanHref, reviewNotice, scanIntent, scanSummary, connectionReadiness, scanStage, cleanupSummary } from '../../lib/pulse-console.mjs';

export function HistoricalScans() {
  const [skip, setSkip] = useState(0);
  const resource = useConsoleData(`jobs?${query({ kind: 'logical', skip })}`, 15000);
  return <><Heading eyebrow="Pulse" title="Historical scans" action={<Link className="cc-button cc-primary" href="/console/scans/new">Scan historical library</Link>}>Follow your library scans from discovery through reviewable results.</Heading>
    <p className="cc-note">{reviewNotice}</p><section className="cc-panel"><DataState resource={resource}>{data => <>{data.items.length ? <div className="cc-table-wrap"><table><thead><tr><th>Scan</th><th>Status</th><th>Progress</th><th>Started</th></tr></thead><tbody>{data.items.map(scan => <tr key={scan.scan_id}><td><Link href={scanHref(scan.scan_id)}>{scan.scan_id} ↗</Link><small>Complaint {scan.complaint_id}</small></td><td><Badge value={scan.status}/></td><td>{scan.counts.completed} completed · {scan.counts.failed} failed<small>{scan.discovery?.status === 'sealed' || !scan.discovery ? `${scan.expected} objects` : 'Discovering library'}</small></td><td>{date(scan.created_at)}</td></tr>)}</tbody></table></div> : <Empty icon="scan" title="No historical scans yet">Open a Pulse complaint and select Scan historical library.</Empty>}<Pagination skip={skip} next={data.next_skip} onChange={setSkip}/></>}</DataState></section>
    <p className="cc-help"><Link href="/console/scans/legacy">Inspect earlier storage and URL jobs ↗</Link></p></>;
}

export function StartHistoricalScan({ complaintId }) {
  const setup = useConsoleData('pulse-setup');
  const reference = useConsoleData(`report?${query({ kind: 'pulse', reference: complaintId })}`);
  const session = useConsoleSession();
  const router = useRouter();
  const [selection, setSelection] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function start(integration) {
    setBusy(true); setError('');
    try {
      const scope = { storage_integration_id: integration.id, selected_prefix: integration.approved_prefix };
      const intent = scanIntent(sessionStorage, session.platform_id, 'start', complaintId, scope, () => crypto.randomUUID());
      const result = await consoleRequest(`historical-scans/${encodeURIComponent(complaintId)}/start`, { method: 'POST', body: { request_id: intent.request_id, storage_scope: scope } });
      router.push(scanHref(result.scan_id));
      sessionStorage.removeItem(intent.key);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <section className="cc-panel cc-panel-body"><h2>Scan historical library</h2><DataState resource={reference}>{row => <p>Reference: <strong>{row.case_id}</strong>{row.status !== 'active' && ' — this reference is not active and cannot start a scan.'}</p>}</DataState><p className="cc-help">Corvinth discovers this library and processes the scan automatically. Compatible stored embeddings are reused. You can close this page after starting.</p><DataState resource={setup}>{data => {
    const eligible = data.integrations.filter(row => row.pulse_eligible);
    const selected = eligible.find(row => row.id === selection) || eligible[0];
    return <>{selected ? <>{eligible.length > 1 ? <Field label="Library connection"><select value={selected.id} disabled={busy} onChange={event => setSelection(event.target.value)}>
      {eligible.map(row => <option key={row.id} value={row.id}>{row.storage_bucket} · {row.approved_prefix || '(whole bucket)'}</option>)}
    </select></Field> : <p>Library: <strong>{selected.storage_bucket}</strong> · {selected.approved_prefix || 'Whole bucket'}</p>}
      <p className="cc-help">{connectionReadiness(selected).detail}</p>
      <p className="cc-help">Up to {data.member_limit.toLocaleString()} discovered objects per scan. Compute waits for an approved allowance; reusable work needs no new inference.</p>
      <button className="cc-button cc-primary" disabled={busy || !data.enabled || reference.data?.status !== 'active'} onClick={() => start(selected)}>{busy ? 'Starting…' : 'Scan historical library'}</button>
    </> : <p className="cc-note">This platform has no eligible Pulse library connection. Complete <Link href="/console/integration">connector setup</Link> before starting.</p>}
    <p className="cc-help">Start returns to an existing scan for this reference and library. To check the library again, choose Rescan library from the completed scan.</p></>;
  }}</DataState>{error && <p className="cc-error" role="alert">{error} Retrying keeps the same request intent.</p>}</section>;
}

export function NewHistoricalScan() {
  const [skip, setSkip] = useState(0);
  const reports = useConsoleData(`reports?${query({ kind: 'pulse', skip })}`);
  return <><Heading eyebrow="Pulse" title="Choose a reference" action={<Link className="cc-button cc-secondary" href="/console/report/pulse">Prepare a new reference</Link>}>Choose the reviewed image to compare with your historical library.</Heading><section className="cc-panel"><DataState resource={reports}>{data => <>{data.items.map(row => <div className="cc-row" key={row.reference}><div><strong>{row.case_id}</strong><Badge value={row.status}/></div>{row.status === 'active' ? <Link className="cc-button cc-secondary" href={`/console/scans/new/${encodeURIComponent(row.reference)}`}>Use this reference</Link> : <Link href={`/console/cases/pulse/${encodeURIComponent(row.reference)}`}>View case</Link>}</div>)}{!data.items.length && <Empty title="No Pulse references on this page">Prepare a reviewed reference image before starting a historical scan.</Empty>}<Pagination skip={skip} next={data.next_skip} onChange={setSkip}/></>}</DataState></section></>;
}

function LogicalResults({ id, status }) {
  const [cursor, setCursor] = useState('');
  const [history, setHistory] = useState([]);
  const resource = useConsoleData(`historical-scans/${id}/results?${query({ limit: 20, after: cursor || undefined })}`, TERMINAL_SCANS.has(status) ? 0 : 15000);
  return <section className="cc-panel"><div className="cc-panel-head"><h2>Library results</h2><button className="cc-text-button" onClick={resource.reload}>Refresh results</button></div><p className="cc-note">{reviewNotice} These pages include every captured item and its outcome; they are not a capped nearest-neighbor list.</p><DataState resource={resource}>{data => <>
    {data.items.length ? <div className="cc-table-wrap"><table><thead><tr><th>Storage object</th><th>Outcome</th><th>Cosine similarity</th><th>Source authority</th></tr></thead><tbody>{data.items.map(item => <tr key={item.storage_identity_key}><td><strong>{item.storage_reference?.object_key || item.platform_content_id || item.storage_identity_key}</strong><small>{item.storage_reference?.storage_bucket} · {item.storage_reference?.object_version || 'Immutable key'}</small></td><td><Badge value={item.status}/></td><td>{item.status === 'completed' && item.result?.cosine_similarity != null ? String(item.result.cosine_similarity) : 'No completed comparison'}</td><td>{item.current_source_valid ? 'Current' : 'Source no longer valid'}<small>{item.result?.decision === 'calibration_pending' ? 'Human review required' : 'Review only'}</small></td></tr>)}</tbody></table></div> : <Empty title="No captured results yet">Discovery and processing update this view automatically.</Empty>}
    <nav className="cc-pagination" aria-label="Result pages"><button className="cc-button cc-secondary" disabled={!history.length} onClick={() => { setCursor(history.at(-1)); setHistory(old => old.slice(0, -1)); }}>← Previous results</button><span>Page {history.length + 1}</span><button className="cc-button cc-secondary" disabled={!data.next_cursor} onClick={() => { setHistory(old => [...old, cursor]); setCursor(data.next_cursor); }}>Next results →</button></nav>
  </>}</DataState></section>;
}

export function HistoricalScanDetail({ id }) {
  const resource = useConsoleData(`historical-scans/${encodeURIComponent(id)}`, 15000);
  const operations = useConsoleData(`historical-scans/${encodeURIComponent(id)}/operations`, 30000);
  const session = useConsoleSession();
  const router = useRouter();
  async function action(name) {
    let intent;
    if (name === 'rescan') intent = scanIntent(sessionStorage, session.platform_id, 'rescan', id, null, () => crypto.randomUUID());
    const result = await consoleRequest(`historical-scans/${id}/${name}`, { method: 'POST', body: intent ? { request_id: intent.request_id } : {} });
    if (intent) { router.push(scanHref(result.scan_id)); sessionStorage.removeItem(intent.key); }
    else { resource.reload(); operations.reload(); }
  }
  return <><Heading eyebrow="Pulse historical scan" title="Scan progress" action={<Link href="/console/scans" className="cc-button cc-secondary">← Historical scans</Link>}>{id}</Heading><div className="cc-stack"><section className="cc-panel cc-panel-body"><DataState resource={resource}>{scan => {
    const summary = scanSummary(scan);
    return <><p role="status" aria-live="polite">{scanStage(scan, operations.data)}</p>
      {!summary.complete && <p className="cc-help">You can leave this page. Progress is saved by Corvinth; reopening the scan continues from the same work. Pausing or cancellation does not erase completed outcomes.</p>}
      {operations.data?.capacity_status === 'awaiting_approved_capacity' && !summary.complete && <p className="cc-note">This scan is queued. Corvinth starts compute when capacity and your approved allowance are available. Do not create another scan to retry. If intervention is required, Corvinth alerts its operator.</p>}
      <Facts entries={[["Status", <Badge key="state" value={scan.status}/>], ['Completed', scan.counts.completed], ['Failed', scan.counts.failed], ['Cancelled', scan.counts.cancelled], ['Processing', scan.counts.processing], ['Awaiting publication', scan.counts.pending_publication], ['Remaining', scan.counts.pending], ['Captured members', scan.expected], ['Started', date(scan.created_at)], ['Completed at', date(scan.completed_at)]]}/>
      {summary.percent !== null && <div className="cc-progress" role="progressbar" aria-label="Terminal items" aria-valuenow={summary.terminal} aria-valuemin={0} aria-valuemax={summary.total}><span style={{ width: `${summary.percent}%` }}/></div>}
      {scan.last_error && <p className="cc-error" role="alert">{label(scan.last_error)}. Inspect connection status before resuming.</p>}
      {scan.completion_event && <p className="cc-help">Completion receipt: {scan.completion_event.event_id}</p>}
      <div className="cc-actions">{scan.status === 'running' && <ConfirmAction title="Pause this scan?" description="Stop admitting new work. Already accepted work settles under the existing safety rules." button="Pause scan" onConfirm={() => action('pause')}/>}
      {scan.status === 'paused' && <ConfirmAction title="Resume this scan?" description="Continue the same captured membership and completed work." button="Resume scan" onConfirm={() => action('resume')}/>}
      {!TERMINAL_SCANS.has(scan.status) && <ConfirmAction title="Cancel this scan?" description="Close new work and settle accepted work. Cancellation does not erase reusable vectors or completed results. Resource shutdown is shown separately below." button="Cancel scan" disabled={scan.status === 'cancelling'} onConfirm={() => action('cancel')}/>}
      {TERMINAL_SCANS.has(scan.status) && <ConfirmAction title="Scan the library again?" description="Create a new explicit scan intent. Compatible embeddings will be reused, and new compute requires available approved budget." button="Rescan library" onConfirm={() => action('rescan')}/>}
      </div><p className="cc-note">{reviewNotice}</p></>;
  }}</DataState></section><section className="cc-panel cc-panel-body"><h2>Automatic operation</h2><DataState resource={operations}>{data => <><p role="status">{cleanupSummary(data)}</p>{data.required_action && <p className="cc-note">{data.required_action}</p>}<details><summary>Connection and cleanup details</summary><Facts entries={[
    ['Customer connector', label(data.connector_status)], ['Compute capacity', label(data.capacity_status)], ['Cleanup', label(data.cleanup_status)], ['Required action', data.required_action || 'None'],
  ]}/></details></>}</DataState><p className="cc-help">Results can be complete while shutdown is still in progress. Corvinth verifies both.</p></section>{resource.data && <LogicalResults key={id} id={id} status={resource.data.status}/>}</div></>;
}
