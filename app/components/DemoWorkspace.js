'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { liveDemoClient } from '../lib/demo-client.mjs';
import DemoAccess from './DemoAccess';
import DemoImageWorkspace, { AssetImage } from './DemoImageWorkspace';
import DemoResult from './DemoResult';
import useDemo from './useDemo';
import styles from './DemoWorkspace.module.css';

const messages = {
  demo_token_invalid: 'This invitation isn’t valid, has expired, or has reached its limit. Check the token you received.',
  demo_session_invalid: 'Your demo access has ended. Enter your token to continue.',
  demo_rate_limited: 'You’ve reached the demo limit. Please try again later.',
  demo_invalid_request: 'Please check your selection and try again.',
  demo_origin_rejected: 'Demo access is unavailable from this page address.',
  demo_unavailable: 'We couldn’t complete that request. Please try again.',
  demo_invalid_response: 'We couldn’t confirm that response. Please try again.',
  demo_execution_unavailable: 'Image checks aren’t available right now. No check was completed.',
  demo_busy: 'Another demo check is running. Please try again shortly.',
  demo_operation_pending: 'Your request is still processing. Please try again shortly.',
  demo_operation_conflict: 'This request no longer matches your current selection. Reload your demo to continue.',
  demo_reference_conflict: 'Your active reference has changed. Reload your demo to continue.',
  demo_run_limit: 'You’ve used your demo allowance. You can still reset or exit the demo.',
  demo_input_expired: 'This image input has expired. Try again to use a fresh input.',
};
const modes = [
  { id: 'managed', label: 'Managed compute', text: 'Corvinth fetches the selected image through a short-lived presigned URL and computes the matching signals.' },
  { id: 'customer', label: 'Customer compute', text: 'Your platform computes the image hashes locally with the Corvinth SDK. Only the derived hashes reach Corvinth.' },
];
const modeName = (mode) => modes.find((item) => item.id === mode)?.label;

function ModeChoice({ mode, disabled, choose }) {
  return <div className={styles.modes} role="group" aria-label="Compute mode">
    {modes.map((item) => <button key={item.id} id={'demo-mode-' + item.id} className={styles.mode}
      aria-pressed={mode === item.id} disabled={disabled} onClick={() => { if (mode !== item.id) choose(item.id); }}>
      <span className={styles.modeIcon} aria-hidden="true"><svg viewBox="0 0 32 32" fill="none">{item.id === 'managed'
        ? <><path d="M9 14H8C2 14 2 6 8 6h1C10 0 20 0 22 7h2c5 0 5 7 0 7h-1" /><rect x="4" y="17" width="24" height="11" rx="2" /><path d="M8 22h2m4 0h2m4 0h4" /></>
        : <><rect x="6" y="5" width="20" height="18" rx="2" /><path d="M3 27h26l-3-4H6l-3 4Z" /></>}</svg></span>
      <span className={styles.modeLabel}><span className={styles.choiceMark} aria-hidden="true">{mode === item.id ? '✓' : ''}</span>{item.label}</span>
      <span className={styles.modeDescription}>{item.text}</span>
    </button>)}
  </div>;
}

function Progress({ stage }) {
  const current = ['mode', 'reference', 'upload', 'result'].indexOf(stage);
  return <ol className={styles.progress} aria-label="Demo progress">
    {['Choose compute', 'Report an image', 'Try an upload', 'Result'].map((name, index) =>
      <li key={name} aria-current={current === index ? 'step' : undefined} data-complete={current > index}>
        <span aria-hidden="true">{current > index ? '✓' : String(index + 1).padStart(2, '0')}</span>{name}
      </li>)}
  </ol>;
}

