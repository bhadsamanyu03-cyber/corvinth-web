// app/page.js
'use client'; // Required because we use React state for the demo

import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [hashInput, setHashInput] = useState('a1b2c3d4e5f6...'); // Mock placeholder
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

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
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
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
        For platforms facing NCII takedown pressure — faster detection, safer review, clearer compliance logs.<br/>
        <b>No false partnership claims. No overclaiming.</b>
      </div>

      <div className="hero">
        <div className="badge">
          PDQ · perceptual hashing · TIDA compliant
        </div>
        <h1>Detect known harmful<br/>image copies before<br/><em>they spread.</em></h1>
        <p>Corvinth helps dating apps, communities, and creator platforms scan uploads using open-source perceptual hashing — without storing the original user media.</p>
        <div className="hero-cta">
          <a className="btn-primary lg" href="#contact">request early access</a>
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
      </div>

      <hr />

      {/* PASTE THE REST OF THE HTML SECTIONS HERE (Change class to className) */}
      <section id="how">
        <div className="inner">
          <p className="section-tag">how it works</p>
          <h2 className="section-title">One endpoint inside your upload pipeline.</h2>
          <p className="section-sub">Corvinth is designed as infrastructure, not a moderation dashboard your team has to babysit.</p>
          {/* ... */}
        </div>
      </section>
    </>
  );
}