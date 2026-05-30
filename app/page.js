// app/page.js
'use client'; // Required because we use React state for the demo

import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [hashInput, setHashInput] = useState('a1b2c3d4e5f6...'); // Mock placeholder
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Waitlist form state ───────────────────────────────────────────────────
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
  const [formStatus, setFormStatus] = useState('idle'); // idle | submitting | success | error
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

  const simulateCheck = async () => {
    setLoading(true);
    try {
      // Safely calls our internal Next.js route, NOT the backend directly
      const response = await fetch('/api/check', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdq_hash: hashInput,
          pdq_dihedral_hashes: Array(8).fill(hashInput), 
          source: 'landing_page_demo'
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Demo failed:", error);
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Corvinth — Trust & Safety Infrastructure</title>
        <meta name="description" content="Corvinth helps dating apps, communities, and creator platforms scan uploads using open-source perceptual hashing — without storing the original user media." />
        <meta property="og:title" content="Corvinth — Trust & Safety Infrastructure" />
        <meta property="og:description" content="Detect known harmful image copies before they spread." />
        <meta property="og:type" content="website" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        
        {/* Embedded CSS for seamless 1:1 integration */}
        <style dangerouslySetInnerHTML={{ __html: `
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          :root {
            --green: #1D9E75;
            --green-light: rgba(29,158,117,0.12);
            --green-mid: rgba(29,158,117,0.3);
            --green-dark: #0F6E56;
            --bg: #0a0a09;
            --bg-card: #111110;
            --bg-off: #161614;
            --text: #ededea;
            --text-muted: #9a9a95;
            --text-faint: #5a5a56;
            --border: rgba(255,255,255,0.07);
            --border-mid: rgba(255,255,255,0.11);
            --radius: 10px;
            --radius-lg: 16px;
          }

          html { scroll-behavior: smooth; }
          body {
            font-family: 'DM Sans', sans-serif;
            background: var(--bg);
            color: var(--text);
            font-size: 16px;
            line-height: 1.7;
            -webkit-font-smoothing: antialiased;
          }

          a { text-decoration: none; color: inherit; }

          nav {
            position: fixed; top: 0; left: 0; right: 0; z-index: 100;
            display: flex; align-items: center; justify-content: space-between;
            padding: 1.1rem 2.5rem;
            background: rgba(10,10,9,0.85);
            backdrop-filter: blur(16px);
            border-bottom: 0.5px solid var(--border);
          }

          .logo {
            font-family: 'DM Mono', monospace;
            font-size: 17px; font-weight: 400;
            letter-spacing: -0.02em;
            color: var(--text);
          }
          .logo .accent { color: var(--green); }

          .nav-right { display: flex; align-items: center; gap: 8px; }

          .btn-ghost {
            font-family: 'DM Sans', sans-serif; font-size: 13px;
            padding: 7px 14px;
            border: 0.5px solid var(--border-mid);
            border-radius: var(--radius);
            color: var(--text-muted);
            background: transparent;
            cursor: pointer;
            text-decoration: none;
            transition: background 0.15s, color 0.15s;
          }
          .btn-ghost:hover { background: var(--bg-off); color: var(--text); }

          .btn-primary {
            font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
            padding: 8px 18px;
            border: none; border-radius: var(--radius);
            background: var(--green); color: #fff;
            cursor: pointer; text-decoration: none;
            transition: background 0.15s;
          }
          .btn-primary:hover { background: var(--green-dark); }
          .btn-primary.lg { font-size: 15px; padding: 13px 28px; border-radius: 12px; }
          .btn-ghost.lg { font-size: 15px; padding: 13px 28px; border-radius: 12px; }

          .notice {
            margin-top: 64px;
            background: rgba(29,158,117,0.08);
            border-bottom: 0.5px solid rgba(29,158,117,0.2);
            padding: 10px 2.5rem;
            text-align: center;
            font-size: 13px;
            color: var(--text-muted);
          }
          .notice b { color: var(--green); font-weight: 500; }

          .hero {
            padding: 7rem 2rem 6rem;
            text-align: center;
            max-width: 760px;
            margin: 0 auto;
          }

          .badge {
            display: inline-flex; align-items: center; gap: 7px;
            font-size: 12px; font-weight: 500;
            padding: 6px 16px; border-radius: 999px;
            background: var(--green-light);
            color: var(--green);
            border: 0.5px solid var(--green-mid);
            margin-bottom: 2.5rem;
            font-family: 'DM Mono', monospace;
            letter-spacing: 0.02em;
          }

          .hero h1 {
            font-size: clamp(40px, 6vw, 64px);
            font-weight: 500;
            line-height: 1.08;
            letter-spacing: -1.5px;
            color: var(--text);
            margin-bottom: 1.5rem;
          }
          .hero h1 em { font-style: normal; color: var(--green); }

          .hero p {
            font-size: 18px;
            color: var(--text-muted);
            line-height: 1.7;
            margin-bottom: 2.75rem;
            font-weight: 300;
            max-width: 540px;
            margin-left: auto; margin-right: auto;
          }

          .hero-cta { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; }

          hr { border: none; border-top: 0.5px solid var(--border); }

          .proof {
            padding: 2.5rem 2.5rem;
            display: flex; align-items: center; justify-content: center;
            gap: 3.5rem; flex-wrap: wrap;
          }
          .proof-item { text-align: center; }
          .proof-num {
            font-size: 24px; font-weight: 500;
            color: var(--text); letter-spacing: -0.5px;
            font-family: 'DM Mono', monospace;
          }
          .proof-label { font-size: 12px; color: var(--text-faint); margin-top: 3px; }

          section { padding: 5.5rem 2.5rem; }
          .inner { max-width: 820px; margin: 0 auto; }
          .inner-sm { max-width: 580px; margin: 0 auto; }

          .section-tag {
            font-size: 11px; font-weight: 500; color: var(--green);
            text-transform: uppercase; letter-spacing: 0.12em;
            margin-bottom: 1rem;
            font-family: 'DM Mono', monospace;
          }
          .section-title {
            font-size: clamp(26px, 3.5vw, 36px); font-weight: 500;
            color: var(--text); letter-spacing: -0.5px;
            margin-bottom: 1rem; line-height: 1.15;
          }
          .section-sub {
            font-size: 16px; color: var(--text-muted);
            line-height: 1.7; font-weight: 300;
            max-width: 520px; margin-bottom: 3rem;
          }

          .timeline { display: flex; flex-direction: column; }
          .tl-item {
            display: grid; grid-template-columns: 44px 1fr;
            gap: 0 1.5rem; position: relative;
          }
          .tl-line {
            position: absolute; left: 21px; top: 44px; bottom: -1rem;
            width: 0.5px; background: var(--border-mid);
          }
          .tl-dot {
            width: 44px; height: 44px; border-radius: 50%;
            background: var(--green-light);
            color: var(--green);
            display: flex; align-items: center; justify-content: center;
            font-size: 13px; font-weight: 500; flex-shrink: 0;
            border: 0.5px solid var(--green-mid);
            font-family: 'DM Mono', monospace;
          }
          .tl-content { padding-bottom: 3rem; }
          .tl-content h3 {
            font-size: 15px; font-weight: 500; color: var(--text);
            margin-bottom: 0.4rem; padding-top: 10px;
          }
          .tl-content p { font-size: 14px; color: var(--text-muted); line-height: 1.65; }

          .bg-section { background: var(--bg-card); }
          .usecases {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1px;
            background: var(--border);
            border: 0.5px solid var(--border);
            border-radius: var(--radius-lg);
            overflow: hidden;
          }
          .usecase { background: var(--bg-card); padding: 1.75rem; }
          .usecase-icon { color: var(--green); margin-bottom: 1rem; }
          .usecase h4 { font-size: 15px; font-weight: 500; color: var(--text); margin-bottom: 0.5rem; }
          .usecase p { font-size: 13px; color: var(--text-muted); line-height: 1.65; }

          .confidence-grid {
            display: grid; grid-template-columns: repeat(3, 1fr);
            gap: 1rem; margin-top: 2.5rem;
          }
          .conf-card {
            background: var(--bg-off);
            border: 0.5px solid var(--border);
            border-radius: var(--radius-lg); padding: 1.75rem;
          }
          .conf-card b { font-size: 15px; color: var(--text); font-weight: 500; display: block; margin-bottom: 0.75rem; }
          .conf-card p { font-size: 13px; color: var(--text-muted); line-height: 1.65; }

          .trust-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }
          .trust-card {
            background: var(--bg-card);
            border: 0.5px solid var(--border);
            border-radius: var(--radius-lg); padding: 1.5rem;
          }
          .trust-card .ticon { color: var(--green); margin-bottom: 1rem; }
          .trust-card h4 { font-size: 14px; font-weight: 500; color: var(--text); margin-bottom: 0.4rem; }
          .trust-card p { font-size: 13px; color: var(--text-muted); line-height: 1.65; }

          .disclaimer-box {
            margin-top: 3rem;
            padding: 1.5rem 2rem;
            background: var(--bg-off);
            border: 0.5px solid var(--border);
            border-radius: var(--radius-lg);
            border-left: 2px solid var(--green);
          }
          .disclaimer-box p { font-size: 13px; color: var(--text-faint); line-height: 1.7; }

          .pills { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 1.5rem; }
          .pill {
            border: 0.5px solid var(--border-mid);
            background: var(--bg-card);
            border-radius: 999px;
            padding: 7px 14px;
            font-size: 12px;
            color: var(--text-muted);
            font-family: 'DM Mono', monospace;
          }

          .pricing-note {
            display: inline-block;
            margin-top: 1.25rem;
            font-size: 13px;
            color: var(--text-faint);
            font-family: 'DM Mono', monospace;
            letter-spacing: 0.02em;
          }
          .pricing-note b { color: var(--text-muted); font-weight: 500; }

          .contact-section { background: var(--bg-card); }

          .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 2rem;
            text-align: left;
          }
          .form-field { display: flex; flex-direction: column; gap: 6px; }
          .form-field.full { grid-column: 1 / -1; }
          .form-field label {
            font-size: 11px; font-weight: 500;
            color: var(--text-faint);
            text-transform: uppercase; letter-spacing: 0.08em;
            font-family: 'DM Mono', monospace;
          }
          .form-field label span { color: var(--green); }
          .form-input {
            background: var(--bg-card);
            border: 0.5px solid var(--border-mid);
            border-radius: var(--radius);
            padding: 11px 14px;
            font-family: 'DM Sans', sans-serif;
            font-size: 14px;
            color: var(--text);
            outline: none;
            transition: border-color 0.15s;
            width: 100%;
            appearance: none;
          }
          .form-input:focus { border-color: var(--green); }
          .form-input::placeholder { color: var(--text-faint); }
          .form-submit {
            width: 100%; margin-top: 16px;
            background: var(--green); color: #fff;
            border: none; border-radius: var(--radius);
            padding: 14px;
            font-family: 'DM Sans', sans-serif;
            font-size: 15px; font-weight: 500;
            cursor: pointer;
            transition: background 0.15s;
          }
          .form-submit:hover:not(:disabled) { background: var(--green-dark); }
          .form-submit:disabled { opacity: 0.6; cursor: not-allowed; }
          .form-error { font-size: 13px; color: #e05555; margin-top: 10px; text-align: center; }
          .form-success {
            margin-top: 2rem; padding: 1.5rem;
            background: var(--green-light);
            border: 0.5px solid var(--green-mid);
            border-radius: var(--radius-lg);
            text-align: center;
          }
          .form-success p { font-size: 15px; color: var(--green); font-weight: 500; }
          .form-success span { font-size: 13px; color: var(--text-muted); display: block; margin-top: 4px; }
          @media (max-width: 640px) {
            .form-grid { grid-template-columns: 1fr; }
          }
          .contact-box {
            background: var(--bg-off);
            border: 0.5px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 3.5rem 2.5rem;
            text-align: center;
          }
          .contact-box h2 {
            font-size: clamp(22px, 3vw, 30px); font-weight: 500;
            color: var(--text); margin-bottom: 0.75rem; letter-spacing: -0.4px;
          }
          .contact-box p { font-size: 15px; color: var(--text-muted); margin-bottom: 2rem; }

          .contact-actions { display: flex; flex-direction: column; align-items: center; gap: 12px; }

          .email-link {
            display: inline-block;
            background: var(--green);
            color: #fff;
            padding: 14px 28px;
            border-radius: 12px;
            font-weight: 500;
            font-size: 15px;
            text-decoration: none;
            transition: background 0.15s;
          }
          .email-link:hover { background: var(--green-dark); }

          footer {
            padding: 1.75rem 2.5rem;
            border-top: 0.5px solid var(--border);
            display: flex; align-items: center; justify-content: space-between;
            flex-wrap: wrap; gap: 1rem;
          }
          footer p { font-size: 12px; color: var(--text-faint); font-family: 'DM Mono', monospace; }
          .footer-links { display: flex; gap: 1.75rem; }
          .footer-links a { font-size: 12px; color: var(--text-faint); transition: color 0.15s; }
          .footer-links a:hover { color: var(--text-muted); }

          svg.icon {
            display: inline-block; width: 18px; height: 18px;
            vertical-align: middle; stroke: currentColor; fill: none;
            stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round;
          }

          @media (max-width: 640px) {
            nav { padding: 1rem 1.25rem; }
            section { padding: 4rem 1.25rem; }
            .proof { gap: 2rem; }
            .confidence-grid { grid-template-columns: 1fr; }
            .btn-ghost:not(.nav-right .btn-ghost) { display: none; }
          }
        `}} />
      </Head>

      <nav>
        <a className="logo" href="#">cor<span className="accent">vinth</span></a>
        <div className="nav-right">
          <a className="btn-ghost" href="#how">how it works</a>
          <a className="btn-ghost" href="#detection">detection</a>
          <a className="btn-primary" href="#contact">request access</a>
        </div>
      </nav>

      <div className="notice">
        For platforms facing NCII takedown pressure — faster detection, safer review, clearer compliance logs.<br />
        <b>No false partnership claims. No overclaiming.</b>
      </div>

      <div className="hero">
        <div className="badge">
          <svg className="icon" style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          PDQ · perceptual hashing · TIDA compliant
        </div>
        <h1>Detect known harmful<br />image copies before<br /><em>they spread.</em></h1>
        <p>Corvinth helps dating apps, communities, and creator platforms scan uploads using open-source perceptual hashing — without storing the original user media.</p>
        <div className="hero-cta">
          <a className="btn-primary lg" href="#contact">request early access</a>
          <a className="btn-ghost lg" href="#how">see the pipeline</a>
        </div>
      </div>

      {/* --- THE INTERACTIVE DEMO SANDBOX --- */}
      <section className="bg-section" style={{ padding: '3rem 2rem', borderTop: '0.5px solid var(--border)', borderBottom: '0.5px solid var(--border)' }}>
        <div className="inner-sm" style={{ textAlign: 'center' }}>
          <p className="section-tag">Live API Demo</p>
          <h2 className="section-title" style={{ fontSize: '24px' }}>Test the Engine</h2>
          <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem', justifyContent: 'center' }}>
            <input 
              type="text" 
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              style={{ padding: '12px', width: '300px', borderRadius: '8px', border: '1px solid var(--border-mid)', background: '#000', color: '#fff', fontFamily: 'monospace' }}
            />
            <button onClick={simulateCheck} className="btn-primary lg" disabled={loading}>
              {loading ? 'Scanning...' : 'Run Sub-Linear Lookup'}
            </button>
          </div>
          
          {result && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-off)', borderRadius: '12px', border: '0.5px solid var(--border)', textAlign: 'left', fontFamily: 'monospace', fontSize: '13px' }}>
              <p style={{ color: 'var(--green)' }}>{">"} 200 HTTP OK</p>
              <p style={{ color: 'var(--text-muted)' }}>Latency: ~18ms</p>
              <p style={{ color: 'var(--text)' }}>Classification: <b style={{ color: result.classification === 'EXACT' ? 'red' : 'var(--green)' }}>{result.classification || "CLEAN"}</b></p>
              <p style={{ color: 'var(--text)' }}>Action Required: {result.action || "content_allowed"}</p>
            </div>
          )}
        </div>
      </section>

      <div className="proof">
        <div className="proof-item">
          <div className="proof-num">PDQ</div>
          <div className="proof-label">open-source perceptual hashing</div>
        </div>
        <div className="proof-item">
          <div className="proof-num">50–200ms</div>
          <div className="proof-label">target API decision latency</div>
        </div>
        <div className="proof-item">
          <div className="proof-num">$53,088</div>
          <div className="proof-label">FTC fine per violation · TIDA · as of May 2026</div>
        </div>
        <div className="proof-item">
          <div className="proof-num">0</div>
          <div className="proof-label">original images stored by default</div>
        </div>
      </div>

      <hr />

      <section id="how">
        <div className="inner">
          <p className="section-tag">how it works</p>
          <h2 className="section-title">One endpoint inside your upload pipeline.</h2>
          <p className="section-sub">Corvinth is designed as infrastructure, not a moderation dashboard your team has to babysit.</p>
          <div className="timeline">
            <div className="tl-item">
              <div className="tl-line"></div>
              <div className="tl-dot">01</div>
              <div className="tl-content">
                <h3>Normalize the upload on your server</h3>
                <p>Your platform handles EXIF orientation, resizing, and compression using the Corvinth SDK — running entirely on your infrastructure. The SDK computes a perceptual hash from the image bytes. No pixels are sent to Corvinth.</p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-line"></div>
              <div className="tl-dot">02</div>
              <div className="tl-content">
                <h3>Generate a robust perceptual fingerprint</h3>
                <p>The SDK uses open-source perceptual hashing — Meta PDQ — and generates fingerprints for all 8 orientations simultaneously. Rotation, filters, and re-encoding are tolerated by design.</p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-line"></div>
              <div className="tl-dot">03</div>
              <div className="tl-content">
                <h3>Match against the NCII hash database</h3>
                <p>The hash is sent to Corvinth&apos;s API and compared against a database of reported non-consensual intimate imagery using Hamming-distance comparison across all 8 orientations.</p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-dot">04</div>
              <div className="tl-content">
                <h3>Return a decision — you enforce your policy</h3>
                <p>Your platform receives a structured response: allow, block, or send to review with a confidence tier and case UUID. Corvinth is the detection layer. You stay in control of what happens next.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr />

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

      <section id="detection">
        <div className="inner">
          <p className="section-tag">detection confidence</p>
          <h2 className="section-title">Not every match should be treated the same.</h2>
          <p className="section-sub">Edited images are messy. Corvinth separates obvious matches from uncertain derivatives so platforms can act quickly without overclaiming accuracy.</p>
          <div className="confidence-grid">
            <div className="conf-card">
              <b>Exact / near-exact</b>
              <p>Same or visually close media. Best for automatic blocking when platform policy allows.</p>
            </div>
            <div className="conf-card">
              <b>Likely derivative</b>
              <p>Rotated, filtered, compressed, or lightly cropped media. Best for high-priority review queue.</p>
            </div>
            <div className="conf-card">
              <b>Needs review</b>
              <p>Low-confidence similarity. Escalate instead of silently allowing or wrongly blocking.</p>
            </div>
          </div>
        </div>
      </section>

      <hr />

      <section className="bg-section">
        <div className="inner">
          <p className="section-tag">trust and technology</p>
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
              <h4>Persistent hash database</h4>
              <p>Hash database survives restarts and scales with your corpus. Hashes stored, not images.</p>
            </div>
            <div className="trust-card">
              <div className="ticon"><svg className="icon" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg></div>
              <h4>TIDA compliance ready</h4>
              <p>The Take It Down Act requires removal within 48 hours. Corvinth catches violations at upload and generates a case UUID and audit log for every request.</p>
            </div>
          </div>

          <div className="pills">
            <span className="pill">Meta PDQ</span>
            <span className="pill">Open-source hashing</span>
            <span className="pill">Near-duplicate detection</span>
            <span className="pill">Compliance logs</span>
            <span className="pill">Review queue</span>
          </div>

          <div className="disclaimer-box" style={{ marginTop: '2rem' }}>
            <p>Partnerships with safety organizations may be pursued in the future. Corvinth does not represent or speak for StopNCII, Microsoft, Meta, or any listed organization unless a formal agreement exists. Corvinth is an independent trust and safety infrastructure company.</p>
          </div>
        </div>
      </section>

      <hr />

      <section id="contact" style={{ background: '#111110', padding: '5.5rem 2.5rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            background: '#161614',
            border: '0.5px solid rgba(255,255,255,0.07)',
            borderRadius: '16px',
            padding: '3rem 2.5rem',
          }}>
            <p style={{
              textAlign: 'center', fontSize: '11px', fontWeight: 500,
              color: '#1D9E75', textTransform: 'uppercase', letterSpacing: '0.12em',
              fontFamily: "'DM Mono', monospace", marginBottom: '1rem'
            }}>get started</p>
            <h2 style={{
              textAlign: 'center', fontSize: 'clamp(24px, 3vw, 32px)',
              fontWeight: 500, color: '#ededea', letterSpacing: '-0.5px',
              marginBottom: '0.75rem', lineHeight: 1.15
            }}>Ready to integrate?</h2>
            <p style={{
              textAlign: 'center', fontSize: '15px', color: '#9a9a95',
              marginBottom: '2rem', lineHeight: 1.7, fontWeight: 300
            }}>Tell us about your platform and we&apos;ll get you API credentials within 24 hours.</p>

            {formStatus === 'success' ? (
              <div style={{
                marginTop: '1.5rem', padding: '1.5rem 2rem',
                background: 'rgba(29,158,117,0.10)',
                border: '0.5px solid rgba(29,158,117,0.3)',
                borderRadius: '12px', textAlign: 'center'
              }}>
                <p style={{ fontSize: '16px', color: '#1D9E75', fontWeight: 500, marginBottom: '6px' }}>✓ Request received.</p>
                <span style={{ fontSize: '13px', color: '#9a9a95' }}>We&apos;ll be in touch within 24 hours with your API credentials.</span>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px',
                }}>
                  {/* Contact name */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 500, color: '#5a5a56', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace" }}>
                      Contact name <span style={{ color: '#1D9E75' }}>*</span>
                    </label>
                    <input
                      name="contact_name" placeholder="Jane Smith"
                      value={form.contact_name} onChange={handleFormChange}
                      style={{ background: '#0a0a09', border: '0.5px solid rgba(255,255,255,0.11)', borderRadius: '10px', padding: '11px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#ededea', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  {/* Work email */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 500, color: '#5a5a56', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace" }}>
                      Work email <span style={{ color: '#1D9E75' }}>*</span>
                    </label>
                    <input
                      name="work_email" type="email" placeholder="jane@company.com"
                      value={form.work_email} onChange={handleFormChange}
                      style={{ background: '#0a0a09', border: '0.5px solid rgba(255,255,255,0.11)', borderRadius: '10px', padding: '11px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#ededea', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  {/* Company name */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 500, color: '#5a5a56', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace" }}>
                      Company / Platform <span style={{ color: '#1D9E75' }}>*</span>
                    </label>
                    <input
                      name="company_name" placeholder="Acme Dating Inc."
                      value={form.company_name} onChange={handleFormChange}
                      style={{ background: '#0a0a09', border: '0.5px solid rgba(255,255,255,0.11)', borderRadius: '10px', padding: '11px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#ededea', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  {/* Platform URL */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 500, color: '#5a5a56', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace" }}>
                      Platform URL <span style={{ color: '#1D9E75' }}>*</span>
                    </label>
                    <input
                      name="platform_url" placeholder="https://yourapp.com"
                      value={form.platform_url} onChange={handleFormChange}
                      style={{ background: '#0a0a09', border: '0.5px solid rgba(255,255,255,0.11)', borderRadius: '10px', padding: '11px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#ededea', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  {/* Platform type */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 500, color: '#5a5a56', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace" }}>
                      Platform type <span style={{ color: '#1D9E75' }}>*</span>
                    </label>
                    <select
                      name="platform_type" value={form.platform_type} onChange={handleFormChange}
                      style={{ background: '#0a0a09', border: '0.5px solid rgba(255,255,255,0.11)', borderRadius: '10px', padding: '11px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: form.platform_type ? '#ededea' : '#5a5a56', outline: 'none', width: '100%', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer' }}
                    >
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
                  {/* Monthly volume */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 500, color: '#5a5a56', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace" }}>
                      Monthly uploads <span style={{ color: '#1D9E75' }}>*</span>
                    </label>
                    <select
                      name="monthly_upload_volume" value={form.monthly_upload_volume} onChange={handleFormChange}
                      style={{ background: '#0a0a09', border: '0.5px solid rgba(255,255,255,0.11)', borderRadius: '10px', padding: '11px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: form.monthly_upload_volume ? '#ededea' : '#5a5a56', outline: 'none', width: '100%', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer' }}
                    >
                      <option value="">Select volume…</option>
                      <option value="under_10k">Under 10,000 / month</option>
                      <option value="10k_100k">10,000 – 100,000 / month</option>
                      <option value="100k_1m">100,000 – 1M / month</option>
                      <option value="over_1m">Over 1M / month</option>
                    </select>
                  </div>
                  {/* Referral — full width */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '11px', fontWeight: 500, color: '#5a5a56', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace" }}>
                      How did you hear about us?
                    </label>
                    <input
                      name="referral_source" placeholder="Twitter, a colleague, YC forum…"
                      value={form.referral_source} onChange={handleFormChange}
                      style={{ background: '#0a0a09', border: '0.5px solid rgba(255,255,255,0.11)', borderRadius: '10px', padding: '11px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#ededea', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  {/* Use case — full width */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '11px', fontWeight: 500, color: '#5a5a56', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace" }}>
                      Use case / message
                    </label>
                    <textarea
                      name="use_case" rows={3}
                      placeholder="Tell us briefly what you're building and how Corvinth fits in…"
                      value={form.use_case} onChange={handleFormChange}
                      style={{ background: '#0a0a09', border: '0.5px solid rgba(255,255,255,0.11)', borderRadius: '10px', padding: '11px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#ededea', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6 }}
                    />
                  </div>
                </div>

                {formError && (
                  <p style={{ fontSize: '13px', color: '#e05555', marginTop: '12px', textAlign: 'center' }}>{formError}</p>
                )}

                <button
                  onClick={handleFormSubmit}
                  disabled={formStatus === 'submitting'}
                  style={{
                    width: '100%', marginTop: '18px',
                    background: formStatus === 'submitting' ? '#0F6E56' : '#1D9E75',
                    color: '#fff', border: 'none', borderRadius: '10px',
                    padding: '14px', fontFamily: "'DM Sans', sans-serif",
                    fontSize: '15px', fontWeight: 500, cursor: formStatus === 'submitting' ? 'not-allowed' : 'pointer',
                    opacity: formStatus === 'submitting' ? 0.7 : 1,
                    transition: 'background 0.15s, opacity 0.15s'
                  }}
                >
                  {formStatus === 'submitting' ? 'Sending…' : 'request API access'}
                </button>

                <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '13px', color: '#5a5a56', fontFamily: "'DM Mono', monospace" }}>
                  Early access from <b style={{ color: '#9a9a95', fontWeight: 500 }}>$299 / month</b> · Enterprise plans available
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <hr />

      <footer>
        <p>CORVINTH · Trust & safety infrastructure · 2026</p>
        <div className="footer-links">
          <a href="#contact">partner with us</a>
          <a href="mailto:foundercorvinth@gmail.com">foundercorvinth@gmail.com</a>
        </div>
      </footer>
    </>
  );
}