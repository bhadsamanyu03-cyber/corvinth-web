'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './DemoPreview.module.css';

const stages = [
  { id: 'reference', title: 'Report an image' },
  { id: 'upload', title: 'Try a re-upload' },
  { id: 'result', title: 'See the result' },
];

const accessMessages = {
  demo_token_invalid: 'This token is invalid, expired, revoked, or has reached its session limit.',
  demo_session_invalid: 'Your demo session has ended or expired. Enter a token to start again.',
  demo_rate_limited: 'Too many access attempts. Please try again later.',
  demo_invalid_request: 'Enter the complete demo token supplied by Corvinth.',
  demo_origin_rejected: 'Demo access is unavailable from this page address.',
  demo_unavailable: 'Demo access is temporarily unavailable. Please try again later.',
};

// Access is connected; image selection and computation remain unavailable.
export default function DemoPreview() {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState('');
  const [stage, setStage] = useState('reference');
  const [session, setSession] = useState(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState('');
  const tokenInput = useRef(null);
  const requestBusy = useRef(false);
  const accessGeneration = useRef(0);

  useEffect(() => {
    if (!expanded) return;
    let cancelled = false;
    async function refresh() {
      if (requestBusy.current) return;
      const generation = accessGeneration.current;
      try {
        const response = await fetch('/api/live-demo/session', { cache: 'no-store', credentials: 'same-origin' });
        const data = await response.json();
        if (cancelled || requestBusy.current || generation !== accessGeneration.current) return;
        if (response.ok) {
          setSession(data.status === 'active' ? data : null);
        } else if (response.status === 401) {
          setSession(null);
          setMessage(accessMessages.demo_session_invalid);
        } else {
          setSession(null);
          setMessage(accessMessages[data.error] || accessMessages.demo_unavailable);
        }
      } catch {
        if (!cancelled && generation === accessGeneration.current && !requestBusy.current) {
          setSession(null); setMessage(accessMessages.demo_unavailable);
        }
      } finally {
        if (!cancelled && generation === accessGeneration.current && !requestBusy.current) setChecking(false);
      }
    }
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [expanded]);

  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => {
      setSession(null);
      setMode('');
      setStage('reference');
      setMessage(accessMessages.demo_session_invalid);
    }, Math.max(0, new Date(session.expires_at).getTime() - Date.now()));
    return () => clearTimeout(timer);
  }, [session]);

  async function changeAccess(event, method) {
    event.preventDefault();
    if (requestBusy.current) return;
    requestBusy.current = true;
    accessGeneration.current += 1;
    setBusy(true);
    setMessage('');
    const token = method === 'POST' ? tokenInput.current.value.trim() : undefined;
    if (tokenInput.current) tokenInput.current.value = '';
    try {
      const response = await fetch('/api/live-demo/session', {
        method, credentials: 'same-origin', cache: 'no-store',
        ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) } : {}),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) { setSession(null); resetPreview(); }
        setMessage(accessMessages[data.error] || accessMessages.demo_unavailable);
        return;
      }
      setSession(data.status === 'active' ? data : null);
      resetPreview();
      if (method === 'DELETE') setMessage('Your demo session has ended.');
    } catch { setMessage(accessMessages.demo_unavailable); }
    finally { requestBusy.current = false; setBusy(false); setChecking(false); }
  }

  function resetPreview() {
    setMode('');
    setStage('reference');
  }

  return (
    <section id="demo" aria-labelledby="demo-title">
      <div className={`inner ${styles.demo}`}>
        <header>
          <p className="section-tag">Live API demo</p>
          <h2 id="demo-title" className="section-title">Report an image.<br />Try a re-upload.</h2>
          <p className={styles.intro}>Follow an image from a platform report to a check for matching content.</p>
        </header>

        <div className={styles.availability} id="demo-availability">
          <span className={styles.status}>Live execution pending</span>
          <p>Explore the flow below. Image selection and live checks are not available yet.</p>
        </div>

        <button
          type="button" id="demo-preview-trigger" className={styles.previewButton}
          aria-expanded={expanded} aria-controls="demo-preview"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Close flow preview' : 'Preview the demo flow'} <span aria-hidden="true">{expanded ? '−' : '→'}</span>
        </button>

        {expanded && (
          <div id="demo-preview" className={styles.workspace}>
            <div className={styles.workspaceHeading}>
              <p className={styles.eyebrow}>Flow preview</p>
              <button type="button" id="demo-reset" className={styles.textButton} onClick={resetPreview}>Reset preview</button>
            </div>

            <div id="demo-access" className={styles.access} aria-busy={busy || checking}>
              <div className={styles.accessBody}>
                <h3 className={styles.accessTitle}>Demo access</h3>
                {session ? (
                  <>
                    <p role="status">Session active until {new Date(session.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. {session.runs_remaining} of {session.max_runs} runs remaining.</p>
                    <p>Access is ready. Image selection and live checks are still pending.</p>
                    <button type="button" className={styles.action} disabled={busy} onClick={(event) => changeAccess(event, 'DELETE')}>{busy ? 'Ending session…' : 'End demo session'}</button>
                  </>
                ) : (
                  <form onSubmit={(event) => changeAccess(event, 'POST')}>
                    <p>Enter the demo token we sent you. To request one, email <a href="mailto:founder@corvinth.com">founder@corvinth.com</a> with your work email and company or platform URL.</p>
                    <div className={styles.accessFields}>
                      <label htmlFor="demo-token">Demo token<input ref={tokenInput} id="demo-token" name="demo-token" type="password" autoComplete="off" spellCheck={false} autoCapitalize="none" maxLength={100} required disabled={busy || checking} placeholder="Paste your demo token" /></label>
                    </div>
                    <button type="submit" className={styles.action} disabled={busy || checking}>{checking ? 'Checking session…' : busy ? 'Starting session…' : 'Start demo session'}</button>
                  </form>
                )}
                {message && <p className={styles.accessMessage} role="status">{message}</p>}
              </div>
            </div>

            <fieldset className={styles.modes} disabled={!session || busy}>
              <legend>Choose how your platform integrates</legend>
              <div className={styles.modeOptions}>
                <label className={`${styles.mode} ${mode === 'managed' ? styles.selected : ''}`}>
                  <input id="demo-mode-managed" type="radio" name="demo-mode" value="managed" checked={mode === 'managed'} onChange={() => setMode('managed')} />
                  <span><strong>Managed compute</strong><span>Send Corvinth a short-lived image URL. We compute the matching signals.</span></span>
                </label>
                <label className={`${styles.mode} ${mode === 'customer' ? styles.selected : ''}`}>
                  <input id="demo-mode-customer" type="radio" name="demo-mode" value="customer" checked={mode === 'customer'} onChange={() => setMode('customer')} />
                  <span><strong>Customer compute</strong><span>Compute locally with the Corvinth SDK. Only derived signals reach Corvinth.</span></span>
                </label>
              </div>
            </fieldset>

            <div className={styles.stageHeading}>
              <p className={styles.eyebrow}>Explore each step</p>
              <p className={styles.modeContext} aria-live="polite">{!session ? 'Enter a demo token to choose a compute model' : mode ? `${mode === 'managed' ? 'Managed' : 'Customer'} compute selected · preview only` : 'Choose a compute model above'}</p>
            </div>
            <div className={styles.stages} role="group" aria-label="Preview a stage of the demo">
              {stages.map((item, index) => (
                <button type="button" key={item.id} id={`demo-step-${item.id}`} aria-pressed={stage === item.id} aria-controls="demo-stage" onClick={() => setStage(item.id)}>
                  <span className={styles.stepNumber} aria-hidden="true">0{index + 1}</span>{item.title}
                </button>
              ))}
            </div>

            <div id="demo-stage" className={styles.stage} role="region" aria-labelledby={`demo-step-${stage}`}>
              {stage !== 'result' ? (
                <>
                  <h3>{stage === 'reference' ? 'Choose the image to report.' : 'Now try another image.'}</h3>
                  <p className={styles.description}>{stage === 'reference'
                    ? 'Select an image from the curated gallery to register as your reference.'
                    : 'Once a reference is active, choose a demo image to represent a new upload.'}</p>
                  <div className={styles.galleryEmpty}>
                    <span className={styles.emptyMark} aria-hidden="true">—</span>
                    <strong>Demo image library pending</strong>
                    <p>Images will be selectable once their processing inputs are verified and connected.</p>
                  </div>
                  <div className={styles.stageFooter}>
                    <p>{stage === 'reference' ? 'No reference registered.' : 'A registered reference is required before checking an upload.'}</p>
                    <button type="button" className={styles.action} data-demo-execution disabled aria-describedby="demo-availability">{stage === 'reference' ? 'Report image' : 'Check image'} <span aria-hidden="true">→</span></button>
                  </div>
                </>
              ) : (
                <>
                  <h3>No result yet.</h3>
                  <p className={styles.description}>The classification will appear here after a live check. No images have been processed in this preview.</p>
                  <div className={styles.comparison}>
                    <div><p className={styles.eyebrow}>Reference</p><div className={styles.imageEmpty}>No reference registered</div></div>
                    <div><p className={styles.eyebrow}>Attempted upload</p><div className={styles.imageEmpty}>No image checked</div></div>
                  </div>
                  <details className={styles.requestDetails}><summary>Request details</summary><p>No request has been sent. Details will be available after a live check.</p></details>
                  <div className={styles.stageFooter}>
                    <p>Corvinth detects. Your platform decides.</p>
                    <button type="button" className={styles.action} data-demo-execution disabled>Try another upload</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
