'use client';

import { useState } from 'react';

const DEMO_HASHES = {
  clean: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678901234567890abcdef012345',
  near: 'f1e2d3c4b5a6978685746352413029180f1e2d3c4b5a69786857463524130291',
};

const DECISION_STATES = {
  EXACT: {
    display: 'EXACT',
    api: 'EXACT',
    signal: 'content_removed',
    note: 'Known-image match',
  },
  FUZZY: {
    display: 'FUZZY',
    api: 'FUZZY',
    signal: 'content_shadow_quarantined',
    note: 'Review path by default',
  },
  NEAR: {
    display: 'NEAR',
    api: 'NEAR_MISS',
    signal: 'content_allowed',
    note: 'Allowed with a threat signal',
  },
  CLEAN: {
    display: 'CLEAN',
    api: 'CLEAN',
    signal: 'content_allowed',
    note: 'No actionable match',
  },
};

function randomHash() {
  return Array.from(
    { length: 64 },
    () => '0123456789abcdef'[Math.floor(Math.random() * 16)],
  ).join('');
}

function ApiDemo() {
  const [hash, setHash] = useState(DEMO_HASHES.clean);
  const [source, setSource] = useState('homepage_demo');
  const [status, setStatus] = useState('idle');
  const [latency, setLatency] = useState(null);
  const [output, setOutput] = useState({
    sandbox: true,
    status: 'Ready for a 64-character PDQ hash',
  });

  async function runDemo() {
    if (!/^[0-9a-fA-F]{64}$/.test(hash.trim())) {
      setStatus('error');
      setLatency(null);
      setOutput({ error: 'pdq_hash must be exactly 64 hexadecimal characters' });
      return;
    }

    setStatus('loading');
    const started = performance.now();

    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdq_hash: hash.trim().toLowerCase(),
          source: source || 'homepage_demo',
        }),
      });
      const data = await response.json().catch(() => ({ error: response.statusText }));
      setLatency(Math.round(performance.now() - started));
      setOutput(data);
      setStatus(response.ok ? (data.match_found ? 'match' : 'clean') : 'error');
    } catch {
      setLatency(Math.round(performance.now() - started));
      setOutput({ error: 'The public sandbox is unavailable right now. Please try again shortly.' });
      setStatus('error');
    }
  }

  return (
    <div className="sandbox-demo" data-status={status}>
      <div className="sandbox-inputs">
        <label htmlFor="demo-hash">PDQ FINGERPRINT (64 HEX CHARS)</label>
        <textarea
          id="demo-hash"
          value={hash}
          spellCheck={false}
          onChange={(event) => setHash(event.target.value)}
        />
        <label htmlFor="demo-source">SOURCE LABEL</label>
        <input
          id="demo-source"
          value={source}
          onChange={(event) => setSource(event.target.value)}
        />
        <div className="sandbox-actions">
          <button type="button" className="ghost-button" onClick={() => setHash(randomHash())}>
            Randomize
          </button>
          <button type="button" className="primary-button" onClick={runDemo} disabled={status === 'loading'}>
            {status === 'loading' ? 'Checking…' : 'Run live decision'}
          </button>
        </div>
      </div>
      <div className="sandbox-output">
        <div className="sandbox-output-heading">
          <span>RESPONSE</span>
          {latency !== null ? <span>{latency}ms</span> : null}
        </div>
        <pre>{JSON.stringify(output, null, 2)}</pre>
      </div>
    </div>
  );
}

