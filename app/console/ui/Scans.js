'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { jobHref } from '../../lib/console-catalog.mjs';
import { useConsoleData, consoleRequest, query, date, label } from './data';
import { Heading, DataState, Empty, Badge, Pagination, Field, Facts, ConfirmAction } from './primitives';

export function Scans() {
  const [kind, setKind] = useState('storage');
  const [skip, setSkip] = useState(0);
  const resource = useConsoleData(`jobs?${query({ kind, skip })}`);
  return <><Heading eyebrow="Platform archive" title="Scan jobs" action={<Link className="cc-button cc-primary" href="/console/scans/manual">Create a backfill +</Link>}>Register an inventory, finalize it, and follow processing through to completion.</Heading><div className="cc-tabs" role="tablist" aria-label="Scan type">{['storage','url'].map(value => <button role="tab" key={value} aria-selected={kind === value} onClick={() => { setKind(value); setSkip(0); }}>{value === 'storage' ? 'Storage backfills' : 'URL jobs'}</button>)}</div><section className="cc-panel"><DataState resource={resource}>{data => <>{data.items.length ? <div className="cc-table-wrap"><table><thead><tr><th>Backfill</th><th>Status</th><th>Items</th><th>Created</th></tr></thead><tbody>{data.items.map(job => <tr key={job.job_id}><td><Link href={jobHref(kind, job.job_id)}>{job.client_job_id || job.job_id} ↗</Link><small>{label(job.corpus_kind || (job.complaint_id ? 'complaint_scan' : 'library_indexing'))}</small></td><td><Badge value={job.status}/></td><td>{job.expected_item_count ?? job.total_items ?? 'Not available'}<small>{job.registered_item_count != null ? `${job.registered_item_count} registered` : `${job.processed_count ?? 0} processed`}</small></td><td>{date(job.created_at)}</td></tr>)}</tbody></table></div> : <Empty icon="scan" title="No jobs on this page">Start with a storage backfill, or inspect an existing URL job submitted by your platform integration.</Empty>}<Pagination skip={skip} next={data.next_skip} onChange={setSkip}/></>}</DataState></section></>;
}

export function NewScan() {
  const overview = useConsoleData('overview');
  const router = useRouter();
  const [corpus, setCorpus] = useState('pulse_library');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await consoleRequest('jobs', { method: 'POST', body: { ...values, expected_item_count: Number(values.expected_item_count), corpus_kind: corpus } });
      router.push(jobHref('storage', result.job_id));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <><Heading eyebrow="Storage backfill" title="Create a backfill" action={<Link className="cc-button cc-secondary" href="/console/scans">← Scan jobs</Link>}>Define the inventory first. Register its items before finalizing the job.</Heading><div className="cc-form-layout"><section className="cc-panel"><DataState resource={overview}>{data => <form className="cc-form" onSubmit={submit}>{!data.storage_jobs_enabled && <p className="cc-note">Storage backfills are not enabled for this platform. Contact Corvinth to configure the connection.</p>}<fieldset disabled={busy || !data.storage_jobs_enabled} style={{ border: 0 }}><Field label="Backfill reference" hint="A stable, unique ID for this inventory. Reuse it when retrying the same creation request."><input name="client_job_id" maxLength={128} required placeholder="e.g. archive-october-2026"/></Field><Field label="Purpose"><select value={corpus} onChange={event => setCorpus(event.target.value)}><option value="pulse_library">Index platform library</option><option value="complaint_scan">Scan against a Pulse report</option></select></Field>{corpus === 'complaint_scan' && <Field label="Pulse complaint ID" hint="Use an active complaint ID from Reported cases."><input name="complaint_id" required maxLength={200}/></Field>}<Field label="Storage integration"><select name="storage_integration_id" required defaultValue=""><option value="" disabled>Select a configured integration</option>{data.integrations.filter(item => item.status === 'active').map(item => <option key={item.id} value={item.id}>{item.storage_bucket} · {item.bucket_region}</option>)}</select></Field><Field label="Expected number of items" hint="The final registered inventory must match this count."><input type="number" min={1} max={corpus === 'complaint_scan' ? 50000 : 100000} name="expected_item_count" required/></Field></fieldset>{error && <p className="cc-error" role="alert">{error}</p>}<div className="cc-form-footer"><span className="cc-help">Creates a draft inventory.</span><button className="cc-button cc-primary" disabled={busy || !data.storage_jobs_enabled || !data.integrations.some(item => item.status === 'active')}>{busy ? 'Creating…' : 'Create backfill →'}</button></div></form>}</DataState></section><aside className="cc-explainer"><h3>Three steps to a scan</h3><ol><li>Create the backfill with its purpose and expected size.</li><li>Register the exact storage objects to process.</li><li>Finalize the inventory and inspect progress.</li></ol><p style={{ marginTop: 22 }}>Your platform’s worker integration processes the sealed inventory. The console shows the state reported by the backend.</p><p>Complaint scans require a compatible complaint vector and backend configuration. An active complaint alone does not guarantee scan eligibility.</p></aside></div></>;
}

