'use client';

import Link from 'next/link';
import { API_CATALOG } from '../../lib/console-catalog.mjs';
import { useConsoleData } from './data';
import { Heading, Icon, DataState } from './primitives';

export function ApiHub() {
  return <><Heading eyebrow="Developer workspace" title="API Reference">Choose a detection system to explore its customer-facing endpoints and current schemas.</Heading><div className="cc-api-choices"><Link href="/console/api/pdq" className="cc-panel cc-api-choice"><div className="cc-icon-tile"><Icon name="shield"/></div><h2>PDQ</h2><p>Confirmed image references, detection case lifecycles, and auditable actions.</p><span>Explore 7 endpoints →</span></Link><Link href="/console/api/pulse" className="cc-panel cc-api-choice"><div className="cc-icon-tile"><Icon name="pulse"/></div><h2>DINOv2 / Pulse</h2><p>Semantic image reports, platform libraries, and storage backfills.</p><span>Explore 15 endpoints →</span></Link></div></>;
}
function SchemaBlock({ title, value, empty }) {
  return <section><h3>{title}</h3>{value && Object.keys(value).length ? <pre className="cc-schema">{JSON.stringify(value, null, 2)}</pre> : <p className="cc-help" style={{ margin: '12px 0 25px' }}>{empty}</p>}</section>;
}
export default function ApiReference({ family, endpointId }) {
  const entries = API_CATALOG[family];
  const current = entries.find(entry => entry.id === endpointId) || entries[0];
  const schema = useConsoleData(`schema/${family}`);
  const groups = [...new Set(entries.map(entry => entry.group))];
  return <><Heading eyebrow="API Reference" title={family === 'pdq' ? 'PDQ' : 'DINOv2 / Pulse'} action={<Link href="/console/api" className="cc-button cc-secondary">← API hub</Link>}>Browse by task. Schemas are read from the connected backend.</Heading><div className="cc-reference-grid"><nav className="cc-panel cc-endpoint-nav" aria-label="API endpoints">{groups.map(group => <div key={group}><h3>{group}</h3>{entries.filter(entry => entry.group === group).map(entry => <Link key={entry.id} href={`/console/api/${family}/${entry.id}`} aria-current={entry.id === current.id ? 'page' : undefined}><span className="cc-method" data-method={entry.method}>{entry.method}</span><span>{entry.title}</span></Link>)}</div>)}</nav><section className="cc-panel cc-panel-body"><p className="cc-eyebrow">{current.group}</p><h2 style={{ marginTop: 12 }}>{current.title}</h2><div className="cc-endpoint-path"><span className="cc-badge">{current.method}</span><code>{current.path}</code></div><p className="cc-help" style={{ marginBottom: 27 }}>{current.purpose}</p><DataState resource={schema}>{data => {
    const operation = data.paths[current.path]?.[current.method.toLowerCase()];
    if (!operation) return <p className="cc-note">This approved endpoint is absent from the connected backend’s OpenAPI schema. Its contract cannot be displayed.</p>;
    const responseSchemas = Object.fromEntries(Object.entries(operation.responses || {}).filter(([status]) => status.startsWith('2')));
    const errorSchemas = Object.fromEntries(Object.entries(operation.responses || {}).filter(([status]) => !status.startsWith('2')));
    return <><SchemaBlock title="Path & query parameters" value={operation.parameters} empty="No path or query parameters declared."/><SchemaBlock title="Request body" value={operation.requestBody} empty="No request body declared."/><SchemaBlock title="Success response" value={responseSchemas} empty="No typed response declared by this backend."/><p className="cc-help" style={{ marginBottom: 25 }}>An empty schema means the backend has not declared a typed contract for that response. It does not mean the response has no fields.</p><SchemaBlock title="Declared errors" value={errorSchemas} empty="No error schemas declared."/><p className="cc-help">Runtime permission, configuration, conflict, and availability errors may not be enumerated in OpenAPI.</p><details style={{ marginTop: 24 }}><summary>Referenced data models</summary><SchemaBlock title="OpenAPI components" value={data.components?.schemas} empty="No referenced models."/></details></>;
  }}</DataState></section></div></>;
}
