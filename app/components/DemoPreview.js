'use client';

/* Manifest display images are ordinary images; never apply processing transformations. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import { liveDemoClient } from '../lib/demo-client.mjs';
import { canExecute } from '../lib/demo-state.mjs';
import useDemo from './useDemo';
import styles from './DemoPreview.module.css';

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

export function DemoExperience({ adapter = liveDemoClient, development = false }) {
  const demo = useDemo(adapter);
  const { state } = demo;
  const token = useRef(null);
  const heading = useRef(null);
  const opened = state.stage !== 'entry';
  const busy = Boolean(state.pending && !state.pending.silent);
  const stage = state.stage;
  const canRun = canExecute(state);
  const reference = state.reference;

  useEffect(() => { if (stage !== 'entry') heading.current?.focus({ preventScroll: true }); }, [stage]);

  function redeem(event) {
    event.preventDefault();
    const value = token.current.value.trim(); token.current.value = '';
    demo.start(value);
  }

  const title = stage === 'gate' ? 'Your invitation to try Corvinth.'
    : stage === 'mode' ? 'How would your platform connect?'
    : stage === 'reference' ? 'Which image was reported?'
    : stage === 'upload' ? 'Now, someone uploads another image.' : 'Here’s what Corvinth detected.';

  return <section id="demo" aria-labelledby="demo-title">
    <div className={`inner ${styles.demo}`}>
      <header className={styles.intro}>
        <div><p className="section-tag">Live API demo</p><h2 id="demo-title" className="section-title">See Corvinth work.</h2></div>
        <p>One reported image. Another upload.<br />See what Corvinth detects.</p>
      </header>

      {development && <p className={styles.development} role="note">Development visualization · All sessions, images and results below are fixtures. No live Corvinth requests.</p>}

      {!opened ? <div className={styles.entry}>
        <ol className={styles.story}><li><span>01</span>Report an image.</li><li><span>02</span>Try a re-upload.</li><li><span>03</span>See the result.</li></ol>
        <div className={styles.entryAction}><button id="demo-start" className={styles.primary} onClick={demo.open}>Try Corvinth <span aria-hidden="true">→</span></button>
          <p>Founder-issued demo token required.</p></div>
        {!development && <p className={styles.connectionNote}>Token access is available. Live image checks are not connected yet.</p>}
      </div> : <div className={styles.workspace} id="demo-workspace" aria-busy={busy}>
        <div className={styles.workspaceBar}>
          <p>{state.session ? <><span className={styles.dot} aria-hidden="true" />Session active <span className={styles.sessionMeta}>· {state.session.runs_remaining} runs remaining · until {new Date(state.session.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></> : 'Demo access'}</p>
          <button className={styles.textButton} disabled={Boolean(state.pending)} onClick={state.session ? demo.end : demo.close}>{state.pending?.operation === 'end' ? 'Ending…' : state.session ? 'End session' : 'Close'}</button>
        </div>
        {state.session && <ol className={styles.progress} aria-label="Demo progress">
          {['Choose compute', 'Report an image', 'Try an upload', 'Result'].map((name, i) => {
            const current = ['mode', 'reference', 'upload', 'result'].indexOf(stage);
            return <li key={name} aria-current={current === i ? 'step' : undefined} data-complete={current > i}><span aria-hidden="true">{current > i ? '✓' : `0${i + 1}`}</span>{name}</li>;
          })}
        </ol>}
        <div className={styles.stage}>
          <div className={styles.stageHeading}>
            <h3 ref={heading} tabIndex={-1}>{title}</h3>
            {state.mode && <p className={styles.modeBadge}>{modeName(state.mode)}{!reference && <button className={styles.textButton} disabled={busy} onClick={demo.changeMode}>Change</button>}</p>}
          </div>

          {state.error && <div className={styles.error} role="alert"><p>{messages[state.error] || messages.demo_unavailable}</p>
            {stage === 'gate' && state.error !== 'demo_token_invalid' && <button className={styles.textButton} disabled={busy} onClick={demo.retrySession}>Check session again</button>}
          </div>}
          {state.notice && <p className={styles.notice} role="status">{state.notice}</p>}

          {stage === 'gate' && <div className={styles.gate}>
            <form onSubmit={redeem}>
              <p className={styles.description}>Enter the demo token we sent you.</p>
              <label htmlFor="demo-token">Demo token</label>
              <input ref={token} id="demo-token" name="demo-token" type="password" required maxLength={100} autoComplete="off" spellCheck={false} autoCapitalize="none" placeholder="Paste your demo token" disabled={busy} />
              <button className={styles.primary} disabled={busy} type="submit">{state.pending?.operation === 'session' ? 'Checking session…' : busy ? 'Opening session…' : 'Start demo session'} <span aria-hidden="true">→</span></button>
              {!development && <p className={styles.connectionNote}>Image selection and live checks will be available once connected.</p>}
            </form>
            <aside className={styles.invitation}><p>Need a demo token?</p><a href="mailto:founder@corvinth.com?subject=Corvinth%20demo%20access">founder@corvinth.com <span aria-hidden="true">↗</span></a>
              <p>Email us with your work email and platform or company URL. We’ll send your token directly.</p></aside>
          </div>}

          {stage === 'mode' && <div className={styles.modeChoice}>
            <p className={styles.description}>Same demo. Choose where the image signals are computed.</p>
            <div className={styles.modes}>
              <button id="demo-mode-managed" className={styles.mode} disabled={busy} onClick={() => demo.chooseMode('managed')}><span className={styles.eyebrow}>Corvinth computes</span><strong>Managed compute</strong><span>Corvinth receives a short-lived image URL and computes the matching signals.</span><b>Choose managed <i aria-hidden="true">→</i></b></button>
              <button id="demo-mode-customer" className={styles.mode} disabled={busy} onClick={() => demo.chooseMode('customer')}><span className={styles.eyebrow}>Your platform computes</span><strong>Customer compute</strong><span>Your platform uses the Corvinth SDK and sends only derived signals.</span><b>Choose customer <i aria-hidden="true">→</i></b></button>
            </div>
          </div>}

          {['reference', 'upload'].includes(stage) && <>
            {reference && <div className={styles.activeReference}><img src={reference.asset.preview_url} width="52" height="64" alt="" /><p><span>Reference active · {modeName(reference.mode)}</span><strong>{reference.asset.label}</strong><span>Uploads will be checked against this reported image.</span></p></div>}
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
              <button className={styles.primary} disabled={!canRun} onClick={stage === 'reference' ? demo.report : demo.check}>{busy ? 'Processing…' : stage === 'reference' ? 'Report image' : 'Check upload'} <span aria-hidden="true">→</span></button>
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
    </div>
  </section>;
}

export default function DemoPreview() { return <DemoExperience />; }
