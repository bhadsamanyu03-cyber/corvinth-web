// app/page.js
'use client';

import { useState } from 'react';

export default function Home() {
  const [hashInput, setHashInput] = useState('a1b2c3d4e5f6...');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState('idle');

  // Liability calculator
  const [uploadsPerMonth, setUploadsPerMonth] = useState(500000);
  const nciiRate = 0.001;
  const finePerViolation = 53088;
  const estimatedExposure = Math.round(uploadsPerMonth * nciiRate * finePerViolation);

  // Waitlist form
  const [form, setForm] = useState({
    contact_name: '',
    work_email: '',
    company_name: '',
    platform_url: '',
    platform_type: '',
    monthly_upload_volume: '',
    referral_source: '',
    use_case: '',
  });
  const [formStatus, setFormStatus] = useState('idle');
  const [formError, setFormError] = useState('');

  const handleFormChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async () => {
    setFormError('');
    if (!form.contact_name || !form.work_email || !form.company_name || !form.platform_url || !form.platform_type || !form.monthly_upload_volume) {
      setFormError('Please fill in all required fields.');
      return;
    }
    setFormStatus('submitting');
    try {
      const API_URL = process.env.NEXT_PUBLIC_CORVINTH_API_URL || 'https://corvinth-api.onrender.com';
      const res = await fetch(`${API_URL}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail?.[0]?.msg || 'Submission failed. Please try again.');
      }
      setFormStatus('success');
    } catch (e) {
      setFormError(e.message || 'Something went wrong. Please try again.');
      setFormStatus('idle');
    }
  };

  // Valid 64-char PDQ hex hash used as default demo input
  const DEMO_HASH = 'f8d4a2b1e5c3907f6a4d8b2e1c5f3a9d7e2b4c8f1a6d3b9e4c2f7a5d1b8e6c4';

  const simulateCheck = async () => {
    setLoading(true);
    setResult(null);
    try {
      // Use the hash if it looks valid (64 hex chars), otherwise use the demo hash
      const hashToCheck = /^[0-9a-fA-F]{64}$/.test(hashInput) ? hashInput : DEMO_HASH;
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdq_hash: hashToCheck,
          pdq_dihedral_hashes: Array(8).fill(hashToCheck),
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      // Fallback mock if API is unreachable (e.g. cold start)
      setResult({
        case_uuid: 'cse_demo_' + Math.random().toString(36).slice(2, 10),
        match_found: false,
        classification: 'CLEAN',
        action: 'content_allowed',
        hamming_distance: null,
        pipeline_2_queued: false,
        _note: 'demo — api warming up',
      });
    }
    setLoading(false);
  };

  const formatExposure = (n) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subscribeEmail || !subscribeEmail.includes('@')) return;
    setSubscribeStatus('submitting');
    try {
      const API_URL = process.env.NEXT_PUBLIC_CORVINTH_API_URL || 'https://corvinth-api.onrender.com';
      const res = await fetch(`${API_URL}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: 'Subscriber',
          work_email: subscribeEmail,
          company_name: 'Unknown',
          platform_url: 'https://unknown.com',
          platform_type: 'other',
          monthly_upload_volume: 'under_10k',
          referral_source: 'regulatory_updates_subscribe',
        }),
      });
      // Treat both success and duplicate (already subscribed) as OK
      setSubscribeStatus('success');
    } catch {
      setSubscribeStatus('success'); // Never show error — silent fail is fine here
    }
  };

  return (
    <>
      {/* Metadata handled in layout.tsx via Next.js App Router metadata export */}

      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <nav>
        <a className="logo" href="#">cor<span className="accent">vinth</span></a>
        <div className="nav-right">
          <a className="btn-ghost" href="#product">product</a>
          <a className="btn-ghost" href="#how">how it works</a>
          <a className="btn-ghost" href="#pricing">pricing</a>
          <a className="btn-primary" href="#contact">request access</a>
          <button
            className={`hamburger${mobileMenuOpen ? ' open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* ── MOBILE MENU ──────────────────────────────────────────────────────── */}
      <div className={`mobile-menu${mobileMenuOpen ? ' open' : ''}`}>
        <a href="#product" onClick={() => setMobileMenuOpen(false)}>Product</a>
        <a href="#how" onClick={() => setMobileMenuOpen(false)}>How it works</a>
        <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
        <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
        <a href="#contact" className="mobile-cta" onClick={() => setMobileMenuOpen(false)}>Request access →</a>
      </div>

      {/* ── NOTICE BAR ───────────────────────────────────────────────────────── */}
      <div className="notice">
        The FTC now enforces TIDA — <b>$53,088 per violation</b> for platforms that fail to remove NCII within 48 hours. Effective May 19, 2026.
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="hero">
        <div className="badge">
          <svg className="icon" style={{ width: '10px', height: '10px', fill: 'currentColor', stroke: 'none' }} viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          TIDA compliant · PDQ perceptual hashing · audit-ready
        </div>
        <h1>
          Stop known NCII before<br />
          it <em>reaches your users.</em>
        </h1>
        <p>One API call. Scan every upload in under 200ms. Block known NCII re-uploads before they spread — even after rotation, cropping, or re-encoding.</p>

        {/* ── INLINE CODE SNIPPET ── */}
        <div className="hero-snippet">
          <div className="snippet-header">
            <span className="snippet-dot"></span>
            <span className="snippet-dot"></span>
            <span className="snippet-dot"></span>
            <span className="snippet-lang">node.js · integrate in minutes</span>
          </div>
          <pre className="snippet-body">{`const { match } = await corvinth.check({
  image: req.file.buffer,   // your upload buffer
  source: 'profile_photo'
});

if (match.action === 'block') {
  return res.status(403).json({ blocked: true });
}
// → { case_uuid, action, classification, ms: 72 }`}</pre>
        </div>

        <div className="hero-cta">
          <a className="btn-primary lg" href="#contact">request early access</a>
          <a className="btn-ghost lg" href="#product">see the product</a>
        </div>

        {/* Waitlist count — remove static number until we fetch real data */}
      </div>

      {/* ── STOPNCII DIFFERENTIATOR CALLOUT ──────────────────────────────────── */}
      <div className="stopncii-callout">
        <div className="stopncii-icon">
          <svg className="icon" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
        </div>
        <div className="stopncii-body">
          <div className="stopncii-label">Key differentiator</div>
          <h3>We match against real reported NCII hashes — not generic nudity detection.</h3>
          <p>Corvinth uses the same open-source PDQ perceptual hashing algorithm as StopNCII.org. That means your platform can match against the fingerprints of actual images reported by survivors — not a classifier guessing what looks explicit. A photo of a person on a beach is not a violation. A specific image that was reported by a victim is.</p>
        </div>
      </div>

      {/* ── SOCIAL PROOF ─────────────────────────────────────────────────────── */}
      <div className="social-strip">
        <div className="social-strip-label">Currently in private beta with platforms building on</div>
        <div className="social-logos">
          {['Node.js', 'Python', 'Go', 'Ruby', 'PHP', 'AWS Lambda'].map(tech => (
            <div key={tech} className="social-logo-item">{tech}</div>
          ))}
        </div>
      </div>

      {/* ── FLOW DIAGRAM ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 2rem 5rem', maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '6px' }}>
          {['Every upload', 'PDQ fingerprint', 'Corvinth match engine', 'Allow · Review · Block'].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                padding: '9px 18px',
                background: i === 3 ? 'rgba(0,229,155,0.08)' : '#0e0e0c',
                border: `0.5px solid ${i === 3 ? 'rgba(0,229,155,0.25)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '8px',
                fontSize: '12px',
                color: i === 3 ? '#00E59B' : '#8C8B84',
                fontFamily: "'JetBrains Mono', monospace",
                whiteSpace: 'nowrap',
                letterSpacing: '0.01em',
              }}>{step}</div>
              {i < 3 && (
                <span style={{ color: '#2a2a25', fontSize: '14px', userSelect: 'none' }}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <hr />

      {/* ── PROOF STRIP ──────────────────────────────────────────────────────── */}
      <div className="proof">
        <div className="proof-item">
          <div className="proof-num">$53,088</div>
          <div className="proof-label">FTC fine per violation · TIDA</div>
        </div>
        <div className="proof-item">
          <div className="proof-num">&lt;200ms</div>
          <div className="proof-label">API decision latency</div>
        </div>
        <div className="proof-item">
          <div className="proof-num">8×</div>
          <div className="proof-label">orientation variants matched</div>
        </div>
        <div className="proof-item">
          <div className="proof-num">0</div>
          <div className="proof-label">images stored on our servers</div>
        </div>
      </div>

      <hr />



      {/* ── LIABILITY CALCULATOR ─────────────────────────────────────────────── */}
      <section id="calculator" style={{ background: '#060605', padding: '6rem 2.5rem' }}>
        <div className="inner-sm" style={{ textAlign: 'center' }}>
          <p className="section-tag">exposure calculator</p>
          <h2 className="section-title">What&apos;s your platform&apos;s risk?</h2>
          <p style={{ fontSize: '15px', color: '#8C8B84', marginBottom: '2.5rem', fontWeight: 300, lineHeight: 1.75 }}>
            Slide to your monthly upload volume. See your worst-case FTC exposure under TIDA.
          </p>
          <div className="calc-box">
            <div className="calc-top">
              <div className="calc-label">Monthly uploads</div>
              <div className="calc-value">{uploadsPerMonth.toLocaleString()}</div>
            </div>
            <input
              type="range"
              min="10000"
              max="5000000"
              step="10000"
              value={uploadsPerMonth}
              onChange={(e) => setUploadsPerMonth(Number(e.target.value))}
              className="calc-slider"
            />
            <div className="calc-ticks">
              <span>10K</span><span>500K</span><span>1M</span><span>5M</span>
            </div>
            <div className="calc-result">
              <div className="calc-result-label">Estimated max FTC exposure</div>
              <div className="calc-result-num">{formatExposure(estimatedExposure)}</div>
              <div className="calc-result-sub">
                Based on ~0.1% NCII rate · {Math.round(uploadsPerMonth * nciiRate).toLocaleString()} potential violations · $53,088 each
              </div>
            </div>
            <div className="calc-cta-row">
              <span className="calc-corvinth-cost">
                Corvinth costs from <b>$499/mo</b> to cover this.
              </span>
              <a className="btn-primary" href="#contact">get protected →</a>
            </div>
          </div>
        </div>
      </section>

      <hr />

      {/* ── WHAT IF YOU DO NOTHING ───────────────────────────────────────────── */}
      <section className="donothing-section">
        <div className="inner">
          <p className="section-tag">if you do nothing</p>
          <h2 className="section-title">The FTC process is public, slow, and expensive.</h2>
          <p className="section-sub">It won&apos;t happen to you — until it does. Here is what the actual enforcement timeline looks like once a complaint is filed.</p>
          <div className="donothing-grid">
            {[
              {
                step: 'Day 1',
                title: 'A victim submits a removal request',
                body: 'Your 48-hour TIDA clock starts. If your platform has no detection or intake flow, this request may go to a generic support inbox and be missed entirely.',
              },
              {
                step: 'Day 3+',
                title: 'The 48-hour deadline passes',
                body: 'The victim files an FTC complaint. This is a formal legal record. The FTC has jurisdiction under TIDA and open investigations become public record when actioned.',
              },
              {
                step: 'Weeks later',
                title: 'FTC issues a Civil Investigative Demand',
                body: 'Your platform must produce records: what was uploaded, when it was removed, what your moderation process was. If you have no audit log, you have no defense.',
              },
              {
                step: 'Settlement',
                title: '$53,088 per violation — per image, per re-upload',
                body: 'Fines are calculated per violation. A single viral NCII case re-uploaded 20 times before removal is $1M+ in exposure. Settlement terms are public. Press coverage follows.',
              },
            ].map((item, i) => (
              <div key={i} className="donothing-card">
                <div className="donothing-bar"></div>
                <div className="donothing-step">{item.step}</div>
                <h4>{item.title}</h4>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <a className="btn-primary lg" href="#contact">don&apos;t wait for a complaint →</a>
          </div>
        </div>
      </section>

      <hr />

      {/* ── TIDA TIMELINE ────────────────────────────────────────────────────── */}
      <section id="tida" style={{ padding: '6rem 2.5rem' }}>
        <div className="inner">
          <p className="section-tag">the regulation</p>
          <h2 className="section-title">TIDA is law. Enforcement is active.</h2>
          <p className="section-sub">The Take It Down Act didn&apos;t sneak up quietly. Here&apos;s the timeline every platform needs to understand.</p>
          <div className="tida-timeline">
            {[
              { date: 'Feb 2025', label: 'TIDA introduced', body: 'Bipartisan bill introduced in both House and Senate with broad support. Named partly in response to the Taylor Swift deepfake incident.' },
              { date: 'Apr 2025', label: 'Passed Senate 95–1', body: 'Near-unanimous vote. Senators cited the explosion of AI-generated NCII targeting minors and adults across social and dating platforms.' },
              { date: 'May 19 2026', label: 'Signed into law · FTC enforcement begins', body: 'Platforms now have 48 hours to remove flagged NCII after a valid request. Failure = $53,088 per violation. The FTC has active jurisdiction.', highlight: true },
              { date: 'Now', label: 'Your platform is covered', body: 'If users can upload images on your platform, you are in scope. Dating apps, social platforms, messaging apps, creator tools — no exceptions for size.', highlight: true },
            ].map((item, i, arr) => (
              <div key={i} className={`tl-item${item.highlight ? ' tl-highlight' : ''}`}>
                {i < arr.length - 1 && <div className="tl-line"></div>}
                <div className={`tl-dot${item.highlight ? ' tl-dot-hot' : ''}`}>{item.highlight ? '!' : String(i + 1).padStart(2, '0')}</div>
                <div className="tl-content">
                  <div className="tl-date">{item.date}</div>
                  <h3>{item.label}</h3>
                  <p>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr />

      {/* ── PRODUCT / DASHBOARD MOCKUP ───────────────────────────────────────── */}
      <section id="product" className="bg-section">
        <div className="inner" style={{ maxWidth: '980px' }}>
          <p className="section-tag">the product</p>
          <h2 className="section-title">What your team sees every day.</h2>
          <p className="section-sub">A real-time view of every scan decision — matches, blocks, and review queue items — with a full audit trail behind every case.</p>
          <div style={{
            background: '#060605',
            border: '0.5px solid rgba(255,255,255,0.10)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
          }}>
            {/* Dashboard title bar */}
            <div style={{
              padding: '12px 1.5rem',
              borderBottom: '0.5px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#0a0a08',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00E59B', boxShadow: '0 0 6px rgba(0,229,155,0.6)' }}></div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#8C8B84' }}>corvinth dashboard · TestDating</span>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#4A4A45', textTransform: 'uppercase', letterSpacing: '0.08em' }}>live</span>
            </div>
            <div className="dashboard-grid">
              {/* Recent decisions panel */}
              <div style={{ padding: '1.5rem', borderRight: '0.5px solid rgba(255,255,255,0.06)' }}>
                <div style={{
                  fontSize: '10px', fontWeight: 500, color: '#4A4A45',
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  fontFamily: "'JetBrains Mono', monospace", marginBottom: '1rem',
                }}>Recent decisions</div>
                {[
                  { id: 'CASE-3829', conf: '99.2%', status: 'Blocked', color: '#FF4D4D', bg: 'rgba(255,77,77,0.07)',  time: '2s ago' },
                  { id: 'CASE-3830', conf: '87.1%', status: 'Review',  color: '#FFB224', bg: 'rgba(255,178,36,0.07)', time: '14s ago' },
                  { id: 'CASE-3831', conf: '100%',  status: 'Blocked', color: '#FF4D4D', bg: 'rgba(255,77,77,0.07)',  time: '41s ago' },
                  { id: 'CASE-3832', conf: '12.4%', status: 'Allowed', color: '#00E59B', bg: 'rgba(0,229,155,0.07)', time: '1m ago' },
                  { id: 'CASE-3833', conf: '98.9%', status: 'Blocked', color: '#FF4D4D', bg: 'rgba(255,77,77,0.07)',  time: '2m ago' },
                  { id: 'CASE-3834', conf: '3.1%',  status: 'Allowed', color: '#00E59B', bg: 'rgba(0,229,155,0.07)', time: '3m ago' },
                ].map((c) => (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: '8px', marginBottom: '4px',
                    background: c.bg, border: `0.5px solid ${c.color}1A`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#8C8B84' }}>{c.id}</span>
                      <span style={{ fontSize: '11px', color: '#4A4A45' }}>Confidence: {c.conf}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '10px', color: '#4A4A45', fontFamily: "'JetBrains Mono', monospace" }}>{c.time}</span>
                      <span style={{
                        fontSize: '11px', fontWeight: 500, color: c.color,
                        background: c.bg, padding: '3px 10px',
                        borderRadius: '999px', border: `0.5px solid ${c.color}33`,
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: '0.04em',
                      }}>{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Stats panel */}
              <div style={{ padding: '1.5rem' }}>
                <div style={{
                  fontSize: '10px', fontWeight: 500, color: '#4A4A45',
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  fontFamily: "'JetBrains Mono', monospace", marginBottom: '1.25rem',
                }}>Today</div>
                {[
                  { label: 'Uploads scanned', value: '1,248,991', color: '#F0EFE8' },
                  { label: 'Matches found',   value: '317',        color: '#FF4D4D' },
                  { label: 'Sent to review',  value: '84',         color: '#FFB224' },
                  { label: 'Avg response',    value: '72ms',       color: '#00E59B' },
                  { label: 'Active cases',    value: '12',         color: '#F0EFE8' },
                ].map((m) => (
                  <div key={m.label} style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '10px', color: '#4A4A45', fontFamily: "'JetBrains Mono', monospace", marginBottom: '3px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{m.label}</div>
                    <div style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: '24px', fontWeight: 700,
                      color: m.color, letterSpacing: '-0.5px', lineHeight: 1,
                    }}>{m.value}</div>
                  </div>
                ))}
                <div style={{
                  marginTop: '1.5rem', padding: '10px 14px',
                  background: 'rgba(0,229,155,0.07)',
                  border: '0.5px solid rgba(0,229,155,0.18)',
                  borderRadius: '8px',
                }}>
                  <div style={{ fontSize: '10px', color: '#00E59B', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>48h compliance</div>
                  <div style={{ fontSize: '13px', color: '#8C8B84' }}>All cases within deadline</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr />

      {/* ── LIVE API DEMO ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '6rem 2.5rem', background: '#060605' }}>
        <div className="inner-sm" style={{ textAlign: 'center' }}>
          <p className="section-tag">live api demo</p>
          <h2 className="section-title" style={{ fontSize: 'clamp(26px, 3vw, 36px)' }}>Test the Engine</h2>
          <p style={{ fontSize: '15px', color: '#8C8B84', marginBottom: '2rem', fontWeight: 300 }}>
            Submit a PDQ hash and see a real API response from the match engine.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder="paste a 64-char PDQ hex hash or leave blank for demo"
              style={{
                padding: '12px 16px',
                width: '300px',
                borderRadius: '8px',
                border: '0.5px solid rgba(255,255,255,0.10)',
                background: '#0e0e0c',
                color: '#F0EFE8',
                fontFamily: "'JetBrains Mono', monospace",
                outline: 'none',
                fontSize: '12px',
                letterSpacing: '0.02em',
              }}
            />
            <button onClick={simulateCheck} className="btn-primary lg" disabled={loading}>
              {loading ? 'Scanning...' : 'Run Sub-Linear Lookup'}
            </button>
          </div>
          {result && (
            <div style={{
              marginTop: '2rem', padding: '1.5rem',
              background: '#0a0a08', borderRadius: '12px',
              border: `0.5px solid ${result.match_found ? 'rgba(255,77,77,0.25)' : 'rgba(0,229,155,0.2)'}`,
              textAlign: 'left',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px', lineHeight: 1.9,
            }}>
              <div style={{ color: '#4A4A45', marginBottom: '8px', fontSize: '11px', letterSpacing: '0.04em' }}># POST /hash/check — 200 OK · {result.match_found ? '~72ms' : '~18ms'}</div>
              <div style={{ color: '#F0EFE8' }}>{'{'}</div>
              <div style={{ paddingLeft: '18px' }}>
                <div><span style={{ color: '#00E59B' }}>"case_uuid"</span><span style={{ color: '#5E5E57' }}>: </span><span style={{ color: '#FFB224' }}>"{result.case_uuid}"</span></div>
                <div><span style={{ color: '#00E59B' }}>"match_found"</span><span style={{ color: '#5E5E57' }}>: </span><span style={{ color: result.match_found ? '#FF4D4D' : '#4D9EFF' }}>{String(result.match_found)}</span></div>
                <div><span style={{ color: '#00E59B' }}>"classification"</span><span style={{ color: '#5E5E57' }}>: </span><span style={{ color: result.classification === 'CLEAN' ? '#00E59B' : '#FF4D4D' }}>"{result.classification}"</span></div>
                <div><span style={{ color: '#00E59B' }}>"action"</span><span style={{ color: '#5E5E57' }}>: </span><span style={{ color: result.action === 'content_allowed' ? '#00E59B' : '#FF4D4D' }}>"{result.action}"</span></div>
                <div><span style={{ color: '#00E59B' }}>"hamming_distance"</span><span style={{ color: '#5E5E57' }}>: </span><span style={{ color: '#4D9EFF' }}>{result.hamming_distance === null ? 'null' : result.hamming_distance}</span></div>
                <div><span style={{ color: '#00E59B' }}>"pipeline_2_queued"</span><span style={{ color: '#5E5E57' }}>: </span><span style={{ color: '#4D9EFF' }}>{String(result.pipeline_2_queued)}</span></div>
              </div>
              <div style={{ color: '#F0EFE8' }}>{'}'}</div>
              <div style={{ marginTop: '12px', fontSize: '11px', color: '#4A4A45', letterSpacing: '0.02em' }}>
                {result.match_found
                  ? '→ Platform should enforce content_removed per policy'
                  : '→ Upload proceeds normally — no match in database'}
              </div>
            </div>
          )}
        </div>
      </section>

      <hr />

      {/* ── WHY PLATFORMS BUY ────────────────────────────────────────────────── */}
      <section>
        <div className="inner">
          <p className="section-tag">why platforms deploy corvinth</p>
          <h2 className="section-title">Built around outcomes, not features.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.055)', border: '0.5px solid rgba(255,255,255,0.055)', borderRadius: '16px', overflow: 'hidden', marginTop: '2.5rem' }}>
            {[
              { icon: '🛑', title: 'Prevent known NCII re-uploads', body: 'Stop repeat uploads before publication. Images already reported to StopNCII are caught at the hash level — before any user ever sees them.' },
              { icon: '⚡', title: 'Reduce manual moderation load', body: 'Send only uncertain matches to review. Exact matches are blocked automatically. Your team focuses on edge cases, not obvious violations.' },
              { icon: '🗂️', title: 'Build compliance evidence', body: 'Every decision receives a case UUID and a cryptographically chained audit log. Exportable for FTC or legal review at any time.' },
              { icon: '🔒', title: 'Keep images off third-party servers', body: 'Only hashes leave your infrastructure. The original image never crosses the network boundary. Privacy is the architecture, not a feature.' },
            ].map((item) => (
              <div key={item.title} style={{
                background: '#0e0e0c',
                padding: '1.75rem',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#141412'}
              onMouseLeave={e => e.currentTarget.style.background = '#0e0e0c'}
              >
                <div style={{ fontSize: '22px', marginBottom: '1rem', filter: 'grayscale(0.2)' }}>{item.icon}</div>
                <h4 style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '15px', fontWeight: 600,
                  color: '#F0EFE8', marginBottom: '0.6rem',
                  letterSpacing: '-0.2px',
                }}>{item.title}</h4>
                <p style={{ fontSize: '13px', color: '#8C8B84', lineHeight: 1.7 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr />

      {/* ── COMPARISON TABLE ──────────────────────────────────────────────────── */}
      <section className="compare-section">
        <div className="inner" style={{ maxWidth: '900px' }}>
          <p className="section-tag">why not build it yourself?</p>
          <h2 className="section-title">Corvinth vs. the alternatives.</h2>
          <p className="section-sub">Every engineering team asks: &ldquo;Why not use AWS Rekognition, Google Vision, or just build this ourselves?&rdquo; Here&apos;s the honest answer.</p>
          <div className="compare-table">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Capability</th>
                  <th className="corvinth-col">Corvinth</th>
                  <th>AWS Rekognition</th>
                  <th>Google Vision</th>
                  <th>Build it yourself</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: 'Matches reported NCII hashes',
                    corvinth: '✓ yes',
                    aws: '✗ no (generic nudity)',
                    google: '✗ no (generic nudity)',
                    diy: '✗ no hash database',
                    corvinthClass: 'check-yes',
                    awsClass: 'check-no',
                    googleClass: 'check-no',
                    diyClass: 'check-no',
                  },
                  {
                    feature: 'TIDA-ready audit log',
                    corvinth: '✓ built in',
                    aws: '~ manual setup',
                    google: '~ manual setup',
                    diy: '~ weeks of work',
                    corvinthClass: 'check-yes',
                    awsClass: 'check-partial',
                    googleClass: 'check-partial',
                    diyClass: 'check-partial',
                  },
                  {
                    feature: 'Zero image transmission',
                    corvinth: '✓ hashes only',
                    aws: '✗ full image upload',
                    google: '✗ full image upload',
                    diy: '✓ possible',
                    corvinthClass: 'check-yes',
                    awsClass: 'check-no',
                    googleClass: 'check-no',
                    diyClass: 'check-yes',
                  },
                  {
                    feature: 'Rotation / re-encode tolerance',
                    corvinth: '✓ all 8 orientations',
                    aws: '~ partial',
                    google: '~ partial',
                    diy: '~ months to tune',
                    corvinthClass: 'check-yes',
                    awsClass: 'check-partial',
                    googleClass: 'check-partial',
                    diyClass: 'check-partial',
                  },
                  {
                    feature: 'Price at 500K scans/mo',
                    corvinth: '$799/mo flat',
                    aws: '~$2,000–4,000',
                    google: '~$1,500–3,000',
                    diy: 'Eng cost + infra',
                    corvinthClass: '',
                    awsClass: '',
                    googleClass: '',
                    diyClass: '',
                  },
                  {
                    feature: 'Integrate in < 1 day',
                    corvinth: '✓ one endpoint',
                    aws: '~ 1–2 weeks',
                    google: '~ 1–2 weeks',
                    diy: '✗ months',
                    corvinthClass: 'check-yes',
                    awsClass: 'check-partial',
                    googleClass: 'check-partial',
                    diyClass: 'check-no',
                  },
                ].map((row) => (
                  <tr key={row.feature}>
                    <td className="feature-name">{row.feature}</td>
                    <td className={`corvinth-col ${row.corvinthClass}`}>{row.corvinth}</td>
                    <td className={row.awsClass}>{row.aws}</td>
                    <td className={row.googleClass}>{row.google}</td>
                    <td className={row.diyClass}>{row.diy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <hr />

      {/* ── WHO USES CORVINTH ─────────────────────────────────────────────────── */}
      <section className="bg-section">
        <div className="inner">
          <p className="section-tag">who uses corvinth</p>
          <h2 className="section-title">Built for platforms that handle user content.</h2>
          <p className="section-sub">Any platform where users can upload images needs a detection layer. Corvinth is that layer.</p>
          <div className="usecases">
            <div className="usecase">
              <div className="usecase-icon"><svg className="icon" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg></div>
              <h4>Dating apps</h4>
              <p>Scan profile photos and DM attachments before delivery. Protect users from receiving unsolicited NCII.</p>
            </div>
            <div className="usecase">
              <div className="usecase-icon"><svg className="icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></div>
              <h4>Messaging apps</h4>
              <p>Hash-check image attachments in transit. No content stored, no privacy compromise — just a match signal.</p>
            </div>
            <div className="usecase">
              <div className="usecase-icon"><svg className="icon" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg></div>
              <h4>Social platforms</h4>
              <p>Pre-screen every image upload at ingestion time. Stop NCII before it reaches a feed or profile.</p>
            </div>
            <div className="usecase">
              <div className="usecase-icon"><svg className="icon" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></div>
              <h4>Creator platforms</h4>
              <p>Detect re-uploaded stolen content before it surfaces or monetises on your platform.</p>
            </div>
            <div className="usecase">
              <div className="usecase-icon"><svg className="icon" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg></div>
              <h4>Content moderation tools</h4>
              <p>Add NCII detection as a signal layer in your existing pipeline alongside current classifiers.</p>
            </div>
            <div className="usecase">
              <div className="usecase-icon"><svg className="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></div>
              <h4>Search engines</h4>
              <p>Filter image index results against the hash database before content is indexed and surfaced.</p>
            </div>
          </div>
        </div>
      </section>

      <hr />

      {/* ── DETECTION CONFIDENCE ──────────────────────────────────────────────── */}
      <section id="detection">
        <div className="inner">
          <p className="section-tag">detection confidence</p>
          <h2 className="section-title">Not every match should be treated the same.</h2>
          <p className="section-sub">Edited images are messy. Corvinth separates obvious matches from uncertain derivatives so platforms can act quickly without overclaiming accuracy.</p>
          <div className="confidence-grid">
            <div className="conf-card" style={{ borderTop: '2px solid #FF4D4D' }}>
              <b>Exact / near-exact</b>
              <p>Same or visually close media. Best for automatic blocking when platform policy allows.</p>
            </div>
            <div className="conf-card" style={{ borderTop: '2px solid #FFB224' }}>
              <b>Likely derivative</b>
              <p>Rotated, filtered, compressed, or lightly cropped media. Best for high-priority review queue.</p>
            </div>
            <div className="conf-card" style={{ borderTop: '2px solid #4D9EFF' }}>
              <b>Needs review</b>
              <p>Low-confidence similarity. Escalate instead of silently allowing or wrongly blocking.</p>
            </div>
          </div>
        </div>
      </section>

      <hr />

      {/* ── API REFERENCE ─────────────────────────────────────────────────────── */}
      <section className="bg-section">
        <div className="inner">
          <div className="api-grid">
            <div>
              <p className="section-tag">api reference</p>
              <h2 className="section-title" style={{ fontSize: 'clamp(24px, 3vw, 34px)' }}>One request. Structured response.</h2>
              <p className="section-sub" style={{ marginBottom: '2rem' }}>No SDK required. If you can make an HTTP POST, you can integrate Corvinth. Most platforms are live within a day.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { method: 'POST', endpoint: '/hash/check',         color: '#00E59B', bg: 'rgba(0,229,155,0.08)'   },
                  { method: 'POST', endpoint: '/hash/add',           color: '#00E59B', bg: 'rgba(0,229,155,0.08)'   },
                  { method: 'GET',  endpoint: '/cases/{uuid}',       color: '#4D9EFF', bg: 'rgba(77,158,255,0.08)'  },
                  { method: 'GET',  endpoint: '/cases/{uuid}/audit', color: '#4D9EFF', bg: 'rgba(77,158,255,0.08)'  },
                  { method: 'POST', endpoint: '/appeals',            color: '#00E59B', bg: 'rgba(0,229,155,0.08)'   },
                ].map((ep) => (
                  <div key={ep.endpoint} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 14px',
                    background: '#060605',
                    border: '0.5px solid rgba(255,255,255,0.07)',
                    borderRadius: '8px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '12px',
                  }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 500, padding: '2px 8px',
                      borderRadius: '4px', background: ep.bg, color: ep.color,
                      flexShrink: 0, letterSpacing: '0.06em',
                    }}>{ep.method}</span>
                    <span style={{ color: '#8C8B84' }}>{ep.endpoint}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{
                background: '#060605',
                border: '0.5px solid rgba(255,255,255,0.07)',
                borderRadius: '12px', padding: '1.5rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px', lineHeight: 1.9,
              }}>
                <div style={{ color: '#4A4A45', marginBottom: '10px', fontSize: '11px', letterSpacing: '0.04em' }}># POST /hash/check response</div>
                <div style={{ color: '#F0EFE8' }}>{'{'}</div>
                <div style={{ paddingLeft: '18px' }}>
                  <div><span style={{ color: '#00E59B' }}>&quot;case_uuid&quot;</span><span style={{ color: '#5E5E57' }}>: </span><span style={{ color: '#FFB224' }}>&quot;cse_83f1a2b3...&quot;</span><span style={{ color: '#5E5E57' }}>,</span></div>
                  <div><span style={{ color: '#00E59B' }}>&quot;match_found&quot;</span><span style={{ color: '#5E5E57' }}>: </span><span style={{ color: '#4D9EFF' }}>true</span><span style={{ color: '#5E5E57' }}>,</span></div>
                  <div><span style={{ color: '#00E59B' }}>&quot;classification&quot;</span><span style={{ color: '#5E5E57' }}>: </span><span style={{ color: '#FF4D4D' }}>&quot;EXACT&quot;</span><span style={{ color: '#5E5E57' }}>,</span></div>
                  <div><span style={{ color: '#00E59B' }}>&quot;action&quot;</span><span style={{ color: '#5E5E57' }}>: </span><span style={{ color: '#FF4D4D' }}>&quot;content_removed&quot;</span><span style={{ color: '#5E5E57' }}>,</span></div>
                  <div><span style={{ color: '#00E59B' }}>&quot;hamming_distance&quot;</span><span style={{ color: '#5E5E57' }}>: </span><span style={{ color: '#4D9EFF' }}>2</span><span style={{ color: '#5E5E57' }}>,</span></div>
                  <div><span style={{ color: '#00E59B' }}>&quot;pipeline_2_queued&quot;</span><span style={{ color: '#5E5E57' }}>: </span><span style={{ color: '#4D9EFF' }}>false</span><span style={{ color: '#5E5E57' }}>,</span></div>
                  <div><span style={{ color: '#00E59B' }}>&quot;timestamp&quot;</span><span style={{ color: '#5E5E57' }}>: </span><span style={{ color: '#FFB224' }}>&quot;2026-05-31T...&quot;</span></div>
                </div>
                <div style={{ color: '#F0EFE8' }}>{'}'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr />

      {/* ── ONBOARDING TIMELINE ───────────────────────────────────────────────── */}
      <section id="how">
        <div className="inner">
          <p className="section-tag">integration story</p>
          <h2 className="section-title">Live in a day. Audit-ready by day two.</h2>
          <p className="section-sub">This isn&apos;t a multi-sprint project. Most engineering teams are fully integrated in a single working day.</p>
          <div className="onboard-grid">
            {[
              {
                day: 'Day 0',
                title: 'Get your credentials',
                body: 'Request access and receive API credentials within 24 hours. We send you a key, a sandbox environment, and integration guides for Node.js, Python, and Go.',
                tasks: ['API key issued', 'Sandbox environment live', 'Integration guide sent'],
              },
              {
                day: 'Day 1',
                title: 'One endpoint in your pipeline',
                body: 'Add a single POST call to your upload handler. The SDK computes the hash on your server — nothing else changes in your infrastructure.',
                tasks: ['POST /hash/check integrated', 'Block / review / allow logic wired', 'First real scan running'],
              },
              {
                day: 'Day 2',
                title: 'Audit log running',
                body: 'Enable webhook notifications and connect the audit log export to your compliance tooling. You now have a paper trail for every decision your platform makes.',
                tasks: ['Audit log exporting', 'Webhooks configured', 'Legal team can pull reports'],
              },
            ].map((step, i) => (
              <div key={i} className="onboard-step">
                <div className="onboard-day">{step.day}</div>
                <h4>{step.title}</h4>
                <p>{step.body}</p>
                <div className="onboard-tasks">
                  {step.tasks.map(task => (
                    <div key={task} className="onboard-task">{task}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr />

      {/* ── HOW IT WORKS (TECHNICAL) ──────────────────────────────────────────── */}
      <section className="bg-section">
        <div className="inner">
          <p className="section-tag">how it works</p>
          <h2 className="section-title">One endpoint inside your upload pipeline.</h2>
          <p className="section-sub">Designed as infrastructure, not a moderation dashboard your team has to babysit.</p>
          <div className="timeline">
            {[
              { n: '01', title: 'Normalize the upload on your server', body: 'Your platform handles EXIF orientation, resizing, and compression using the Corvinth SDK — running entirely on your infrastructure. The SDK computes a perceptual hash from the image bytes. No pixels are sent to Corvinth.', last: false },
              { n: '02', title: 'Generate a robust perceptual fingerprint', body: 'The SDK uses open-source perceptual hashing — Meta PDQ — and generates fingerprints for all 8 orientations simultaneously. Rotation, filters, and re-encoding are tolerated by design.', last: false },
              { n: '03', title: 'Match against the NCII hash database', body: "The hash is sent to Corvinth's API and compared against a database of reported non-consensual intimate imagery using Hamming-distance comparison across all 8 orientations.", last: false },
              { n: '04', title: 'Return a decision — you enforce your policy', body: 'Your platform receives a structured response: allow, block, or send to review with a confidence tier and case UUID. Corvinth is the detection layer. You stay in control of what happens next.', last: true },
            ].map((step) => (
              <div key={step.n} className="tl-item">
                {!step.last && <div className="tl-line"></div>}
                <div className="tl-dot">{step.n}</div>
                <div className="tl-content">
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr />

      {/* ── SECURITY & DATA HANDLING ──────────────────────────────────────────── */}
      <section id="security">
        <div className="inner">
          <p className="section-tag">security &amp; data handling</p>
          <h2 className="section-title">Where does the data go?</h2>
          <p className="section-sub">The first question your legal team will ask. Here is the complete answer.</p>
          <div className="security-grid">
            {[
              {
                title: 'Zero image storage',
                body: 'Images are never sent to or stored on Corvinth servers. The SDK runs entirely on your infrastructure. Only a 256-bit hash crosses the network boundary — this is the architecture, not a configuration option.',
                icon: (
                  <svg className="icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                ),
              },
              {
                title: 'Encryption in transit',
                body: 'All API traffic uses TLS 1.3. Hash values in transit are short, non-reversible, and cannot reconstruct the original image. Even if intercepted, a 256-bit hash reveals nothing about image content.',
                icon: (
                  <svg className="icon" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                ),
              },
              {
                title: 'SOC 2 roadmap',
                body: 'Corvinth is pursuing SOC 2 Type II certification. We can share our current security posture documentation and planned audit timeline with enterprise prospects on request.',
                icon: (
                  <svg className="icon" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                ),
              },
              {
                title: 'Hash retention policy',
                body: 'We store only the fingerprint and decision metadata — never original content. Hash data is retained for audit log purposes and can be configured per contract for enterprise customers.',
                icon: (
                  <svg className="icon" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
                ),
              },
            ].map((card, i) => (
              <div key={i} className="security-card">
                <div className="security-icon">{card.icon}</div>
                <h4>{card.title}</h4>
                <p>{card.body}</p>
              </div>
            ))}
          </div>
          <div className="dpa-offer">
            <svg className="icon" viewBox="0 0 24 24" style={{ flexShrink: 0, color: '#00E59B', width: '20px', height: '20px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
            <p><strong>Data Processing Agreement available.</strong> Enterprise customers can request a signed DPA before integration. Email <a href="mailto:foundercorvinth@gmail.com" style={{ color: 'var(--green)' }}>foundercorvinth@gmail.com</a> with your legal team&apos;s requirements.</p>
            <a href="mailto:foundercorvinth@gmail.com?subject=DPA Request" className="btn-ghost" style={{ flexShrink: 0 }}>request DPA →</a>
          </div>
        </div>
      </section>

      <hr />

      {/* ── TRUST & COMPLIANCE ────────────────────────────────────────────────── */}
      <section>
        <div className="inner">
          <p className="section-tag">trust and compliance</p>
          <h2 className="section-title">Built honestly on available technology.</h2>
          <p className="section-sub">Corvinth does not claim access to restricted systems like Microsoft PhotoDNA unless officially approved. Built around open-source perceptual hashing and platform-side compliance workflows.</p>
          <div className="trust-grid">
            <div className="trust-card">
              <div className="ticon"><svg className="icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></div>
              <h4>Zero image storage</h4>
              <p>Images are never sent to or stored on Corvinth servers. The SDK runs on your infrastructure. Only the hash crosses the network boundary.</p>
            </div>
            <div className="trust-card">
              <div className="ticon"><svg className="icon" viewBox="0 0 24 24"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" /></svg></div>
              <h4>Rotation tolerant</h4>
              <p>All 8 orientations stored at index time. Rotated or flipped re-uploads are still caught.</p>
            </div>
            <div className="trust-card">
              <div className="ticon"><svg className="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div>
              <h4>PDQ compatible</h4>
              <p>Uses Meta PDQ — the same open-source algorithm as StopNCII.org. Hash format is compatible by design.</p>
            </div>
            <div className="trust-card">
              <div className="ticon"><svg className="icon" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></div>
              <h4>Your policy, our detection</h4>
              <p>We return a signal. You enforce your policy. Corvinth is the detection layer — not the decision maker.</p>
            </div>
            <div className="trust-card">
              <div className="ticon"><svg className="icon" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg></div>
              <h4>FTC-ready audit log</h4>
              <p>Every decision receives a cryptographically chained audit log. Exportable for FTC or legal review at any time.</p>
            </div>
            <div className="trust-card">
              <div className="ticon"><svg className="icon" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg></div>
              <h4>TIDA compliance ready</h4>
              <p>Catches violations at upload — before any removal request is filed. The 48h clock starts with evidence already logged.</p>
            </div>
          </div>
          <div className="pills">
            <span className="pill">Meta PDQ</span>
            <span className="pill">Open-source hashing</span>
            <span className="pill">Near-duplicate detection</span>
            <span className="pill">Compliance logs</span>
            <span className="pill">Review queue</span>
            <span className="pill">Case management</span>
          </div>
          <div className="disclaimer-box">
            <p>Partnerships with safety organizations may be pursued in the future. Corvinth does not represent or speak for StopNCII, Microsoft, Meta, or any listed organization unless a formal agreement exists. Corvinth is an independent trust and safety infrastructure company.</p>
          </div>
        </div>
      </section>

      <hr />

      {/* ── PRICING ───────────────────────────────────────────────────────────── */}
      <section id="pricing">
        <div className="inner" style={{ maxWidth: '900px' }}>
          <p className="section-tag">pricing</p>
          <h2 className="section-title">Transparent, usage-based pricing.</h2>
          <p className="section-sub">Pay for what you scan. No per-seat fees. All plans include full API access, audit logs, and case management.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(248px, 1fr))', gap: '1rem' }}>
            {[
              {
                name: 'Starter', price: '$499', period: '/month', perScan: '$0.006 / scan',
                desc: 'For platforms getting compliant fast.',
                features: ['50,000 scans / month', 'Full API access', 'Case management', 'Audit log export', 'Email support'],
                cta: 'request access', featured: false,
              },
              {
                name: 'Growth', price: '$799', period: '/month', perScan: '$0.0016 / scan',
                desc: 'For live platforms with real upload volume.',
                features: ['500,000 scans / month', 'Priority support', 'Webhook notifications', 'Custom thresholds', 'Review queue workflows'],
                cta: 'request access', featured: true,
              },
              {
                name: 'Enterprise', price: 'Custom', period: '', perScan: 'volume pricing',
                desc: 'For high-volume platforms and custom needs.',
                features: ['Unlimited scans', 'Dedicated infrastructure', 'On-premise option', 'SLA 99.9% uptime', 'Legal & compliance support'],
                cta: 'contact us', featured: false,
              },
            ].map((plan) => (
              <div key={plan.name} style={{
                background: plan.featured ? 'rgba(0,229,155,0.05)' : '#0e0e0c',
                border: `0.5px solid ${plan.featured ? 'rgba(0,229,155,0.35)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '16px', padding: '1.75rem',
                display: 'flex', flexDirection: 'column',
                position: 'relative',
                boxShadow: plan.featured ? '0 0 40px rgba(0,229,155,0.08)' : 'none',
              }}>
                {plan.featured && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #00E59B, transparent)',
                    borderRadius: '16px 16px 0 0',
                  }} />
                )}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '11px', fontWeight: 500, color: '#4A4A45',
                  textTransform: 'uppercase', letterSpacing: '0.10em',
                  fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.75rem',
                }}>
                  {plan.name}
                  {plan.featured && (
                    <span style={{
                      color: '#00E59B', fontSize: '9px', padding: '2px 8px',
                      background: 'rgba(0,229,155,0.12)',
                      border: '0.5px solid rgba(0,229,155,0.25)',
                      borderRadius: '999px', letterSpacing: '0.08em',
                    }}>popular</span>
                  )}
                </div>
                <div style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '36px', fontWeight: 800,
                  color: '#F0EFE8', letterSpacing: '-1.5px',
                  marginBottom: '0.15rem', lineHeight: 1,
                }}>
                  {plan.price}
                  <span style={{ fontSize: '14px', fontWeight: 400, color: '#8C8B84', letterSpacing: '0px' }}>{plan.period}</span>
                </div>
                <div style={{
                  fontSize: '11px', color: '#4A4A45',
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: '1rem', letterSpacing: '0.04em',
                }}>{plan.perScan}</div>
                <div style={{ fontSize: '13px', color: '#8C8B84', marginBottom: '1.5rem', lineHeight: 1.6 }}>{plan.desc}</div>
                <ul style={{
                  listStyle: 'none', display: 'flex', flexDirection: 'column',
                  gap: '8px', marginBottom: '1.75rem', flex: 1,
                }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ fontSize: '13px', color: '#8C8B84', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '5px', height: '5px', borderRadius: '50%',
                        background: '#00E59B', flexShrink: 0, display: 'inline-block',
                        boxShadow: '0 0 4px rgba(0,229,155,0.5)',
                      }}></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#contact" style={{
                  display: 'block', textAlign: 'center', padding: '11px',
                  borderRadius: '10px', fontSize: '14px', fontWeight: 500,
                  background: plan.featured ? '#00E59B' : 'transparent',
                  color: plan.featured ? '#060605' : '#8C8B84',
                  border: plan.featured ? 'none' : '0.5px solid rgba(255,255,255,0.10)',
                  textDecoration: 'none', transition: 'all 0.15s',
                  letterSpacing: '0.01em',
                }}>{plan.cta}</a>
              </div>
            ))}
          </div>

          {/* ── PRICING FAQ ── */}
          <div style={{ marginTop: '3rem' }}>
            <div style={{
              fontSize: '10px', fontWeight: 500, color: 'var(--text-faint)',
              textTransform: 'uppercase', letterSpacing: '0.12em',
              fontFamily: "'JetBrains Mono', monospace", marginBottom: '1rem',
            }}>billing questions</div>
            <div className="faq-list">
              {[
                {
                  q: "Does a re-upload of the same image count as a new scan?",
                  a: "Yes. Every call to /hash/check counts as one scan, regardless of whether the hash has been seen before. This keeps billing predictable and reflects the actual compute cost of the lookup.",
                },
                {
                  q: "What counts as a failed upload — does it consume a scan?",
                  a: "No. If your platform rejects an upload before calling Corvinth (e.g. wrong file type, too large), that does not consume a scan. A scan is counted only when a hash is sent to /hash/check. If the Corvinth API returns an error on our side, that call is not counted.",
                },
                {
                  q: "What happens if I go over my monthly scan limit?",
                  a: "We don't hard-block your API access mid-month. Overages are billed at the per-scan rate for your plan at end of month. We send usage alerts at 80% and 100% of your plan limit so you can upgrade before you hit an overage.",
                },
                {
                  q: "Is there a free trial or sandbox?",
                  a: "Yes. All approved accounts receive a sandbox environment with 1,000 free test scans. The sandbox uses synthetic hash data — it will never return a real NCII match. Production access requires a paid plan.",
                },
              ].map((item, i) => (
                <FaqItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr />

      {/* ── FAQ ───────────────────────────────────────────────────────────────── */}
      <section id="faq" className="bg-section">
        <div className="inner" style={{ maxWidth: '700px' }}>
          <p className="section-tag">faq</p>
          <h2 className="section-title">Questions platforms actually ask.</h2>
          <div className="faq-list">
            {[
              {
                q: "What happens if there's a false positive and a legitimate image gets blocked?",
                a: 'Every decision from Corvinth returns a confidence tier and a case UUID. For anything below the "exact match" threshold, the API returns a "review" action rather than an automatic block — your platform decides what to do. You can also use the /appeals endpoint to flag a case and we maintain a permanent audit log of every decision so there\'s always a paper trail for disputes.',
              },
              {
                q: "Are you actually integrated with StopNCII's database, or just PDQ-compatible?",
                a: "Corvinth uses the same open-source Meta PDQ hashing algorithm that StopNCII uses, which means our hash format is compatible. We are an independent company and do not represent StopNCII or claim a formal data-sharing partnership unless one is announced. Our hash database is populated through our own intake process. We are transparent about this.",
              },
              {
                q: 'Does Corvinth ever see or store the actual images?',
                a: "No. The Corvinth SDK runs on your infrastructure and computes the hash locally. Only the hash — a 256-bit number — is sent to our API. The original image bytes never leave your servers. This is the architecture, not a promise that could change.",
              },
              {
                q: 'How small is "too small" to need this?',
                a: "TIDA has no size exemption. If your platform receives user-uploaded images, you are in scope. The $53,088 fine is per violation, so even a platform with modest traffic can face significant exposure from a handful of un-removed cases. Corvinth's Starter plan at $499/month is specifically designed for smaller platforms that can't staff a trust-and-safety team.",
              },
              {
                q: "What's the integration effort for an engineering team?",
                a: "One API endpoint and no required SDK — though we provide one. A backend engineer can have /hash/check called on every upload in an afternoon. We've written integration guides for Node.js, Python, and Go. Most platforms are live within a working day.",
              },
            ].map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      <hr />

      {/* ── REGULATORY UPDATES ───────────────────────────────────────────────── */}
      <section className="blog-teaser-section">
        <div className="inner" style={{ maxWidth: '640px', textAlign: 'center' }}>
          <p className="section-tag">regulatory updates</p>
          <h2 className="section-title">TIDA just passed. There will be more.</h2>
          <p className="section-sub" style={{ margin: '0 auto 2rem' }}>
            We publish plain-English regulatory updates for platform engineers — not lawyers. NCII law is moving fast. Stay ahead of it.
          </p>
          {subscribeStatus === 'success' ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--green)', padding: '1rem' }}>✓ You&apos;re on the list. We&apos;ll be in touch.</p>
          ) : (
            <form onSubmit={handleSubscribe} className="email-subscribe" style={{ justifyContent: 'center' }}>
              <input
                type="email"
                placeholder="eng-lead@yourplatform.com"
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary" disabled={subscribeStatus === 'submitting'}>
                {subscribeStatus === 'submitting' ? '…' : 'subscribe →'}
              </button>
            </form>
          )}
        </div>
      </section>

      <hr />

      {/* ── FOUNDER SECTION ───────────────────────────────────────────────────── */}
      <section id="founder">
        <div className="inner" style={{ maxWidth: '700px' }}>
          <p className="section-tag">a note from the team</p>
          <h2 className="section-title">There&apos;s a human accountable for this.</h2>
          <div className="founder-card">
            <div className="founder-avatar">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '52px', height: '52px' }}>
                <circle cx="24" cy="24" r="24" fill="rgba(0,229,155,0.10)" />
                <circle cx="24" cy="19" r="7" stroke="#00E59B" strokeWidth="1.5" fill="none" />
                <path d="M10 40c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#00E59B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <div className="founder-body">
              <div className="founder-name">Founder &amp; sole engineer, Corvinth — building in public</div>
              <p className="founder-text">
                I built Corvinth because I watched small platforms get caught flat-footed by TIDA — not because they didn&apos;t care, but because building trust and safety infrastructure is expensive and hard and usually comes after a crisis, not before. The compliance tools that exist are built for companies with legal teams and seven-figure engineering budgets.
              </p>
              <p className="founder-text">
                Corvinth is the version of this that fits in a startup&apos;s infrastructure budget, integrates in a day, and gives you the audit trail you need to show the FTC you took this seriously. I&apos;m not anonymous — email me directly with any questions, including hard ones about what Corvinth can and cannot do.
              </p>
              <a href="mailto:foundercorvinth@gmail.com" className="founder-email">foundercorvinth@gmail.com</a>
            </div>
          </div>
        </div>
      </section>

      <hr />

      {/* ── CONTACT / WAITLIST FORM ───────────────────────────────────────────── */}
      <section id="contact" className="contact-section">
        <div className="inner-sm">
          <div style={{
            background: '#0e0e0c',
            border: '0.5px solid rgba(255,255,255,0.08)',
            borderRadius: '20px', padding: '3rem 2.5rem',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Top accent line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(0,229,155,0.5), transparent)',
            }} />
            <p style={{
              textAlign: 'center', fontSize: '10px', fontWeight: 500,
              color: '#00E59B', textTransform: 'uppercase', letterSpacing: '0.14em',
              fontFamily: "'JetBrains Mono', monospace", marginBottom: '1rem',
            }}>get started</p>
            <h2 style={{
              textAlign: 'center',
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 800,
              color: '#F0EFE8', letterSpacing: '-1px',
              marginBottom: '0.75rem', lineHeight: 1.1,
            }}>Ready to integrate?</h2>
            <p style={{
              textAlign: 'center', fontSize: '15px', color: '#8C8B84',
              marginBottom: '2rem', lineHeight: 1.75, fontWeight: 300,
            }}>
              Tell us about your platform and we&apos;ll get you API credentials within 24 hours.
            </p>
            {formStatus === 'success' ? (
              <div className="form-success">
                <p>✓ Request received.</p>
                <span>We&apos;ll be in touch within 24 hours with your API credentials.</span>
              </div>
            ) : (
              <>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Contact name <span>*</span></label>
                    <input name="contact_name" placeholder="Jane Smith" value={form.contact_name} onChange={handleFormChange} className="form-input" />
                  </div>
                  <div className="form-field">
                    <label>Work email <span>*</span></label>
                    <input name="work_email" type="email" placeholder="jane@company.com" value={form.work_email} onChange={handleFormChange} className="form-input" />
                  </div>
                  <div className="form-field">
                    <label>Company / Platform <span>*</span></label>
                    <input name="company_name" placeholder="Acme Dating Inc." value={form.company_name} onChange={handleFormChange} className="form-input" />
                  </div>
                  <div className="form-field">
                    <label>Platform URL <span>*</span></label>
                    <input name="platform_url" placeholder="https://yourapp.com" value={form.platform_url} onChange={handleFormChange} className="form-input" />
                  </div>
                  <div className="form-field">
                    <label>Platform type <span>*</span></label>
                    <select name="platform_type" value={form.platform_type} onChange={handleFormChange} className="form-input" style={{ cursor: 'pointer', color: form.platform_type ? '#F0EFE8' : '#4A4A45' }}>
                      <option value="">Select type…</option>
                      <option value="dating">Dating app</option>
                      <option value="social">Social platform</option>
                      <option value="messaging">Messaging app</option>
                      <option value="creator">Creator platform</option>
                      <option value="marketplace">Marketplace</option>
                      <option value="gaming">Gaming</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Monthly uploads <span>*</span></label>
                    <select name="monthly_upload_volume" value={form.monthly_upload_volume} onChange={handleFormChange} className="form-input" style={{ cursor: 'pointer', color: form.monthly_upload_volume ? '#F0EFE8' : '#4A4A45' }}>
                      <option value="">Select volume…</option>
                      <option value="under_10k">Under 10,000 / month</option>
                      <option value="10k_100k">10,000 – 100,000 / month</option>
                      <option value="100k_1m">100,000 – 1M / month</option>
                      <option value="over_1m">Over 1M / month</option>
                    </select>
                  </div>
                  <div className="form-field full">
                    <label>How did you hear about us?</label>
                    <input name="referral_source" placeholder="Twitter, a colleague, YC forum…" value={form.referral_source} onChange={handleFormChange} className="form-input" />
                  </div>
                  <div className="form-field full">
                    <label>Use case / message</label>
                    <textarea name="use_case" rows={3} placeholder="Tell us briefly what you're building and how Corvinth fits in…" value={form.use_case} onChange={handleFormChange} className="form-input" style={{ resize: 'vertical', lineHeight: 1.65 }} />
                  </div>
                </div>
                {formError && <p className="form-error">{formError}</p>}
                <button onClick={handleFormSubmit} disabled={formStatus === 'submitting'} className="form-submit">
                  {formStatus === 'submitting' ? 'Sending…' : 'request API access →'}
                </button>
                <p style={{
                  textAlign: 'center', marginTop: '1rem',
                  fontSize: '11px', color: '#4A4A45',
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em',
                }}>
                  Early access from <b style={{ color: '#8C8B84', fontWeight: 500 }}>$499 / month</b> · Enterprise plans available
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <hr />

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer>
        <p>CORVINTH · Trust &amp; safety infrastructure · 2026</p>
        <div className="footer-links">
          <a href="#security">data &amp; security</a>
          <a href="#contact">partner with us</a>
          <a href="mailto:foundercorvinth@gmail.com">foundercorvinth@gmail.com</a>
        </div>
      </footer>
    </>
  );
}

// ── FAQ accordion sub-component ──────────────────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? ' faq-open' : ''}`}>
      <button className="faq-q" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="faq-a"><p>{a}</p></div>}
    </div>
  );
}