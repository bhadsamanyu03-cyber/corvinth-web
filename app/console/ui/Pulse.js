'use client';

import Link from 'next/link';
import { useConsoleSession } from './ConsoleShell';
import { useConsoleData, date } from './data';
import { Badge, DataState, Heading } from './primitives';
import { connectionReadiness, reviewNotice, scanHref, scanSummary } from '../../lib/pulse-console.mjs';

export default function Pulse() {
  const session = useConsoleSession();
  const setup = useConsoleData('pulse-setup', 30000);
  const scans = useConsoleData('jobs?kind=logical&limit=5', 15000);
  const references = useConsoleData('reference-preparations', 15000);
  return <><Heading eyebrow="Pulse" title="Semantic matching">Choose a reviewed reference and scan your historical library. Corvinth handles discovery, reusable embeddings, execution and cleanup.</Heading>
    <p className="cc-note">{reviewNotice}</p>
    <div className="cc-stack"><section className="cc-panel cc-panel-body"><h2>Your libraries</h2><DataState resource={setup}>{data => <>
      {!data.integrations.length && <p>No library has been approved yet. <Link href="/console/integration">Complete one-time onboarding</Link> to connect your storage.</p>}
      {data.integrations.map(row => { const readiness = connectionReadiness(row); return <div className="cc-row" key={row.id}>
        <div><strong>{row.storage_bucket}</strong><small>{row.approved_prefix || 'Whole bucket'}</small><p>{readiness.title}</p><p className="cc-help">{readiness.detail}</p></div>
        {readiness.state !== 'connected' && <Link className="cc-button cc-secondary" href="/console/integration">Connection setup</Link>}
      </div>; })}
      {data.enabled && <><p className="cc-help">Once onboarding and your compute allowance are approved, no batch management, endpoint configuration or infrastructure permissions are needed for each scan.</p>
        <div className="cc-actions"><Link className="cc-button cc-primary" href="/console/scans/new">Scan historical library</Link>
          {session.permissions.pulse_report && <Link className="cc-button cc-secondary" href="/console/report/pulse">Prepare a new reference</Link>}</div>
        <p className="cc-help">Current limit: {data.member_limit.toLocaleString()} captured objects per scan. Larger libraries are not yet supported. Reference preparation and compute-needed scanning use separate approved activations.</p></>}
    </>}</DataState></section>
    <section className="cc-panel"><div className="cc-panel-head"><h2>Recent scans</h2><Link href="/console/scans">All scans and results ↗</Link></div><DataState resource={scans}>{data => <>
      {!data.items.length && <p className="cc-panel-body">Your scans will appear here. You can close the dashboard while Corvinth works.</p>}
      {data.items.map(scan => <div className="cc-row" key={scan.scan_id}><div><strong>{scanSummary(scan).complete ? 'Results available' : 'Historical library scan'}</strong><Badge value={scan.status}/><small>{scan.counts.completed} completed · {scan.counts.failed} failed · {date(scan.created_at)}</small></div><Link className="cc-button cc-secondary" href={scanHref(scan.scan_id)}>{scanSummary(scan).complete ? 'Review results' : 'View progress'}</Link></div>)}
    </>}</DataState></section>
    <section className="cc-panel"><div className="cc-panel-head"><h2>Recent reference preparations</h2><Link href="/console/references">All preparations ↗</Link></div><DataState resource={references}>{data => <>
      {!data.items.length && <p className="cc-panel-body">Prepare a reference image or choose an existing reported case to start.</p>}
      {data.items.slice(0,5).map(row => <div className="cc-row" key={row.preparation_id}><div><strong>{row.case_id}</strong><Badge value={row.status}/></div><Link className="cc-button cc-secondary" href={'/console/references/'+row.preparation_id}>{row.status === 'completed' ? 'Scan with this reference' : 'View preparation'}</Link></div>)}
    </>}</DataState></section></div>
    <p className="cc-help">To check your library again, open the completed scan and select Rescan library. Each rescan is a new explicit request; compatible embeddings remain reusable. Calendar scheduling is not enabled.</p>
  </>;
}
