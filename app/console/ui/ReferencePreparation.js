'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { consoleRequest, useConsoleData } from './data';
import { useConsoleSession } from './ConsoleShell';
import { DataState, Field, Heading } from './primitives';
import { StartHistoricalScan } from './HistoricalScans';
import { cleanupSummary } from '../../lib/pulse-console.mjs';

export function PreparationList() {
  const [after,setAfter]=useState(''),[history,setHistory]=useState([]);
  const preparations=useConsoleData('reference-preparations'+(after?'?after='+encodeURIComponent(after):''),5000);
  return <><Heading eyebrow="Pulse references" title="Reference preparations" action={<Link className="cc-button cc-primary" href="/console/report/pulse">Prepare reference</Link>}/><DataState resource={preparations}>{data=><section className="cc-panel cc-panel-body">
    {data.items.length===0 && <p>No reference preparations on this page.</p>}
    {data.items.map(row=><div className="cc-row" key={row.preparation_id}><Link href={'/console/references/'+row.preparation_id}>{row.case_id}</Link><span>{row.status}</span></div>)}
    <div className="cc-actions"><button className="cc-button cc-secondary" disabled={!history.length} onClick={()=>{setAfter(history.at(-1));setHistory(history.slice(0,-1));}}>Previous preparations</button><button className="cc-button cc-secondary" disabled={!data.next_cursor} onClick={()=>{setHistory([...history,after]);setAfter(data.next_cursor);}}>Next preparations</button></div>
  </section>}</DataState></>;
}

