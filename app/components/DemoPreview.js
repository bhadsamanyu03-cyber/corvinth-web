'use client';

import { useState } from 'react';
import styles from './DemoPreview.module.css';

const stages = [
  { id: 'reference', title: 'Report an image' },
  { id: 'upload', title: 'Try a re-upload' },
  { id: 'result', title: 'See the result' },
];

// Presentation only. No session, reference, or result is fabricated here.
// Enable execution only after the server owns the approved asset mapping
// and provides bounded sessions with isolated reference state.
export default function DemoPreview() {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState('');
  const [stage, setStage] = useState('reference');

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

            <details id="demo-access" className={styles.access}>
              <summary>Demo access <span>Pending connection</span></summary>
              <div className={styles.accessBody}>
                <p>The live demo will start with a short-lived session. Access is not connected yet; these fields do not collect or send information.</p>
                <fieldset disabled className={styles.accessFields}>
                  <legend className={styles.srOnly}>Demo access preview — unavailable</legend>
                  <label htmlFor="demo-email">Work email<input id="demo-email" type="email" autoComplete="off" placeholder="you@company.com" /></label>
                  <label htmlFor="demo-company">Company / platform URL<input id="demo-company" type="url" autoComplete="off" placeholder="https://your-platform.com" /></label>
                </fieldset>
                <button type="button" className={styles.action} data-demo-execution disabled>Start demo session</button>
              </div>
            </details>

            <fieldset className={styles.modes}>
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
              <p className={styles.modeContext} aria-live="polite">{mode ? `${mode === 'managed' ? 'Managed' : 'Customer'} compute selected · preview only` : 'Choose a compute model above'}</p>
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