function ItemRegistration({ job, reload }) {
  const overview = useConsoleData('overview');
  const [rows, setRows] = useState([{ object_key: '', object_version: '', platform_content_id: '' }]);
  const [bucket, setBucket] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(null);
  const change = (index, name, value) => { pending.current = null; setRows(current => current.map((row, i) => i === index ? { ...row, [name]: value } : row)); };
  async function register(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      pending.current ||= { registration_request_id: crypto.randomUUID(), expected_coordination_revision: job.coordination_revision,
        items: rows.map(row => ({ ...row, storage_bucket: bucket })) };
      await consoleRequest(`job/${encodeURIComponent(job.job_id)}/items`, { method: 'POST', body: pending.current });
      pending.current = null; setRows([{ object_key: '', object_version: '', platform_content_id: '' }]); reload();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <section className="cc-panel cc-panel-body"><h2>Register storage items</h2><p className="cc-help" style={{ marginTop: 10 }}>Object keys and versions must identify the exact objects in this backfill’s configured integration. No image URLs are stored here.</p><form onSubmit={register}><fieldset disabled={busy} style={{ border: 0, minWidth: 0 }}><Field label="Storage bucket"><select required value={bucket} onChange={event => { setBucket(event.target.value); pending.current = null; }}><option value="">Select the backfill’s bucket</option>{overview.data?.integrations.filter(item => item.status === 'active').map(item => <option key={item.id} value={item.storage_bucket}>{item.storage_bucket} · {label(item.version_policy)}</option>)}</select></Field>{overview.error && <p className="cc-error">{overview.error.message}</p>}{rows.map((row, index) => <div className="cc-registered-item" key={index}>{[['platform_content_id','Content ID (optional)'],['object_key','Object key'],['object_version','Version ID (blank for immutable keys)']].map(([name, title]) => <input key={name} aria-label={`${title}, item ${index + 1}`} placeholder={title} value={row[name]} required={name === 'object_key'} onChange={event => change(index, name, event.target.value)} maxLength={name === 'platform_content_id' ? 500 : 1024}/>)}<button type="button" className="cc-text-button" aria-label={`Remove item ${index + 1}`} disabled={rows.length === 1} onClick={() => { pending.current = null; setRows(current => current.filter((_, i) => i !== index)); }}>Remove</button></div>)}<div className="cc-actions"><button type="button" disabled={rows.length >= 500} className="cc-button cc-secondary" onClick={() => { pending.current = null; setRows(current => [...current, { object_key: '', object_version: '', platform_content_id: '' }]); }}>Add item +</button><button className="cc-button cc-primary" disabled={busy || !bucket}>{busy ? 'Registering…' : `Register ${rows.length} item${rows.length === 1 ? '' : 's'}`}</button></div></fieldset>{error && <p className="cc-error" role="alert">{error}</p>}</form></section>;
}

function RegisteredItems({ id, revision }) {
  const [after, setAfter] = useState('');
  const [history, setHistory] = useState([]);
  const resource = useConsoleData(`items/${encodeURIComponent(id)}?${query({ limit: 20, after_item_id: after || undefined, revision })}`);
  return <section className="cc-panel"><div className="cc-panel-head"><h2>Registered items</h2></div><DataState resource={resource}>{data => <>{data.items.length ? data.items.map(item => <div className="cc-row" key={item.item_id}><div><strong>{item.storage_reference?.object_key || item.platform_content_id || item.item_id}</strong><small>{item.storage_reference?.storage_bucket} · Version: {item.storage_reference?.object_version || 'Immutable key'}</small>{item.error_code && <small>{label(item.error_code)}</small>}</div><Badge value={item.status}/></div>) : <Empty icon="scan" title="No registered items yet">Register the inventory before finalizing this backfill.</Empty>}<nav className="cc-pagination" aria-label="Item pagination"><button className="cc-button cc-secondary" disabled={!history.length} onClick={() => { setAfter(history.at(-1)); setHistory(current => current.slice(0, -1)); }}>← Previous</button><span>Page {history.length + 1}</span><button className="cc-button cc-secondary" disabled={!data.next_after_item_id} onClick={() => { setHistory(current => [...current, after]); setAfter(data.next_after_item_id); }}>Next →</button></nav></>}</DataState></section>;
}

export function ScanDetail({ kind, id }) {
  const resource = useConsoleData(`job/${kind}/${encodeURIComponent(id)}`);
  const [revision, setRevision] = useState(0);
  const reload = () => { resource.reload(); setRevision(value => value + 1); };
  useEffect(() => {
    if (!['active', 'queued', 'in_progress', 'cancelling'].includes(resource.data?.status)) return;
    const interval = setInterval(resource.reload, 15000);
    return () => clearInterval(interval);
  }, [resource.data?.status, resource.reload]);
  return <><Heading eyebrow={kind === 'storage' ? 'Storage backfill' : 'URL scan'} title="Backfill details" action={<div className="cc-actions" style={{ marginTop: 0 }}><button className="cc-button cc-secondary" onClick={reload}>Refresh</button><Link className="cc-text-button" href="/console/scans">All jobs ↗</Link></div>}>{id}</Heading><div className="cc-stack"><section className="cc-panel cc-panel-body"><DataState resource={resource}>{job => {
    const completed = kind === 'storage' ? job.counts?.completed ?? 0 : job.processed_count;
    const total = job.expected_item_count ?? job.total_items;
    return <><Facts entries={[
      ['Status', <Badge key="status" value={job.status}/>], ['Purpose', label(job.corpus_kind || 'URL processing')], ['Created', date(job.created_at)], ['Completed', date(job.completed_at)], ['Inventory size', total], ['Registered', job.registered_item_count ?? 'Not applicable'], ['Processed', completed], ['Failed', kind === 'storage' ? job.counts?.failed ?? 0 : job.failed_count],
    ]}/><div className="cc-progress" role="progressbar" aria-label="Completed items" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={total}><span style={{ width: `${total ? Math.min(100, completed / total * 100) : 0}%` }}/></div><p className="cc-help">{completed} of {total} items processed{job.error_code ? ` · ${label(job.error_code)}` : ''}</p>{kind === 'storage' ? <div className="cc-actions">{job.status === 'draft' && <ConfirmAction title="Finalize this inventory?" description="Finalizing seals this inventory for processing. Confirm that all expected objects have been registered." button="Finalize inventory" disabled={job.registered_item_count !== job.expected_item_count} onConfirm={async () => { await consoleRequest(`job/${encodeURIComponent(id)}/seal`, { method: 'POST', body: { expected_coordination_revision: job.coordination_revision } }); reload(); }}/>}<ConfirmAction title="Cancel this backfill?" description="Request cancellation of this job. Work already committed may remain visible; inspect the returned status for completion." button="Cancel job" disabled={['completed','completed_with_failures','cancelled'].includes(job.status)} onConfirm={async () => { await consoleRequest(`job/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: {} }); reload(); }}/></div> : <p className="cc-note" style={{ marginTop: 20 }}>This legacy URL-job API supports progress inspection but has no standalone cancellation endpoint. Complaint withdrawal is a separate action with broader effects.</p>}</>;
  }}</DataState></section>{kind === 'storage' && resource.data?.status === 'draft' && <ItemRegistration key={id} job={resource.data} reload={reload}/>} {kind === 'storage' && <RegisteredItems key={id} id={id} revision={`${revision}:${resource.data?.status}`}/>}</div></>;
}