export function PreparationDetail({ id }) {
  const preparation = useConsoleData(`reference-preparations/${id}`, 5000);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function cancel() {
    if (!window.confirm('Cancel this reference preparation? Accepted work will be fenced and cleaned up.')) return;
    setBusy(true); setError('');
    try { await consoleRequest(`reference-preparations/${id}/cancel`, { method: 'POST', body: {} }); preparation.reload(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <><Heading eyebrow="Pulse reference" title="Reference preparation"/><DataState resource={preparation}>{row => <section className="cc-panel cc-panel-body">
    <h2>{row.case_id}</h2><p role="status">Status: {row.status}</p>
    {row.cleanup_status && <p>{cleanupSummary(row)}</p>}
    {row.status === 'queued' && <p>Queued for your connector and approved compute allowance. Corvinth starts preparation automatically when both are available. You can leave this page; submitting again is not needed.</p>}
    {row.status === 'bound' && <p>Corvinth is starting secure compute. Your connector will deliver the image when it is ready.</p>}
    {row.status === 'accepted' && <p>Preparing and saving your reference. Corvinth reconciles uncertain responses automatically.</p>}
    {row.status === 'completed' && <><p>The raw reference and derived index have been verified. Similarity results remain review-only while calibration is pending.</p><Link href={`/console/cases/pulse/${encodeURIComponent(row.complaint_id)}`}>Open reported case</Link></>}
    {['failed','cancelled'].includes(row.status) && <p className="cc-note">This intent remains {row.status}. {row.failure_code || 'Inspect the operation with Corvinth support.'} A new explicit report is required for another attempt.</p>}
    <p className="cc-help">Reference preparation and library scanning use separate approved compute allowances. Corvinth handles shutdown automatically.</p>
    {!['completed','failed','cancelled'].includes(row.status) && <button className="cc-button cc-secondary" onClick={cancel} disabled={busy}>Cancel preparation</button>}
    {error && <p role="alert" className="cc-error">{error}</p>}
  </section>}</DataState>{preparation.data?.status === 'completed' && <StartHistoricalScan complaintId={preparation.data.complaint_id}/>}</>;
}

export default function ReferencePreparation() {
  const setup = useConsoleData('pulse-setup'), session = useConsoleSession(), router = useRouter();
  const [selected,setSelected] = useState(''), [busy,setBusy] = useState(false), [error,setError] = useState('');
  const intent = useRef(null);
  async function submit(e) {
    e.preventDefault();setBusy(true);setError('');
    const form=new FormData(e.currentTarget), row=setup.data.integrations.find(r=>r.id===selected)||setup.data.integrations.find(r=>r.pulse_eligible);
    const body={case_id:form.get('case_id'),storage_integration_id:row.id,
      storage_reference:{type:'storage_object',storage_provider:'s3',storage_bucket:row.storage_bucket,
        object_key:form.get('object_key'),object_version:row.version_policy==='versioned'?form.get('object_version'):null}};
    if(form.get('platform_case_reference'))body.platform_case_reference=form.get('platform_case_reference');
    const signature=JSON.stringify(body), key=`corvinth:reference-intent:${session.platform_id}`;
    try {
      if(!intent.current)try { intent.current=JSON.parse(sessionStorage.getItem(key)); } catch { /* no prior intent */ }
      if(!intent.current || intent.current.signature!==signature)intent.current={signature,request_id:crypto.randomUUID()};
      sessionStorage.setItem(key,JSON.stringify(intent.current));
      const result=await consoleRequest('reference-preparations',{method:'POST',body:{...body,request_id:intent.current.request_id}});
      router.push(`/console/references/${result.preparation_id}`);
    } catch(e) {setError(e.message);}
    finally {setBusy(false);}
  }
  return <><Heading eyebrow="Confirmed-content intake" title="Prepare a Pulse reference" action={<Link href="/console/references" className="cc-button cc-secondary">Existing preparations</Link>}>Use an exact object in your approved S3 integration. No presigned URL or GPU token needs to be copied. To reuse a prepared reference, open its reported case.</Heading><DataState resource={setup}>{data=>{
    const rows=data.integrations.filter(r=>r.pulse_eligible),row=rows.find(r=>r.id===selected)||rows[0];
    if(!row)return <section className="cc-panel cc-panel-body"><p>An approved Pulse storage integration is required.</p><Link href="/console/integration">Set up the customer connector</Link></section>;
    return <section className="cc-panel"><form className="cc-form" onSubmit={submit}><fieldset disabled={busy||!session.permissions.pulse_report} style={{border:0,minWidth:0}}>
      <Field label="Your case reference"><input name="case_id" required maxLength={200}/></Field>
      <Field label="Additional platform reference (optional)"><input name="platform_case_reference" maxLength={500}/></Field>
      <Field label="Approved S3 integration"><select value={row.id} onChange={e=>setSelected(e.target.value)}>{rows.map(r=><option key={r.id} value={r.id}>{r.storage_bucket} · {r.approved_prefix || '(whole bucket)'}</option>)}</select></Field>
      <Field label="Exact object key" hint={`Must be inside the approved prefix: ${row.approved_prefix || '(whole bucket)'}. Upload the reference using your existing customer storage workflow.`}><input name="object_key" required maxLength={1024} autoComplete="off"/></Field>
      {row.version_policy==='versioned' && <Field label="S3 version ID" hint="Use the exact version shown in your S3 object details. The connector signs that version; Corvinth checks the fetched version."><input name="object_version" required maxLength={1024} autoComplete="off"/></Field>}
      <label className="cc-help"><input type="checkbox" required/> I confirm this reference has been reviewed and approved for reporting by my platform.</label>
      <p className="cc-note">{row.connector_status?.reference_preparation_supported ? 'Your connector supports reference preparation.' : 'Install or update the customer connector before processing can start.'} Compute runs only with an approved allowance. Results remain calibration_pending and review-only.</p>
    </fieldset>{error&&<p role="alert" className="cc-error">{error}</p>}<div className="cc-form-footer"><Link href="/console/integration">Connector setup</Link><button className="cc-button cc-primary" disabled={busy||!session.permissions.pulse_report}>{busy?'Registering intent…':'Prepare reference'}</button></div></form></section>;
  }}</DataState></>;
}
