'use client';

import { useState } from 'react';
import { useConsoleSession } from './ConsoleShell';
import { useConsoleData } from './data';
import { DataState, Field } from './primitives';
import { connectionReadiness } from '../../lib/pulse-console.mjs';

const BUNDLE = 'd4aca6221eadff56e906f0bb41db5820cb126eed973ed38943d1beca78206a07';
const DOWNLOAD = '/downloads/pulse-connector/v3';
function download(name, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)+'\n'], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function PulseConnector() {
  const setup = useConsoleData('pulse-setup', 10000);
  const session = useConsoleSession();
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  function configuration(row) {
    try {
      // One customer installation identity survives downloads, reloads and upgrades.
      const key = `corvinth:pulse-connector:${session.platform_id}:${row.id}`;
      let id = localStorage.getItem(key);
      if (!/^[0-9a-f-]{36}$/i.test(id || '')) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
      download('pulse-config.json', { api_origin: setup.data.api_origin, platform_id: session.platform_id,
        region: row.bucket_region, journal_root: '/var/lib/corvinth-pulse', integration_id: row.id,
        prefix: row.approved_prefix, connector_id: id });
      setError('');
    } catch { setError('The browser could not retain the connector identity. Allow local storage before downloading configuration.'); }
  }
  return <section className="cc-panel cc-panel-body"><h2>Pulse customer connector</h2><p className="cc-help">Install once on your customer-owned Linux x86_64 host with Python 3.12, systemd and persistent disk. It discovers requested scans and delivers images automatically. Your S3 credentials remain on your host.</p><DataState resource={setup}>{data => {
    const integrations = data.integrations.filter(row => row.pulse_eligible);
    const row = integrations.find(item => item.id === selected) || integrations[0];
    if (!row) return <p className="cc-note">An active, approved Pulse storage integration is required. Existing storage authority is not changed by this installer.</p>;
    return <><Field label="Connector library"><select value={row.id} onChange={event => setSelected(event.target.value)}>{integrations.map(item => <option key={item.id} value={item.id}>{item.storage_bucket} · {item.approved_prefix || '(whole bucket)'}</option>)}</select></Field>
      <p role="status" className="cc-note">{row.connector_status?.connected ? 'Connector connected. Last contact: '+new Date(row.connector_status.last_seen_at).toLocaleString() : 'Connector has not checked in within the last two minutes.'}{row.connector_status?.multiple_installations ? ' Multiple installations are reporting for this scope; stop the duplicate installation before new work.' : ''}</p>
      {connectionReadiness(row).state === 'connected' && <p className="cc-help">Your connector is connected and supports reference preparation. Start future scans from Pulse; leave this service running so it can discover work automatically.</p>}
      <details key={row.id+':'+connectionReadiness(row).state} open={connectionReadiness(row).state !== 'connected'}><summary>{connectionReadiness(row).state === 'connected' ? 'Installation and recovery details' : 'One-time connector installation'}</summary>
      <ol className="cc-setup-steps"><li><strong>Prepare access.</strong> Attach the scoped S3 policy to the host’s AWS role. Have your platform integration API credential available; the dashboard credential cannot run a connector.</li>
      <li><strong>Download the installation files.</strong> Keep the configuration and durable journal with this installation. Do not clone a running connector identity onto a second host.</li>
      <li><strong>Install on your host.</strong> Run the command below. The installer prompts securely for the integration credential, verifies the pinned bundle, installs offline dependencies and starts the restricted systemd service.</li></ol>
      <div className="cc-actions"><button className="cc-button cc-secondary" onClick={() => configuration(row)}>Download configuration</button><button className="cc-button cc-secondary" onClick={() => download('pulse-s3-policy.json', { Version: '2012-10-17', Statement: [
        { Effect: 'Allow', Action: ['s3:GetBucketVersioning'], Resource: `arn:aws:s3:::${row.storage_bucket}` },
        { Effect: 'Allow', Action: ['s3:ListBucket', 's3:ListBucketVersions'], Resource: `arn:aws:s3:::${row.storage_bucket}`, Condition: { StringLike: { 's3:prefix': [row.approved_prefix, `${row.approved_prefix}*`] } } },
        { Effect: 'Allow', Action: ['s3:GetObject', 's3:GetObjectVersion'], Resource: `arn:aws:s3:::${row.storage_bucket}/${row.approved_prefix}*` },
      ] })}>Download S3 policy</button>
      <a className="cc-button cc-secondary" href={`${DOWNLOAD}/install.py`} download>Download installer</a><a className="cc-button cc-secondary" href={`${DOWNLOAD}/connector.tar`} download>Download connector bundle</a></div>
      <pre className="cc-code"><code>sudo python3.12 install.py --config pulse-config.json --bundle connector.tar</code></pre>
      <p className="cc-help">Bundle SHA-256: <code className="cc-break">{BUNDLE}</code>. Verify local service health with <code>systemctl status corvinth-pulse-connector</code>. Logs: <code>journalctl -u corvinth-pulse-connector</code>. Stop it with <code>sudo systemctl stop corvinth-pulse-connector</code>; retain its journal for recovery.</p>
      <p className="cc-note">Installation validates registered scope, listing and available sample metadata. It does not grant GPU budget or prove a full image fetch. For SSE-KMS images, the host role also needs access to the customer encryption key. Start a scan from its complaint to observe connector discovery and application progress. Customer host costs are separate from Corvinth’s GPU allowance.</p>
      {error && <p className="cc-error" role="alert">{error}</p>}</details></>;
  }}</DataState></section>;
}
