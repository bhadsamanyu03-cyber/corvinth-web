'use client';

/* Manifest display images are ordinary images; never apply processing transformations. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { liveDemoClient } from '../lib/demo-client.mjs';
import { canExecute } from '../lib/demo-state.mjs';
import DemoAccess from './DemoAccess';
import useDemo from './useDemo';
import styles from './DemoWorkspace.module.css';

const messages = {
  demo_token_invalid: 'This token is invalid, expired, or has reached its session limit. Check the token we sent you.',
  demo_session_invalid: 'Your session has ended or expired. Enter your demo token to start again.',
  demo_rate_limited: 'The demo has reached its access limit. Please try again later.',
  demo_invalid_request: 'Paste the complete demo token supplied by Corvinth.',
  demo_origin_rejected: 'Demo access is unavailable from this page address.',
  demo_unavailable: 'The demo is temporarily unavailable. Please try again.',
  demo_invalid_response: 'We could not confirm the response. Please check your session before continuing.',
  demo_execution_unavailable: 'Image checks are not connected yet. Your session has not run a check.',
};
const results = {
  EXACT: { title: 'EXACT', text: 'Corvinth returned an exact match.' },
  FUZZY: { title: 'FUZZY', text: 'Corvinth returned a fuzzy match.' },
  NEAR_MISS: { title: 'NEARMISS', text: 'Corvinth returned a near-miss result.' },
  CLEAN: { title: 'CLEAN', text: 'Corvinth returned no match for this check.' },
};
const modeName = (mode) => mode === 'managed' ? 'Managed compute' : 'Customer compute';

function ImagePreview({ asset, label, empty = 'Choose an image from the library' }) {
  return <figure className={styles.imagePreview} data-empty={!asset}>
    <div className={styles.imageFrame}>{asset
      ? <img src={asset.preview_url} alt={asset.alt} width="480" height="600" />
      : <span className={styles.imagePlaceholder}><span aria-hidden="true">＋</span>{empty}</span>}</div>
    <figcaption><span>{label}</span><strong>{asset?.label || 'No image selected'}</strong></figcaption>
  </figure>;
}

function Gallery({ assets, selection, select, disabled, stage }) {
  const [filter, setFilter] = useState('');
  const eligible = assets.filter((asset) => stage === 'reference' ? asset.can_reference : asset.can_upload);
  const visible = eligible.filter((asset) => asset.label.toLowerCase().includes(filter.toLowerCase()));
  return <div className={styles.gallery}>
    <div className={styles.galleryHeading}><p>Choose a demo image <span>{eligible.length}</span></p>
      {eligible.length > 9 && <label className={styles.search}><span className={styles.srOnly}>Find a demo image</span>
        <input type="search" placeholder="Find an image" value={filter} onChange={(event) => setFilter(event.target.value)} /></label>}</div>
    <div className={styles.galleryGrid} role="group" aria-label={stage === 'reference' ? 'Images to report' : 'Images to try as an upload'}>
      {visible.map((asset) => <button key={asset.id} type="button" className={styles.asset}
        aria-pressed={selection?.id === asset.id} disabled={disabled} onClick={() => select(asset.id)}>
        <span className={styles.thumbnail}><img src={asset.preview_url} alt="" width="150" height="180" loading="lazy" />
          {selection?.id === asset.id && <span className={styles.selectedMark} aria-hidden="true">✓</span>}</span>
        <span>{asset.label}</span>
      </button>)}
    </div>
    {!visible.length && <p className={styles.muted}>No images match. Try a different search.</p>}
  </div>;
}

export default function DemoWorkspace({ adapter = liveDemoClient, requests, development = false }) {
  const router = useRouter();
  const demo = useDemo(adapter, { autoOpen: true });
  const { state } = demo;
  const heading = useRef(null);
  const busy = Boolean(state.pending && !state.pending.silent);
  const stage = state.stage;
  const canRun = canExecute(state);
  const reference = state.reference;

  useEffect(() => { if (stage !== 'entry') heading.current?.focus({ preventScroll: true }); }, [stage]);

  async function exitDemo() {
    if (await demo.end()) router.replace('/#demo');
  }

  const title = stage === 'gate' ? 'Your invitation to try Corvinth.'
    : stage === 'mode' ? 'How would your platform connect?'
    : stage === 'reference' ? 'Which image was reported?'
    : stage === 'upload' ? 'Now, someone uploads another image.' : 'Here’s what Corvinth detected.';

  return <div className={styles.shell}>
    <header className={styles.shellHeader}>
      <Link className={styles.brand} href="/" aria-label="Corvinth home"><svg viewBox="0 0 40 44" aria-hidden="true"><path d="M20 1 38 11v8l-9 4v-7l-9-5-10 6v10l10 6 9-5v-6l9 4v7L20 43 2 33V11L20 1Z" /></svg><span>Corvinth</span></Link>
      <span className={styles.shellLabel}>Live demo</span>
      {state.session ? <button className={styles.textButton} disabled={Boolean(state.pending)} onClick={exitDemo}>{state.pending?.operation === 'end' ? 'Leaving…' : 'Exit demo'}</button> : <Link className={styles.textButton} href="/#demo">Back to Corvinth</Link>}
    </header>
    <main className={styles.demo}>
      {development && <p className={styles.development} role="note">Development visualization · All sessions, images and results below are fixtures. No live Corvinth requests.</p>}
      {stage === 'checking' ? <div className={styles.access}><h1>Opening your demo…</h1><p role="status">Checking your invitation.</p>
        {state.error && <div className={styles.error} role="alert"><p>{messages[state.error] || messages.demo_unavailable}</p><button className={styles.textButton} onClick={demo.retrySession} disabled={busy}>Try again</button></div>}</div>
      : !state.session ? <div className={styles.access}><p className={styles.eyebrow}>Your invitation</p><h1>See Corvinth work.</h1>
        {state.error && <p className={styles.error} role="alert">{messages[state.error] || messages.demo_unavailable}</p>}
        <DemoAccess adapter={adapter} requests={requests} resume={false} onReady={demo.retrySession} development={development} />
      </div> : <div className={styles.workspace} id="demo-workspace" aria-busy={busy}>
        <div className={styles.workspaceBar}>
          <p><span className={styles.dot} aria-hidden="true" />Demo access active <span className={styles.sessionMeta}>· {state.session.runs_remaining} runs remaining · until {new Date(state.session.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
        </div>
        {state.session && <ol className={styles.progress} aria-label="Demo progress">
          {['Choose compute', 'Report an image', 'Try an upload', 'Result'].map((name, i) => {
            const current = ['mode', 'reference', 'upload', 'result'].indexOf(stage);
            return <li key={name} aria-current={current === i ? 'step' : undefined} data-complete={current > i}><span aria-hidden="true">{current > i ? '✓' : `0${i + 1}`}</span>{name}</li>;
          })}
        </ol>}
        <div className={styles.stage}>
          <div className={styles.stageHeading}>
            <h1 ref={heading} tabIndex={-1}>{title}</h1>
            {state.mode && <p className={styles.modeBadge}>{modeName(state.mode)}{!reference && <button className={styles.textButton} disabled={busy} onClick={demo.changeMode}>Change</button>}</p>}
          </div>

          {state.error && <div className={styles.error} role="alert"><p>{messages[state.error] || messages.demo_unavailable}</p></div>}
          {state.notice && <p className={styles.notice} role="status">{state.notice}</p>}

          {stage === 'mode' && <div>
            <p className={styles.description}>Same demo. Choose where the image signals are computed.</p>
            <div className={styles.modes}>
              <button id="demo-mode-managed" className={styles.mode} disabled={busy} onClick={() => demo.chooseMode('managed')}><span className={styles.eyebrow}>Corvinth computes</span><strong>Managed compute</strong><span>Corvinth receives a short-lived image URL and computes the matching signals.</span><b>Choose managed <i aria-hidden="true">→</i></b></button>
              <button id="demo-mode-customer" className={styles.mode} disabled={busy} onClick={() => demo.chooseMode('customer')}><span className={styles.eyebrow}>Your platform computes</span><strong>Customer compute</strong><span>Your platform uses the Corvinth SDK and sends only derived signals.</span><b>Choose customer <i aria-hidden="true">→</i></b></button>
            </div>
          </div>}

          {['reference', 'upload'].includes(stage) && <>
            {reference && <div className={styles.activeReference}><img src={reference.asset.preview_url} width="52" height="64" alt="" /><p><span>Reference active · {modeName(reference.mode)}</span><strong>{reference.asset.label}</strong><span>Corvinth is now watching for copies of this image.</span></p></div>}
            <p className={styles.description}>{stage === 'reference' ? 'Choose an image from Corvinth’s controlled library to use as the report.' : 'Choose a demo image to represent a later upload on your platform.'}</p>
            {state.library === 'ready' ? <div className={styles.selectionLayout}>
              <ImagePreview asset={state.selection} label={stage === 'reference' ? 'Image to report' : 'Attempted upload'} />
              <Gallery key={stage} assets={state.assets} selection={state.selection} select={demo.select} stage={stage} disabled={busy} />
            </div> : <div className={styles.unavailable} role="status">
              <p className={styles.eyebrow}>{state.pending?.operation === 'assets' ? 'Loading image library' : 'Image library unavailable'}</p>
              <h4>{state.pending?.operation === 'assets' ? 'Preparing your image choices…' : state.library === 'error' ? 'We couldn’t load the library.' : 'Your access is ready. The image demo is coming next.'}</h4>
              <p>{state.pending?.operation === 'assets' ? 'Loading Corvinth’s controlled image library.' : state.library === 'error' ? 'Try loading the library again.' : 'The controlled images and live checks are not connected yet. No image has been reported or processed.'}</p>
              {state.library === 'error' && <button className={styles.secondary} disabled={busy} onClick={demo.retryAssets}>Reload image library</button>}
              <a className={styles.textButton} href="mailto:founder@corvinth.com?subject=Corvinth%20demo%20availability">Ask about demo availability ↗</a>
            </div>}
            {state.library === 'ready' && <div className={styles.actionRow}>
              <p role="status">{state.session.runs_remaining === 0 ? 'This session has used its run allowance.' : busy ? state.pending?.operation === 'report' ? 'Registering your reference…' : 'Checking this upload…' : state.selection ? `${state.selection.label} selected` : 'Select an image to continue.'}</p>
              <button className={styles.primary} disabled={!canRun} onClick={stage === 'reference' ? demo.report : demo.check}>{busy ? 'Processing…' : stage === 'reference' ? 'Report image' : 'Check image'} <span aria-hidden="true">→</span></button>
            </div>}
            {reference && <button className={`${styles.textButton} ${styles.reset}`} disabled={busy} onClick={demo.reset}>Choose another reference</button>}
          </>}

          {stage === 'result' && state.result && <>
            <div className={styles.result} data-classification={state.result.classification}>
              <p className={styles.eyebrow}>{development ? 'Simulated classification' : 'Corvinth classification'}</p>
              <strong>{results[state.result.classification].title}</strong><p>{results[state.result.classification].text}</p>
            </div>
            <div className={styles.comparison}><ImagePreview asset={reference.asset} label="Reported image" /><ImagePreview asset={state.upload} label="Attempted upload" /></div>
            <details className={styles.requestDetails}><summary>Request details</summary><dl>
              <div><dt>Compute model</dt><dd>{modeName(state.result.mode)}</dd></div><div><dt>Classification</dt><dd>{state.result.classification}</dd></div><div><dt>Request</dt><dd>{state.result.request_id}</dd></div>
            </dl><details><summary>Response fields</summary><pre>{JSON.stringify(state.result, null, 2)}</pre></details></details>
            <div className={styles.actionRow}><button className={styles.primary} disabled={busy || !state.session.runs_remaining} onClick={demo.anotherUpload}>Try another upload <span aria-hidden="true">→</span></button>
              <button className={styles.textButton} disabled={busy} onClick={demo.reset}>{state.pending?.operation === 'reset' ? 'Resetting reference…' : 'Choose another reference'}</button></div>
          </>}
        </div>
        <p className={styles.boundary}>Corvinth detects. Your platform decides.</p>
      </div>}
    </main>
  </div>;
}
