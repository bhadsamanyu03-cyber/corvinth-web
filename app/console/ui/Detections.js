'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useConsoleData, query, date, label } from './data';
import { Heading, Badge, DataState, Empty, Pagination, Field } from './primitives';

export function actionStatus(item) {
  if (item.state === 'CONFIRMED') return 'Removal confirmed';
  if (item.state === 'WITHDRAWN') return 'Case withdrawn';
  if (['AUTO_RESOLVED', 'AUTO_RESOLVED_NO_PLATFORM'].includes(item.state)) return label(item.state);
  if (item.action_taken === 'content_removed') return 'Removal requested';
  return label(item.action_taken);
}

export function StorageReference({ reference }) {
  if (!reference) return 'No storage reference recorded';
  return <span className="cc-object-reference"><strong>{reference.object_key}</strong><small>{reference.storage_bucket} · {reference.object_version == null ? 'Immutable key' : `Version: ${reference.object_version}`}</small></span>;
}

export function MatchedReference({ reference, legacy }) {
  if (reference?.type === 'storage_object') return <StorageReference reference={reference}/>;
  if (reference?.type === 'confirmed_hash') return <span>{reference.confirmation_key}<small>PDQ · {reference.matched_lane}</small></span>;
  if (reference?.type === 'complaint') return <span>{reference.complaint_id}<small>Pulse complaint</small></span>;
  return legacy || 'No matched reference recorded';
}

export default function Detections() {
  const [classification, setClassification] = useState('');
  const [state, setState] = useState('');
  const [skip, setSkip] = useState(0);
  const resource = useConsoleData(`detections?${query({ classification: classification || undefined, state: state || undefined, skip })}`, 15000);
  return <>
    <Heading eyebrow="Detection inbox" title="Detections" action={<button className="cc-button cc-secondary" onClick={resource.reload}>Refresh</button>}>
      Review detected content, follow the evidence, and record your platform’s action.
    </Heading>
    <section className="cc-panel">
      <div className="cc-detection-filters">
        <Field label="Classification"><select value={classification} onChange={event => { setClassification(event.target.value); setSkip(0); }}>
          <option value="">All detections</option>{['EXACT', 'FUZZY', 'NEAR_MISS'].map(value => <option key={value} value={value}>{label(value)}</option>)}
        </select></Field>
        <Field label="Case state"><select value={state} onChange={event => { setState(event.target.value); setSkip(0); }}>
          <option value="">All states</option>{['RECEIVED', 'MATCHED', 'SHADOW_QUARANTINED', 'APPEALED', 'UPLOADER_ACKNOWLEDGED', 'CONFIRMED', 'WITHDRAWN', 'AUTO_RESOLVED', 'AUTO_RESOLVED_NO_PLATFORM'].map(value => <option key={value} value={value}>{label(value)}</option>)}
        </select></Field>
        <p className="cc-help">Newest first · Refreshes every 15 seconds.<br/>New detections appear once case processing completes.</p>
      </div>
      <DataState resource={resource}>{data => <>
        {data.items.length ? <div className="cc-table-wrap"><table className="cc-detections-table">
          <thead><tr><th>Content / case</th><th>Classification</th><th>Case state</th><th>Detected</th><th>Action status</th></tr></thead>
          <tbody>{data.items.map(item => <tr key={item.case_uuid}>
            <td><Link href={`/console/detections/${encodeURIComponent(item.case_uuid)}`}>{item.action_reference?.object_key || item.platform_content_id || item.client_reference_id || item.case_uuid} ↗</Link>
              {item.action_reference && <small>{item.action_reference.storage_bucket} · {item.action_reference.object_version == null ? 'Immutable key' : `Version: ${item.action_reference.object_version}`}</small>}
              {!item.action_reference && <small>No storage reference recorded</small>}
              <small>{item.case_uuid}</small>
            </td>
            <td><Badge value={item.classification}/></td><td><Badge value={item.state}/></td>
            <td>{date(item.created_at)}</td><td>{actionStatus(item)}</td>
          </tr>)}</tbody>
        </table></div> : <Empty title="No detections in this view" icon="shield">New cases appear automatically. Try changing the filters or refresh after processing completes.</Empty>}
        <Pagination skip={skip} next={data.next_skip} onChange={setSkip}/>
      </>}</DataState>
    </section>
  </>;
}
