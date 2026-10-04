'use client';

import { useState } from 'react';
import Link from 'next/link';
import DemoWorkspace from '../components/DemoWorkspace';
import { createFixture } from './fixture.mjs';
import styles from './Preview.module.css';

export default function Preview() {
  const [adapter] = useState(() => createFixture({ classification: 'EXACT', failure: '', delay: 700 }));
  return <>
    <div className={styles.controls}>
      <p>Development preview · Neutral asset slots and simulated replies. No live requests.</p>
      <label>Next classification<select defaultValue="EXACT" onChange={(event) => adapter.configure({ classification: event.target.value })}>
        {['EXACT', 'FUZZY', 'NEAR_MISS', 'CLEAN'].map((item) => <option key={item}>{item}</option>)}
      </select></label>
      <label>Next execution<select onChange={(event) => adapter.configure({ failure: event.target.value })}><option value="">Success fixture</option><option value="demo_unavailable">Request failed</option><option value="demo_session_invalid">Session expired</option></select></label>
      <label>Response delay<select defaultValue="700" onChange={(event) => adapter.configure({ delay: Number(event.target.value) })}><option value="700">700 ms</option><option value="6000">6 seconds</option></select></label>
      <label>Token request reply<select onChange={(event) => adapter.configure({ requestFailure: event.target.value })}><option value="">Accepted fixture</option><option value="demo_request_unconfirmed">Unconfirmed</option><option value="demo_request_unavailable">Unavailable</option></select></label>
      <button onClick={() => adapter.expire()}>Expire session on next status check</button>
      <Link href="/">Back to homepage</Link>
    </div>
    <DemoWorkspace adapter={adapter} requests={adapter.tokenRequests} development />
  </>;
}
