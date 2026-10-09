'use client';

import Link from 'next/link';
import ReferencePreparation from './ReferencePreparation';
import { useState } from 'react';
import { reportHref } from '../../lib/console-catalog.mjs';
import { consoleRequest, useConsoleData } from './data';
import { useConsoleSession } from './ConsoleShell';
import { Heading, Field, Icon } from './primitives';

export default function ReportForm({ kind }) {
  const session = useConsoleSession();
  const overview = useConsoleData('overview');
  const [mode, setMode] = useState('url');
  const [precomputed, setPrecomputed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const permitted = kind === 'pdq' ? session.permissions.pdq_report : session.permissions.pulse_report;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const body = { mode, case_id: form.get('case_id') };
      if (mode === 'url') body.presigned_url = form.get('presigned_url');
      if (kind === 'pulse' && form.get('platform_case_reference')) body.platform_case_reference = form.get('platform_case_reference');
      if (mode === 'hashes') {
        body.pdq_dihedral_hashes = form.get('hashes').trim().split(/\s+/);
        if (form.get('normalized').trim()) body.pdq_dihedral_hashes_normalized = form.get('normalized').trim().split(/\s+/);
      }
      if (mode === 'vector') {
        const file = form.get('vector');
        if (!file?.size || file.size > 64000) throw new Error('Choose a text file smaller than 64 KB with 384 numbers.');
        const values = (await file.text()).trim().split(/[\s,]+/);
        const numbers = values.map(Number);
        if (numbers.length !== 384 || numbers.some(value => !Number.isFinite(value))) throw new Error('The embedding file must contain exactly 384 finite numbers, separated by commas or whitespace.');
        body.dino_vector = numbers;
      }
      const data = await consoleRequest(`report/${kind}`, { method: 'POST', body });
      setResult({ ...data, submitted_case: body.case_id });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  if (kind === 'pulse' && !precomputed) return <><ReferencePreparation/>{overview.data?.permissions.pulse_vector && <div className="cc-panel cc-panel-body"><button className="cc-button cc-secondary" onClick={()=>{setMode('vector');setPrecomputed(true);}}>Use existing Enterprise vector intake</button><p className="cc-help">The existing vector contract remains separate from AWS reference preparation.</p></div>}</>;
  if (result) {
    const reference = kind === 'pdq' ? result.hash_set_id : result.complaint_id;
    return <><Heading eyebrow="Report submitted" title={kind === 'pdq' && result.status === 'duplicate' ? 'This reference is already registered.' : 'Your report is registered.'}>{result.submitted_case}</Heading><section className="cc-panel cc-panel-body"><p>{kind === 'pdq' ? `${result.hashes_stored} reference hashes registered by this request.` : result.vector_stored ? 'The complaint vector has been stored.' : 'Inspect the report for its current processing state.'}</p><div className="cc-actions"><Link className="cc-button cc-primary" href={reportHref(kind, reference)}>Open reported case <Icon name="arrow"/></Link><Link className="cc-button cc-secondary" href={`${reportHref(kind, reference)}/matches`}>Inspect recorded matches</Link><button className="cc-text-button" onClick={() => setResult(null)}>Report another image</button></div>{kind === 'pulse' && <div style={{ marginTop: 30 }}><h2>Matches returned with this report: {result.backfill_matches?.length ?? 0}</h2><p className="cc-help" style={{ marginTop: 10 }}>Initial library results, capped by the backend at 50. Scan results arrive separately.{mode === 'vector' ? ' Vector-mode initial results are not persisted by the current backend; this response remains visible until you leave this screen.' : ''}</p>{result.backfill_matches?.length > 0 && <details style={{ marginTop: 20 }}><summary>View returned matches</summary>{result.backfill_matches.map((match, i) => <div className="cc-row" key={`${match.platform_content_id}:${i}`}><strong>{match.platform_content_id}</strong><span>Similarity {Number(match.similarity).toFixed(4)}</span></div>)}</details>}</div>}</section></>;
  }
  return <><Heading eyebrow="Confirmed-content intake" title={kind === 'pdq' ? 'Report for PDQ' : 'Report with DINOv2 / Pulse'} action={<Link href="/console" className="cc-button cc-secondary">← Overview</Link>}>Register a reference your platform has reviewed and confirmed.</Heading><div className="cc-form-layout"><section className="cc-panel"><form className="cc-form" onSubmit={submit}><h2>Reference details</h2>{kind === 'pulse' && <p className="cc-note">Historical AWS scans require an already-prepared Pulse reference. This form cannot start reference GPU preparation; URL submission requires separate activation authority. <Link href="/console/scans/new">Choose an existing complaint</Link> to scan a library. Results remain review-only while calibration is pending.</p>}<p>The case reference connects this report to your platform’s own workflow.</p>{!permitted && <p className="cc-note">Your platform does not currently have permission to submit {kind === 'pdq' ? 'PDQ' : 'Pulse'} reports. Contact Corvinth to enable access.</p>}<fieldset disabled={busy || !permitted} style={{ border: 0, minWidth: 0 }}><Field label="Your case reference" hint="Use a stable reference from your platform’s case system."><input name="case_id" required maxLength={200} placeholder="e.g. your internal report ID"/></Field>{kind === 'pulse' && <Field label="Additional platform reference (optional)"><input name="platform_case_reference" maxLength={500} placeholder="A reference meaningful to your team"/></Field>}<Field label="Reference input"><select value={mode} onChange={event => { setMode(event.target.value); setError(''); }}>{kind === 'pdq' && <option value="url">Image URL · Corvinth computes the reference</option>}{kind === 'pdq' ? <option value="hashes">Precomputed PDQ hashes · Mode B</option> : overview.data?.permissions.pulse_vector && <option value="vector">Precomputed embedding file · Enterprise</option>}</select></Field>{mode === 'url' && <Field label="Presigned image URL" hint="Use a fresh HTTPS URL from supported S3, CloudFront, Google Cloud Storage, or Azure Blob storage. The backend validates and fetches the image."><input type="url" name="presigned_url" required maxLength={16384} autoComplete="off" placeholder="https://…"/></Field>}{mode === 'hashes' && <><Field label="Standard PDQ variants" hint="Eight hexadecimal hashes, one per line. Put the original image hash first."><textarea name="hashes" rows={8} required spellCheck={false} autoComplete="off" placeholder="64-character hexadecimal hash per line"/></Field><Field label="Normalized PDQ variants (optional)" hint="If available, supply all eight normalized variants, original first."><textarea name="normalized" rows={4} spellCheck={false} autoComplete="off"/></Field></>}{mode === 'vector' && <Field label="DINOv2 embedding" hint="A .txt or .csv file with exactly 384 numbers. Enterprise permission is checked by the backend."><input name="vector" type="file" accept=".txt,.csv,text/plain,text/csv" required/></Field>}<label className="cc-help" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 25 }}><input type="checkbox" required style={{ marginTop: 4 }}/>I confirm this reference has been reviewed and is approved for reporting by my platform.</label></fieldset>{error && <p className="cc-error" role="alert">{error}</p>}<div className="cc-form-footer"><Link href="/console/cases" className="cc-text-button">View reported cases</Link><button disabled={busy || !permitted} className="cc-button cc-primary">{busy ? 'Registering reference…' : 'Register report'}<Icon name="arrow"/></button></div></form></section><aside className="cc-explainer"><h3>What happens next</h3><ol><li>Corvinth registers the confirmed reference.</li><li>Your report appears in Reported cases.</li><li>Open the report to inspect its lifecycle and available matches.</li></ol><p style={{ marginTop: 25 }}>Reporting a reference does not confirm that your platform has removed any matched content.</p><p>Large scans run separately. You can inspect their progress in Scan jobs.</p><Link href={`/console/api/${kind}`} className="cc-text-button">Read the {kind === 'pdq' ? 'PDQ' : 'Pulse'} API contract ↗</Link></aside></div></>;
}