function WaitlistForm() {
  const [form, setForm] = useState({
    contact_name: '',
    work_email: '',
    company_name: '',
    platform_url: '',
    platform_type: '',
    monthly_upload_volume: '',
    pipeline_choice: '',
    use_case: '',
  });
  const [formStatus, setFormStatus] = useState('idle');
  const [formError, setFormError] = useState('');

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submitForm(event) {
    event.preventDefault();
    setFormError('');
    setFormStatus('submitting');

    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, value]) => value !== ''),
      );
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Submission failed. Please try again.');
      }
      setFormStatus('success');
    } catch (error) {
      setFormStatus('idle');
      setFormError(
        typeof error?.message === 'string'
          ? error.message
          : 'Submission failed. Please try again.',
      );
    }
  }

  const fieldLabels = {
    contact_name: 'Name',
    work_email: 'Work email',
    company_name: 'Company',
    platform_url: 'Platform URL',
    platform_type: 'Platform type',
    monthly_upload_volume: 'Monthly upload volume',
    pipeline_choice: 'Pipeline (optional)',
    use_case: 'Use case (optional)',
  };
  const requiredFields = new Set([
    'contact_name',
    'work_email',
    'company_name',
    'platform_url',
    'platform_type',
    'monthly_upload_volume',
  ]);

  if (formStatus === 'success') {
    return (
      <div className="access-success" role="status">
        <p>Request received. We&rsquo;ll map the supported integration and its current boundaries, and follow up at the work email you gave us.</p>
      </div>
    );
  }

  return (
    <form className="access-form" onSubmit={submitForm} data-status={formStatus}>
      {Object.entries(form).map(([name, value]) => (
        <label key={name} className="access-field">
          <span>{fieldLabels[name]}</span>
          <input
            name={name}
            value={value}
            onChange={updateForm}
            required={requiredFields.has(name)}
          />
        </label>
      ))}
      {formError ? <p className="access-error" role="alert">{formError}</p> : null}
      <button type="submit" className="primary-button" disabled={formStatus === 'submitting'}>
        {formStatus === 'submitting' ? 'Sending…' : 'Request early access'}
      </button>
    </form>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedState, setSelectedState] = useState('NEAR');
  const selectedDecision = DECISION_STATES[selectedState];
  const apiDocsUrl = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/docs`
    : null;

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <main className="checkpoint-page">
      <nav className="site-nav" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Corvinth home">
          <span className="brand-mark" aria-hidden="true"><i /><i /></span>
          <span>corvinth</span>
        </a>

        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#demo">Sandbox</a>
          <a
            href={apiDocsUrl || '#access'}
            target={apiDocsUrl ? '_blank' : undefined}
            rel={apiDocsUrl ? 'noreferrer' : undefined}
          >
            Docs
          </a>
        </div>

        <a className="nav-cta" href="#access">Request access <span aria-hidden="true">↗</span></a>
        <button
          className={`menu-button${menuOpen ? ' is-open' : ''}`}
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span />
        </button>
      </nav>

      <div className={`mobile-nav${menuOpen ? ' is-open' : ''}`}>
        <a href="#how" onClick={closeMenu}>How it works</a>
        <a href="#demo" onClick={closeMenu}>Sandbox</a>
        <a href="#access" onClick={closeMenu}>Request access</a>
      </div>

      <section className="hero-section" id="top">
        <div className="hero-layout">
          <div className="hero-copy">
            <p className="eyebrow"><span aria-hidden="true" /> IMAGE SAFETY INFRASTRUCTURE FOR UPLOAD PLATFORMS</p>
            <h1>Catch known harmful images <span>before they spread.</span></h1>
            <p className="hero-subhead">
              Corvinth compares upload fingerprints with reported-image records and returns one of four clear signals. Your platform stays in control of what happens next.
            </p>
            <a className="primary-cta" href="#access">Request access <span aria-hidden="true">↗</span></a>
          </div>

          <div className="hero-artifact" aria-label="Example Corvinth decision">
            <div className="artifact-heading">
              <span>DECISION ARTIFACT</span>
              <i aria-hidden="true" />
              <span>STATIC EXAMPLE</span>
            </div>
            <dl className="artifact-rows">
              <div>
                <dt>INCOMING FINGERPRINT</dt>
                <dd>pdq:f9a7…3c18</dd>
              </div>
              <div>
                <dt>DISPLAY STATE</dt>
                <dd className="accent-value">NEAR</dd>
              </div>
              <div>
                <dt>MACHINE RESPONSE</dt>
                <dd>NEAR_MISS <span>·</span> content_allowed</dd>
              </div>
            </dl>
            <div className="artifact-foot">
              <span aria-hidden="true">↳</span>
              <p>Signal returned. Enforcement remains with the platform.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="decision-section" id="how" aria-labelledby="how-heading">
        <div className="decision-intro">
          <div>
            <p className="eyebrow"><span aria-hidden="true" /> HOW IT WORKS</p>
            <h2 id="how-heading">Two paths.<br />One decision contract.</h2>
          </div>
          <p>
            The same four-state contract keeps the signal legible to a person and precise for the product calling the API.
          </p>
        </div>

        <div className="decision-mechanism">
          <div className="state-selector" aria-label="Illustrative decision states">
            <p>SELECT A DISPLAY STATE</p>
            <div role="group" aria-label="Decision state examples">
              {Object.keys(DECISION_STATES).map((state) => (
                <button
                  key={state}
                  type="button"
                  className={selectedState === state ? 'is-selected' : ''}
                  aria-pressed={selectedState === state}
                  onClick={() => setSelectedState(state)}
                >
                  <span>{state}</span>
                  <i aria-hidden="true" />
                </button>
              ))}
            </div>
            <small>Illustrative only · no production request is made</small>
          </div>

          <div className="selected-decision" aria-live="polite">
            <div className="decision-readout">
              <span>DISPLAY STATE</span>
              <strong>{selectedDecision.display}</strong>
            </div>
            <div className="decision-readout">
              <span>API VALUE</span>
              <strong>{selectedDecision.api}</strong>
            </div>
            <div className="decision-readout">
              <span>PLATFORM SIGNAL</span>
              <strong>{selectedDecision.signal}</strong>
            </div>
            <p><i aria-hidden="true" /> {selectedDecision.note}</p>
          </div>
        </div>

        <div className="legal-strip" aria-label="Founder-supplied regulatory staging copy pending legal review">
          <span>TIDA · 48-hour removal window</span>
          <i aria-hidden="true" />
          <span>FTC · up to $53,088 per violation</span>
          <i aria-hidden="true" />
          <span>Platform action remains your responsibility</span>
        </div>

        <div className="audit-opening" aria-label="Opening audit flow">
          <p>WHAT HAPPENS NEXT</p>
          <ol>
            <li><span>01</span><strong>DECISION RETURNED</strong></li>
            <li aria-hidden="true">→</li>
            <li><span>02</span><strong>CASE CREATED</strong></li>
            <li aria-hidden="true">→</li>
            <li><span>03</span><strong>AUDIT EVENT SEALED</strong></li>
          </ol>
        </div>

        <div className="mechanism-panels">
          <div className="mechanism-panel">
            <p className="panel-label">SHIELD</p>
            <p>
              Shield compares PDQ fingerprints with known-image records and returns <code>EXACT</code>, <code>FUZZY</code>, <code>NEAR_MISS</code>, or <code>CLEAN</code>. Choose local fingerprints or a managed presigned-URL path.
            </p>
            <div className="panel-routes">
              <code>POST /hash/check-and-archive</code>
              <code>POST /hash/check-and-archive-from-url</code>
            </div>
          </div>
          <div className="mechanism-panel">
            <p className="panel-label">PULSE</p>
            <p>
              Pulse opens a complaint-led similarity search for transformed or cropped variants. It requires account enablement and supporting vector infrastructure.
            </p>
            <div className="panel-routes">
              <code>POST /complaint/pulse <span>· GUIDED EARLY ACCESS</span></code>
            </div>
          </div>
        </div>

        <p className="mechanism-closing">
          Corvinth returns the signal and evidence. Your platform decides and performs the action.
        </p>
      </section>

      <section className="sandbox-section" id="demo" aria-labelledby="sandbox-heading">
        <div className="sandbox-intro">
          <p className="eyebrow"><span aria-hidden="true" /> TRY THE REAL ROUTE</p>
          <h2 id="sandbox-heading">Inspect the response yourself.</h2>
          <p>
            Submit a 64-character PDQ fingerprint to Corvinth&rsquo;s read-only public sandbox. No signup or API key required.
          </p>
          <p className="sandbox-limits"><code>10 requests/minute · 50/hour</code></p>
        </div>
        <ApiDemo />
      </section>

      <section className="boundaries-section" id="boundaries" aria-labelledby="boundaries-heading">
        <p className="eyebrow"><span aria-hidden="true" /> BOUNDARIES</p>
        <h2 id="boundaries-heading">What Corvinth does—and what stays yours.</h2>
        <ul className="boundaries-list">
          <li>Corvinth returns classifications, action signals, and case evidence; your platform owns enforcement and policy.</li>
          <li>Local-data paths send fingerprints or vectors. Managed URL paths temporarily fetch allowlisted image URLs for computation and do not claim that pixels never cross Corvinth&rsquo;s boundary.</li>
          <li>Pulse is guided early access, not a default capability.</li>
          <li>Corvinth does not claim a third-party reporting-network partnership or general-purpose content moderation.</li>
          <li>Video is not offered by the current default deployment.</li>
        </ul>
      </section>

      <section className="access-section" id="access" aria-labelledby="access-heading">
        <div className="access-intro">
          <p className="eyebrow"><span aria-hidden="true" /> REQUEST ACCESS</p>
          <h2 id="access-heading">You keep control. Corvinth returns the signal.</h2>
          <p>
            Tell us where images enter your product and which path you want to evaluate. We&rsquo;ll map the supported integration and its current boundaries.
          </p>
        </div>
        <WaitlistForm />
      </section>
    </main>
  );
}