export default function DemoWorkspace({ adapter = liveDemoClient, requests, development = false }) {
  const router = useRouter();
  const demo = useDemo(adapter, { autoOpen: true });
  const { state } = demo;
  const heading = useRef(null);
  const busy = Boolean(state.pending && !state.pending.silent);
  const { stage, reference, session } = state;
  // Only the guarded development route can render selectable neutral test assets.
  const neutral = development && process.env.NODE_ENV === 'development';
  const selecting = stage === 'reference' || stage === 'upload';

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [stage]);

  async function exitDemo() {
    if (await demo.end()) router.replace('/#demo');
  }

  return <div className={styles.shell} data-demo-shell>
    <header className={styles.shellHeader}>
      <Link className={styles.brand} href="/" aria-label="Corvinth home"><svg viewBox="0 0 40 44" aria-hidden="true"><path d="M20 1 38 11v8l-9 4v-7l-9-5-10 6v10l10 6 9-5v-6l9 4v7L20 43 2 33V11L20 1Z" /></svg><span>Corvinth</span></Link>
      <span className={styles.shellLabel}>Live demo</span>
      <div className={styles.headerActions}>
        {session && <span className={styles.allowance} title="Only checked images use runs. Reporting and resetting a reference are free." aria-live="polite"><strong>{session.runs_remaining}</strong> runs remaining</span>}
        {session ? <button className={styles.exit} disabled={Boolean(state.pending)} onClick={exitDemo}>{state.pending?.operation === 'end' ? 'Leaving…' : 'Exit demo'} <span aria-hidden="true">↗</span></button>
          : <Link className={styles.exit} href="/#demo">Back to Corvinth</Link>}
      </div>
    </header>
    <main className={styles.demo}>
      {stage === 'checking' ? <div className={styles.access}><h1>{state.error ? 'Let’s try that again.' : 'Opening your demo…'}</h1>
        {state.error ? <div className={styles.error} role="alert"><p>{messages[state.error] || messages.demo_unavailable}</p><button className={styles.textButton} onClick={demo.retrySession} disabled={busy}>Try again</button></div> : <p role="status">Checking your invitation.</p>}</div>
      : !session ? <div className={styles.access}><p className={styles.eyebrow}>Your invitation</p><h1>See Corvinth work.</h1>
        {state.error && <p className={styles.error} role="alert">{messages[state.error] || messages.demo_unavailable}</p>}
        <DemoAccess adapter={adapter} requests={requests} resume={false} onReady={demo.retrySession} development={development} />
      </div> : <div className={styles.workspace} id="demo-workspace" aria-busy={busy}>
        <Progress stage={stage} />
        <div className={styles.stage}>
          {(stage === 'mode' || stage === 'reference') && <>
            <div className={styles.modeHeading}><h1 ref={stage === 'mode' ? heading : null} tabIndex={-1}>Choose how Corvinth processes your images</h1><p>You can change this choice until you report an image.</p></div>
            <ModeChoice mode={state.mode} disabled={Boolean(state.pending)} choose={demo.chooseMode} />
          </>}
          {state.error && <div className={styles.error} role="alert"><p>{messages[state.error] || messages.demo_unavailable}</p></div>}
          {stage === 'mode' && <p className={styles.nextStep}><span aria-hidden="true">↳</span> Choose a compute mode to open the image library.</p>}

          {selecting && <div className={styles.imageStage}>
            <div className={styles.stageHeading}>
              {stage === 'reference' ? <h2 ref={heading} tabIndex={-1}>Report an image</h2> : <h1 ref={heading} tabIndex={-1}>Try a re-upload</h1>}
              <p>{stage === 'reference' ? 'Choose the image you want Corvinth to find.' : 'Choose up to 3 images to check against your active reference. One checked image uses one run.'}</p>
            </div>
            {reference && <div className={styles.activeReference}>
              <div className={styles.referenceThumbnail}><AssetImage asset={reference.asset} neutral={neutral} /></div>
              <div><span className={styles.activeLabel}>Reference active</span><strong>{reference.asset?.label || 'Reported image'}</strong></div>
              <span className={styles.modeBadge}>{modeName(reference.mode)}</span>
              <button className={styles.textButton} disabled={busy} onClick={demo.reset}>{state.pending?.operation === 'reset' ? 'Resetting reference…' : 'Choose another reference'}</button>
            </div>}
            <DemoImageWorkspace key={stage + state.mode} demo={demo} neutral={neutral} />
          </div>}

          {stage === 'result' && state.results.length > 0 && <>
            <div className={styles.stageHeading}><h1 ref={heading} tabIndex={-1}>Your match result</h1><p>{modeName(state.mode)} · Checked against your reported image.</p></div>
            {state.results.map((entry, index) => <DemoResult key={entry.asset_id} entry={entry} reference={reference} neutral={neutral} index={index} total={state.results.length} />)}
            <div className={styles.resultActions}><button className={styles.primary} disabled={busy || !session.runs_remaining} onClick={demo.anotherUpload}>Try another upload <span aria-hidden="true">→</span></button>
              <button className={styles.textButton} disabled={busy} onClick={demo.reset}>{state.pending?.operation === 'reset' ? 'Resetting reference…' : 'Choose another reference'}</button></div>
          </>}
        </div>
        <p className={styles.boundary}>Corvinth detects. Your platform decides.</p>
      </div>}
    </main>
  </div>;
}
