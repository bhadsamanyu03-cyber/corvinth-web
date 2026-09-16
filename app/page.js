// app/page.js
'use client';

import { useState, useEffect } from 'react';

// ── Samples for the live demo ─────────────────────────────────────────────────
const SAMPLES = {
  nomatch:  "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678901234567890abcdef012345",
  nearmiss: "f1e2d3c4b5a6978685746352413029180f1e2d3c4b5a69786857463524130291",
};
function randomHex64() {
  return Array.from({ length: 64 }, () =>
    "0123456789abcdef"[Math.floor(Math.random() * 16)]
  ).join("");
}

// ── Live API Demo ─────────────────────────────────────────────────────────────
function ApiDemo() {
  const [hash,     setHash]     = useState("");
  const [source,   setSource]   = useState("");
  const [response, setResponse] = useState("// response will appear here");
  const [status,   setStatus]   = useState("idle");
  const [latency,  setLatency]  = useState("");

  // Warm the server silently on mount
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, { method: 'GET' })
      .catch(() => {});
  }, []);
  
  async function runDemo() {
    if (!hash || hash.length !== 64) {
      setStatus("error");
      setResponse("// hash must be exactly 64 hex characters");
      return;
    }
    setStatus("loading");
    setResponse("// querying Corvinth match engine…");
    setLatency("");
    const t0 = performance.now();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/demo/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdq_hash: hash.trim().toLowerCase(), source: source || "demo" }),
      });
      const ms = Math.round(performance.now() - t0);
      if (res.status === 429) {
        setResponse("// Rate limit reached — try again in a minute.");
        setLatency(`${ms}ms`); setStatus("error"); return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setResponse(`// error ${res.status}: ${err.detail || res.statusText}`);
        setLatency(`${ms}ms`); setStatus("error"); return;
      }
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
      setLatency(`${ms}ms`);
      setStatus(
        data.match_found ? "match" :
        data.classification === "NEAR_MISS" ? "nearmiss" :
        "ok"
      );
    } catch (err) {
      const ms = Math.round(performance.now() - t0);
      setResponse(
        `// Network error: ${err.message}\n//\n// The sandbox runs on Render's free tier.\n// First request may take ~10s while the server wakes up. Try again.`
      );
      setLatency(`${ms}ms`); setStatus("error");
    }
  }

  const statusLabel = {
    idle:     "waiting for input",
    loading:  "querying engine…",
    ok:       "CLEAN · content_allowed ✓",
    nearmiss: "NEAR_MISS · content_allowed (flagged for pattern review)",
    match:    "match found · blocked 🚫",
    error:    "request failed",
  }[status];

  const dotColor = {
    idle: "#4A4A45", loading: "#FFB224",
    ok: "#00E59B",  nearmiss: "#FFB224",
    match: "#FF4D4D", error: "#FF4D4D",
  }[status];

  function syntaxHighlight(str) {
    if (str.startsWith("//")) return `<span style="color:#4A4A45">${str.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`;
    return str.replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"([^"]+)":/g, '<span style="color:#00E59B">"$1"</span>:')
      .replace(/: "(.*?)"/g,  ': <span style="color:#FFB224">"$1"</span>')
      .replace(/: (true|false)/g, ': <span style="color:#4D9EFF">$1</span>')
      .replace(/: (null)/g,       ': <span style="color:#4A4A45">$1</span>')
      .replace(/: (-?\d+\.?\d*)/g,': <span style="color:#4D9EFF">$1</span>');
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px,1fr))', gap:'1rem', width:'100%', textAlign:'left' }}>
      {/* Input panel */}
      <div style={{ borderRadius:'12px', border:'0.5px solid rgba(255,255,255,0.08)', background:'#0a0a08', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
        <p style={{ fontSize:'10px', color:'#4A4A45', textTransform:'uppercase', letterSpacing:'0.14em', fontFamily:"'JetBrains Mono',monospace" }}>Input — PDQ hash</p>
        <textarea
          style={{ width:'100%', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', background:'#060605', border:'0.5px solid rgba(255,255,255,0.10)', borderRadius:'8px', padding:'10px 12px', color:'#F0EFE8', resize:'vertical', minHeight:'88px', outline:'none' }}
          placeholder="Paste a 64-char hex PDQ hash…"
          value={hash} onChange={e => setHash(e.target.value)} spellCheck={false}
        />
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
          {["nomatch","nearmiss","random"].map(s => (
            <button key={s} onClick={() => setHash(s === "random" ? randomHex64() : SAMPLES[s])}
              style={{ fontSize:'11px', padding:'4px 12px', borderRadius:'999px', border:'0.5px solid rgba(255,255,255,0.10)', background:'transparent', color:'#8C8B84', cursor:'pointer', fontFamily:'inherit' }}>
              {s === "nomatch" ? "no match sample" : s === "nearmiss" ? "near-miss sample" : "random"}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
          <p style={{ fontSize:'10px', color:'#4A4A45', textTransform:'uppercase', letterSpacing:'0.14em', fontFamily:"'JetBrains Mono',monospace" }}>Source tag (optional)</p>
          <input type="text" placeholder="profile_photo" value={source} onChange={e => setSource(e.target.value)}
            style={{ width:'100%', fontSize:'13px', background:'#060605', border:'0.5px solid rgba(255,255,255,0.10)', borderRadius:'8px', padding:'8px 12px', color:'#F0EFE8', outline:'none', fontFamily:'inherit' }} />
        </div>
        <button onClick={runDemo} disabled={status === "loading"}
          style={{ width:'100%', padding:'10px', borderRadius:'8px', border:'0.5px solid rgba(255,255,255,0.12)', background:'transparent', fontSize:'13px', color:'#F0EFE8', cursor: status === "loading" ? 'not-allowed' : 'pointer', opacity: status === "loading" ? 0.6 : 1, fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
          {status === "loading" ? (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation:'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>querying…</>
          ) : "Check for a match →"}
        </button>
        <p style={{ fontSize:'11px', color:'#4A4A45', lineHeight:1.6, fontFamily:"'JetBrains Mono',monospace" }}>
          Live sandbox · first request may take ~10s (Render cold start)
        </p>
      </div>
      {/* Response panel */}
      <div style={{ borderRadius:'12px', border:'0.5px solid rgba(255,255,255,0.08)', background:'#0a0a08', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:dotColor, flexShrink:0, transition:'background 0.3s' }}/>
          <span style={{ fontSize:'12px', color:'#8C8B84', fontFamily:"'JetBrains Mono',monospace" }}>{statusLabel}</span>
          {latency && <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#4A4A45' }}>{latency}</span>}
        </div>
        <p style={{ fontSize:'10px', color:'#4A4A45', textTransform:'uppercase', letterSpacing:'0.14em', fontFamily:"'JetBrains Mono',monospace" }}>Response</p>
        <pre style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', background:'#060605', borderRadius:'8px', padding:'12px', minHeight:'200px', whiteSpace:'pre-wrap', wordBreak:'break-all', lineHeight:1.7, overflow:'auto', flex:1 }}
          dangerouslySetInnerHTML={{ __html: syntaxHighlight(response) }} />
      </div>
    </div>
  );
}

// ── FAQ accordion ─────────────────────────────────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? ' faq-open' : ''}`}>
      <button className="faq-q" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && <div className="faq-a"><p>{a}</p></div>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiTab,  setApiTab]  = useState('shield');
  const [webhookLang, setWebhookLang] = useState('node');

  // Waitlist form
  const [form, setForm] = useState({
    contact_name: '', work_email: '', company_name: '', platform_url: '',
    platform_type: '', monthly_upload_volume: '', referral_source: '',
    use_case: '', pipeline_choice: '',
  });
  const [formStatus, setFormStatus] = useState('idle');
  const [formError,  setFormError]  = useState('');
  const handleFormChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleFormSubmit = async () => {
    setFormError('');
    if (!form.contact_name || !form.work_email || !form.company_name ||
        !form.platform_url || !form.platform_type || !form.monthly_upload_volume) {
      setFormError('Please fill in all required fields.'); return;
    }
    setFormStatus('submitting');
const payload = Object.fromEntries(
  Object.entries(form).filter(([_, v]) => v !== '')
);
try {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/waitlist`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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

  // Liability calculator — direct violation count, no synthetic "violation rate"
  // (there is no published FTC benchmark for this — see disclaimer copy below)
  const [violationsEstimate, setViolationsEstimate] = useState(5);
  const finePerViolation   = 53088;
  const estimatedExposure  = violationsEstimate * finePerViolation;
  const formatExposure = n => {
    if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `$${(n/1_000).toFixed(0)}K`;
    return `$${n}`;
  };

  return (
    <>
      <div className="page-frame">
      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <nav className="screen01-nav">
        <a className="logo screen01-logo" href="#top" aria-label="Corvinth home">
          <svg viewBox="0 0 40 44" aria-hidden="true" focusable="false"><path d="M20 1 38 11v8l-9 4v-7l-9-5-10 6v10l10 6 9-5v-6l9 4v7L20 43 2 33V11L20 1Z"/></svg>
          <span>Corvinth</span>
        </a>
        <div className="screen01-nav-links">
          <a href="#how">How it works</a>
          <a href="#architecture">Architecture</a>
          <a href="#demo">Live demo</a>
          <a href="#tida">Why now</a>
          <a href="https://corvinth-api.onrender.com/docs" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
        <div className="nav-right screen01-nav-actions">
          <a className="screen01-nav-cta" href="#contact">Request access</a>
          <button className={`hamburger${mobileMenuOpen ? ' open' : ''}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu" aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation">
            <span/><span/><span/>
          </button>
        </div>
      </nav>

      {/* ── MOBILE MENU ──────────────────────────────────────────────────────── */}
      <div id="mobile-navigation" className={`mobile-menu${mobileMenuOpen ? ' open' : ''}`}>
        <a href="#how"     onClick={() => setMobileMenuOpen(false)}>How it works</a>
        <a href="#architecture" onClick={() => setMobileMenuOpen(false)}>Architecture</a>
        <a href="#demo"    onClick={() => setMobileMenuOpen(false)}>Live demo</a>
        <a href="#tida" onClick={() => setMobileMenuOpen(false)}>Why now</a>
        <a href="https://corvinth-api.onrender.com/docs" target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}>Docs</a>
        <a href="#contact" className="mobile-cta" onClick={() => setMobileMenuOpen(false)}>Request access</a>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section id="top" className="hero" aria-labelledby="hero-title">
        <div className="hero-backdrop" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="hero-category">Image safety infrastructure</p>
            <h1 id="hero-title">
              <span>Reported content comes back.</span>
              <span>Corvinth helps you find the copies.</span>
            </h1>
            <p className="hero-description">
              Image safety infrastructure for platforms with user-generated content. Corvinth helps your team find copies of content it has chosen to track — across existing platform content and new uploads.
            </p>
            <p className="hero-boundary">Corvinth returns the detection result.{' '}<br /><strong>Your platform decides what happens next.</strong></p>
            <div className="hero-cta">
              <a className="hero-cta-primary" href="#demo">See it work <span aria-hidden="true">→</span></a>
              <a className="hero-cta-secondary" href="#contact">Request access</a>
            </div>
            <p className="hero-trust">PLATFORM-SCOPED MATCHING <span>·</span> MANAGED OR CUSTOMER COMPUTE <span>·</span> NO DURABLE IMAGE-BYTE STORAGE</p>
          </div>

          <div className="hero-proof" aria-label="Illustration of platform-scoped detection">
            <div className="hero-proof-header">
              <div><span className="hero-proof-mark" aria-hidden="true" /><span>Platform-scoped detection</span></div>
              <span className="hero-proof-scope">Same platform scope</span>
            </div>
            <div className="hero-proof-flow">
              <div className="hero-proof-step hero-proof-selected">
                <h2>Platform-selected<br />image</h2>
                <div className="hero-proof-photo"><img className="hero-proof-source-image" src="/screen01-reference.webp" alt="Adult woman seated beside a mountain lake at sunset" /></div>
                <div className="hero-proof-step-caption"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2 20 5v6c0 5-3.3 8.5-8 11-4.7-2.5-8-6-8-11V5l8-3Z"/><path d="m8.5 12 2.3 2.3 4.8-5"/></svg><span>Selected by your team</span></div>
              </div>
              <div className="hero-proof-connector hero-proof-reference" aria-label="Detection reference"><span>Detection<br />reference</span><b aria-hidden="true">→</b></div>
              <div className="hero-proof-step hero-proof-matching">
                <h2>Platform-scoped<br />matching</h2>
                <p>existing content · new uploads</p>
                <div className="hero-proof-stack" aria-hidden="true"><i /><i /><i /><i /></div>
                <div className="hero-proof-step-caption"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><span>Searching your<br />platform content</span></div>
              </div>
              <div className="hero-proof-connector hero-proof-arrow" aria-hidden="true"><b>→</b></div>
              <div className="hero-proof-step hero-proof-result">
                <h2>Match found</h2>
                <div className="hero-proof-thumbnails" aria-hidden="true">
                  <img src="/screen01-reference.webp" alt="" />
                  <img src="/screen01-reference.webp" alt="" />
                  <img src="/screen01-reference.webp" alt="" />
                  <img src="/screen01-reference.webp" alt="" />
                </div>
                <div className="hero-proof-details">
                  <span>Matched object</span><strong>obj_••92</strong>
                  <span>Platform scope</span><strong>same platform</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-feature-row">
          <div><span className="hero-feature-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="10"/><circle cx="16" cy="16" r="3"/><path d="M16 1v7m0 16v7M1 16h7m16 0h7"/></svg></span><p><strong>Platform-scoped matching</strong><span>Find matching content across your platform.</span></p></div>
          <div><span className="hero-feature-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><rect x="5" y="5" width="22" height="6" rx="1"/><rect x="5" y="13" width="22" height="6" rx="1"/><rect x="5" y="21" width="22" height="6" rx="1"/><path d="M22 8h2m-2 8h2m-2 8h2"/></svg></span><p><strong>Managed or Customer Compute</strong><span>Choose where image compute happens.</span></p></div>
          <div><span className="hero-feature-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="m12 20 8-8M11 13l-2 2a6 6 0 0 0 8 8l2-2m2-2 2-2a6 6 0 0 0-8-8l-2 2"/></svg></span><p><strong>Your workflow stays yours</strong><span>Detection results fit into your platform workflow.</span></p></div>
        </div>
      </section>

      {/* ── BUILT FOR — self-identification ──────────────────────────────────── */}
      <section style={{ padding:'0 2.5rem 5rem', background:'var(--bg)' }}>
        <div className="inner" style={{ textAlign:'center' }}>
          <p style={{ fontSize:'11px', color:'var(--green)', textTransform:'uppercase', letterSpacing:'0.16em', fontFamily:'var(--font-mono)', marginBottom:'1.5rem' }}>Built for</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'14px', justifyContent:'center', maxWidth:'1050px', margin:'0 auto' }}>
            {['Social Platforms','Dating Apps','Messaging Apps','Creator Platforms','AI Communities','Adult Content Platforms'].map(type => (
              <div key={type} style={{ padding:'16px 34px', borderRadius:'999px', border:'1px solid rgba(0, 229, 155, 0.2)', background:'linear-gradient(145deg, rgba(0, 229, 155, 0.07), var(--bg-card))', fontSize:'15px', color:'var(--text)', fontFamily:'var(--font-mono)', letterSpacing:'0.02em', boxShadow:'0 8px 24px rgba(0, 0, 0, 0.16)' }}>
                {type}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCREEN 02 — WHY CORVINTH ─────────────────────────────────────────── */}
      <section className="screen02" aria-labelledby="screen02-title">
        <div className="screen02-inner">
          <div className="screen02-intro">
            <p className="screen02-eyebrow">Why Corvinth</p>
            <h2 id="screen02-title">Save months of engineering</h2>
            <p className="screen02-subtitle">
              Re-upload detection gets complicated fast. Reference indexing and audit trails have to work together in production. Corvinth gives your team that detection layer without turning it into another infrastructure project.
            </p>
          </div>
          <div className="screen02-cards">
            <article className="screen02-card">
              <span className="screen02-card-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="7" height="6" rx="1"/><rect x="14.5" y="13" width="7" height="6" rx="1"/><path d="M9.5 8h4a4 4 0 0 1 4 4v1M14.5 16h-4a4 4 0 0 1-4-4v-1"/></svg></span>
              <h3>Bounded integration surface.</h3>
              <p>Connect Corvinth to your existing storage and upload workflow. Use Corvinth-managed compute or keep image processing inside your own infrastructure — without rebuilding your application around a new moderation stack.</p>
            </article>
            <article className="screen02-card">
              <span className="screen02-card-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 2.5h8l4 4V21.5H6z"/><path d="M14 2.5v4h4M9 11h6M9 15h6M9 19h4"/></svg></span>
              <h3>Evidence from every case.</h3>
              <p>Every case and match leaves a structured record your team can use for review, investigation, and internal evidence.</p>
            </article>
            <article className="screen02-card">
              <span className="screen02-card-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2.5 20 5.5v5.7c0 5-3.1 8.1-8 10.3-4.9-2.2-8-5.3-8-10.3V5.5z"/><path d="m8.5 12 2.4 2.4 4.8-5"/></svg></span>
              <h3>Your policy. Our signal.</h3>
              <p>Corvinth detects the match and returns the signal. Your platform decides what happens next — review it, remove it, or take no action.</p>
            </article>
          </div>
          <p className="screen02-close">Corvinth is category-agnostic. Your platform decides which visual references should be tracked; Corvinth provides the matching and evidence infrastructure underneath it.</p>
        </div>
      </section>

      {/* ── SCREEN 03 — TRUSTED ARCHITECTURE ────────────────────────────────── */}
      <section id="architecture" className="architecture-section" aria-labelledby="architecture-title">
        <div className="architecture-inner">
          <header className="architecture-intro">
            <p className="architecture-eyebrow">Trusted architecture</p>
            <h2 id="architecture-title">Choose where image compute happens.</h2>
            <p className="architecture-subtitle">Use Corvinth-managed compute, or keep image processing inside your own infrastructure. Either way, Corvinth does not durably store image bytes.</p>
          </header>

          <div className="architecture-cards">
            <article className="architecture-card">
              <div className="architecture-card-head">
                <p className="architecture-mode">Mode A — Managed Compute</p>
                <span className="architecture-badge">Managed compute</span>
              </div>
              <h3>Corvinth handles the image compute.</h3>
              <ol className="architecture-flow" aria-label="Managed Compute flow">
                <li>Your storage</li>
                <li>ephemeral fetch access</li>
                <li>Corvinth compute</li>
                <li>Corvinth matching</li>
                <li>match signal</li>
              </ol>
              <p className="architecture-card-copy">Corvinth fetches the referenced image when needed, computes the detection signal, and does not retain the image bytes.</p>
            </article>

            <article className="architecture-card">
              <div className="architecture-card-head">
                <p className="architecture-mode">Mode B — Customer Compute</p>
                <span className="architecture-badge">Customer compute</span>
              </div>
              <h3>Image pixels stay with you.</h3>
              <ol className="architecture-flow" aria-label="Customer Compute flow">
                <li>Your image</li>
                <li>your compute</li>
                <li>fingerprint</li>
                <li>Corvinth matching</li>
                <li>match signal</li>
              </ol>
              <p className="architecture-card-copy">Image processing stays inside your infrastructure. Corvinth receives the required fingerprint together with the platform-scoped object reference needed to correlate detection results back to content in your system — never the image itself.</p>
            </article>
          </div>

          <div className="architecture-shared" aria-label="Shared architecture properties">
            <span>No durable image-byte storage</span>
            <span>Choose your compute boundary</span>
            <span>Same matching infrastructure</span>
          </div>

          <div className="architecture-trust">
            <p><span aria-hidden="true">✓</span><strong>Two compute models</strong><span>Choose the trust boundary that fits your platform.</span></p>
            <p><span aria-hidden="true">✓</span><strong>No durable image-byte storage</strong><span>Corvinth does not build a repository of customer images.</span></p>
            <p><span aria-hidden="true">✓</span><strong>Your policy stays yours</strong><span>Corvinth returns detection results and relevant context; your platform decides what happens next.</span></p>
          </div>
        </div>
      </section>

      <hr/>

      {/* ── SCREEN 04 — HOW CORVINTH WORKS ───────────────────────────────── */}
      <section id="how" className="screen04" aria-labelledby="screen04-title">
        <div className="screen04-inner">
          <header className="screen04-intro">
            <p className="screen04-eyebrow">How Corvinth works</p>
            <h2 id="screen04-title">Report it once. Catch it when it comes back.</h2>
            <p>When your platform chooses reported content to track, Corvinth uses it as a detection reference. Perceptual matching checks that platform&apos;s stored and future fingerprints.</p>
          </header>

          <div className="screen04-reference">
            <span className="screen04-step">01 / PLATFORM-SELECTED REFERENCE</span>
            <h3>Reported content</h3>
            <p>Your platform tells Corvinth what should be tracked.</p>
          </div>

          <div className="screen04-connector" aria-hidden="true"><span>↓</span></div>

          <div className="screen04-matching">
            <div className="screen04-matching-head">
              <span className="screen04-step">02 / CONTINUOUS MATCHING</span>
              <h3>Continuous perceptual matching — both directions.</h3>
              <p>Continuous perceptual matching checks newly reported content against previously stored fingerprints from that platform, then keeps matching against new uploads from that platform as they arrive.</p>
            </div>
            <div className="screen04-fingerprint" aria-label="Platform-scoped fingerprint matching in both directions">
              <div className="screen04-fingerprint-node screen04-fingerprint-existing">
                <span>Previously stored</span>
                <strong>That platform&apos;s previously stored fingerprints</strong>
              </div>
              <div className="screen04-fingerprint-node screen04-fingerprint-reference">
                <span>Detection reference</span>
                <strong>reported fingerprint</strong>
              </div>
              <div className="screen04-fingerprint-node screen04-fingerprint-future">
                <span>Future uploads</span>
                <strong>That platform&apos;s new upload fingerprints</strong>
              </div>
            </div>
          </div>

          <div className="screen04-connector" aria-hidden="true"><span>↓</span></div>

          <div className="screen04-result">
            <span className="screen04-step">03 / MATCH + CASE EVIDENCE</span>
            <div>
              <h3>Corvinth returns the match and evidence.</h3>
              <p>Your platform decides what happens next.</p>
            </div>
            <span className="screen04-boundary">Corvinth detects. Platform enforces.</span>
          </div>
        </div>
      </section>

      <hr/>

      {/* ── SCREEN 06 — EVIDENCE INFRASTRUCTURE ─────────────────────────────── */}
      <section id="shield" className="screen06" aria-labelledby="screen06-title">
        <div className="screen06-inner">
          <header className="screen06-intro">
            <p className="screen06-eyebrow">Built for real cases</p>
            <h2 id="screen06-title">Detection is only half the job. The match needs evidence behind it.</h2>
            <p>Corvinth keeps platform-selected visual references, matches, and timing linked so your team isn&apos;t piecing together detection history from isolated hashes.</p>
          </header>

          <div className="screen06-chain" aria-label="Evidence chain from visual reference to detection event">
            {[
              'Platform-selected visual reference',
              'Case',
              'Matched platform object',
              'Detection event + timing',
            ].map((step, index) => (
              <div className="screen06-chain-step" key={step}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>

          <div className="screen06-capabilities">
            <article>
              <p className="screen06-capability-index">01 / Case evidence</p>
              <h3>Every match ties back to its originating case and involved platform content.</h3>
            </article>
            <article>
              <p className="screen06-capability-index">02 / Traceable object identity</p>
              <h3>Evidence points to the exact platform object being investigated, rather than only an isolated hash or vector.</h3>
            </article>
            <article>
              <p className="screen06-capability-index">03 / Audit history</p>
              <h3>References, matches, case history, and timing stay connected so your team can trace the detection history of the case.</h3>
            </article>
            <article>
              <p className="screen06-capability-index">04 / Tenant-isolated matching</p>
              <h3>A platform&apos;s references, matching, and evidence remain scoped to that platform. Another tenant&apos;s case, object, or evidence metadata must not be returned or exposed.</h3>
            </article>
          </div>

          <div className="screen06-outcome" aria-label="Detection evidence and platform policy boundary">
            <span>Match</span>
            <i aria-hidden="true">↓</i>
            <span>Case + object + timing + evidence</span>
            <i aria-hidden="true">↓</i>
            <strong>Your platform&apos;s policy</strong>
          </div>
          <p className="screen06-closing">Corvinth records the detection evidence. Your platform decides what happens next.</p>
        </div>
      </section>

      <hr/>

      {/* ── SCREEN 07 — INTEGRATION ──────────────────────────────────────────── */}
      <section id="integration" className="screen07" aria-labelledby="screen07-title">
        <div className="screen07-inner">
          <header className="screen07-intro">
            <p className="screen07-eyebrow">Integration</p>
            <h2 id="screen07-title">Add the detection layer. Keep the rest of your stack.</h2>
            <p>Connect reported references and content to check through the compute path that fits your stack, then route Corvinth&apos;s matches and evidence into the workflow your team already uses.</p>
          </header>

          <div className="screen07-architecture" aria-label="How Corvinth connects into your existing stack">
            <section className="screen07-platform-boundary" aria-labelledby="screen07-platform-title">
              <p id="screen07-platform-title" className="screen07-boundary-label"><span>01</span> Your platform</p>
              <div className="screen07-platform-source">
                <span>Start with</span>
                <strong>Reported reference /<br />content to check</strong>
              </div>
              <div className="screen07-platform-paths">
                <article className="screen07-platform-path screen07-customer-path">
                  <p>Customer Compute</p>
                  <span>Derived representation</span>
                  <small>Direct to Detection / matching</small>
                </article>
                <article className="screen07-platform-path screen07-managed-path">
                  <p>Managed path</p>
                  <span>Ephemeral fetch access</span>
                  <small>To Managed Compute</small>
                </article>
              </div>
            </section>

            <div className="screen07-mobile-ingress" aria-hidden="true">
              <span>Customer Compute <i>↓</i> Detection / matching</span>
              <span>Managed path <i>↓</i> Managed Compute</span>
            </div>

            <section className="screen07-corvinth-boundary" aria-labelledby="screen07-corvinth-title">
              <p id="screen07-corvinth-title" className="screen07-boundary-label"><span>02</span> Corvinth</p>
              <div className="screen07-corvinth-nodes">
                <article className="screen07-managed-node">
                  <span>Managed path</span>
                  <strong>Managed Compute</strong>
                </article>
                <i className="screen07-node-arrow" aria-hidden="true">↓</i>
                <article className="screen07-detection-node">
                  <span>Both paths connect here</span>
                  <strong>Detection / matching</strong>
                </article>
              </div>
            </section>

            <div className="screen07-result-route" aria-label="Detection result flows into your existing workflow">
              <span>Match + evidence</span>
              <i aria-hidden="true">→</i>
              <strong>Your existing workflow</strong>
            </div>
          </div>

          <ol className="screen07-tasks" aria-label="Three bounded integration tasks">
            <li>
              <p>01 / Scope</p>
              <h3>Establish the platform boundary.</h3>
              <span>Corvinth operates inside that platform&apos;s isolated scope for references, matching, and evidence.</span>
            </li>
            <li>
              <p>02 / Connect detection</p>
              <h3>Connect the compute path that fits your stack.</h3>
              <span className="screen07-task-paths"><b>Managed Compute</b><b>Customer Compute</b></span>
              <span>Both paths connect into the same Corvinth detection layer.</span>
            </li>
            <li>
              <p>03 / Route results</p>
              <h3>Send matches and evidence into the workflow you already use.</h3>
              <span>Corvinth result <i>→</i> internal tooling <i>→</i> review / case handling <i>→</i> platform action</span>
              <span>Corvinth detects and returns context. The platform decides what happens next.</span>
            </li>
          </ol>

          <div className="screen07-ownership-strip" aria-label="Product boundary">
            <article>
              <p>Your stack stays yours</p>
              <ul>
                {['Storage', 'Moderation decisions', 'Case handling', 'Enforcement'].map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
            <article>
              <p>Corvinth adds</p>
              <ul>
                {['Detection references', 'Matching', 'Evidence context'].map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          </div>

          <p className="screen07-closing">Corvinth adds the detection layer. Your product workflow stays yours.</p>
        </div>
      </section>

      <hr/>

      {/* ── API REFERENCE ─────────────────────────────────────────────────────── */}
      <section className="bg-section">
        <div className="inner" style={{ maxWidth:'860px' }}>
          <p className="section-tag">api reference</p>
          <h2 className="section-title">Everything you need. Nothing you don&apos;t.</h2>
          <p className="section-sub">Two pipelines. One decision. Every endpoint returns a structured response your upload handler can act on immediately.</p>
          <div className="api-grid">
            <div>
              {/* Meta */}
              <div style={{ fontSize:'10px', fontFamily:"'JetBrains Mono',monospace", color:'#4A4A45', textTransform:'uppercase', letterSpacing:'0.10em', marginBottom:'8px' }}>Meta</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'1.5rem' }}>
                {[
                  { method:'GET', endpoint:'/health', color:'#8C8B84', bg:'rgba(255,255,255,0.04)' },
                ].map(ep => (
                  <div key={ep.endpoint+ep.method} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 14px', background:'#060605', border:'0.5px solid rgba(255,255,255,0.07)', borderRadius:'8px', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px' }}>
                    <span style={{ fontSize:'10px', fontWeight:500, padding:'2px 8px', borderRadius:'4px', background:ep.bg, color:ep.color, flexShrink:0, letterSpacing:'0.06em' }}>{ep.method}</span>
                    <span style={{ color:'#8C8B84' }}>{ep.endpoint}</span>
                  </div>
                ))}
              </div>
              {/* Platform */}
              <div style={{ fontSize:'10px', fontFamily:"'JetBrains Mono',monospace", color:'#4A4A45', textTransform:'uppercase', letterSpacing:'0.10em', marginBottom:'8px' }}>Platform</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'1.5rem' }}>
                {[
                  { method:'POST', endpoint:'/platform/register', color:'#00E59B', bg:'rgba(0,229,155,0.08)' },
                  { method:'GET',  endpoint:'/platform/verify',    color:'#4D9EFF', bg:'rgba(77,158,255,0.08)' },
                ].map(ep => (
                  <div key={ep.endpoint+ep.method} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 14px', background:'#060605', border:'0.5px solid rgba(255,255,255,0.07)', borderRadius:'8px', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px' }}>
                    <span style={{ fontSize:'10px', fontWeight:500, padding:'2px 8px', borderRadius:'4px', background:ep.bg, color:ep.color, flexShrink:0, letterSpacing:'0.06em' }}>{ep.method}</span>
                    <span style={{ color:'#8C8B84' }}>{ep.endpoint}</span>
                  </div>
                ))}
              </div>
              {/* Shield endpoints */}
              <div style={{ fontSize:'10px', fontFamily:"'JetBrains Mono',monospace", color:'#4A4A45', textTransform:'uppercase', letterSpacing:'0.10em', marginBottom:'8px' }}>Shield</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'1.5rem' }}>
                {[
                  { method:'POST', endpoint:'/hash/check',         color:'#00E59B', bg:'rgba(0,229,155,0.08)'  },
                  { method:'POST', endpoint:'/hash/add',            color:'#00E59B', bg:'rgba(0,229,155,0.08)'  },
                  { method:'GET',  endpoint:'/cases/{case_uuid}',   color:'#4D9EFF', bg:'rgba(77,158,255,0.08)' },
                  { method:'POST', endpoint:'/cases/{case_uuid}/confirm', color:'#00E59B', bg:'rgba(0,229,155,0.08)' },
                  { method:'GET',  endpoint:'/cases/{case_uuid}/audit',   color:'#4D9EFF', bg:'rgba(77,158,255,0.08)' },
                  { method:'GET',  endpoint:'/cases/{case_uuid}/challenge', color:'#4D9EFF', bg:'rgba(77,158,255,0.08)' },
                ].map(ep => (
                  <div key={ep.endpoint+ep.method} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 14px', background:'#060605', border:'0.5px solid rgba(255,255,255,0.07)', borderRadius:'8px', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px' }}>
                    <span style={{ fontSize:'10px', fontWeight:500, padding:'2px 8px', borderRadius:'4px', background:ep.bg, color:ep.color, flexShrink:0, letterSpacing:'0.06em' }}>{ep.method}</span>
                    <span style={{ color:'#8C8B84' }}>{ep.endpoint}</span>
                  </div>
                ))}
              </div>
              {/* Pulse endpoints */}
              <div style={{ fontSize:'10px', fontFamily:"'JetBrains Mono',monospace", color:'#4A4A45', textTransform:'uppercase', letterSpacing:'0.10em', marginBottom:'8px' }}>Pulse</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'1.5rem' }}>
                {[
                  { method:'POST',   endpoint:'/platform/complaints',       color:'#4D9EFF', bg:'rgba(77,158,255,0.08)' },
                  { method:'GET',    endpoint:'/platform/complaints',        color:'#4D9EFF', bg:'rgba(77,158,255,0.08)' },
                  { method:'DELETE', endpoint:'/platform/complaints/{id}',   color:'#FF4D4D', bg:'rgba(255,77,77,0.08)'  },
                ].map(ep => (
                  <div key={ep.endpoint+ep.method} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 14px', background:'#060605', border:'0.5px solid rgba(77,158,255,0.12)', borderRadius:'8px', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px' }}>
                    <span style={{ fontSize:'10px', fontWeight:500, padding:'2px 8px', borderRadius:'4px', background:ep.bg, color:ep.color, flexShrink:0, letterSpacing:'0.06em' }}>{ep.method}</span>
                    <span style={{ color:'#8C8B84' }}>{ep.endpoint}</span>
                  </div>
                ))}
              </div>
              {/* Appeals + Hashes */}
              <div style={{ fontSize:'10px', fontFamily:"'JetBrains Mono',monospace", color:'#4A4A45', textTransform:'uppercase', letterSpacing:'0.10em', marginBottom:'8px' }}>Appeals &amp; Hashes</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'1.5rem' }}>
                {[
                  { method:'POST', endpoint:'/appeals',      color:'#00E59B', bg:'rgba(0,229,155,0.08)'  },
                  { method:'GET',  endpoint:'/hashes/count', color:'#4D9EFF', bg:'rgba(77,158,255,0.08)' },
                ].map(ep => (
                  <div key={ep.endpoint} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 14px', background:'#060605', border:'0.5px solid rgba(255,255,255,0.07)', borderRadius:'8px', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px' }}>
                    <span style={{ fontSize:'10px', fontWeight:500, padding:'2px 8px', borderRadius:'4px', background:ep.bg, color:ep.color, flexShrink:0, letterSpacing:'0.06em' }}>{ep.method}</span>
                    <span style={{ color:'#8C8B84' }}>{ep.endpoint}</span>
                  </div>
                ))}
              </div>
              {/* Demo */}
              <div style={{ fontSize:'10px', fontFamily:"'JetBrains Mono',monospace", color:'#4A4A45', textTransform:'uppercase', letterSpacing:'0.10em', marginBottom:'8px' }}>Demo</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {[
                  { method:'POST', endpoint:'/demo/check', color:'#FFB224', bg:'rgba(255,178,36,0.08)' },
                ].map(ep => (
                  <div key={ep.endpoint} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 14px', background:'#060605', border:'0.5px solid rgba(255,178,36,0.12)', borderRadius:'8px', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px' }}>
                    <span style={{ fontSize:'10px', fontWeight:500, padding:'2px 8px', borderRadius:'4px', background:ep.bg, color:ep.color, flexShrink:0, letterSpacing:'0.06em' }}>{ep.method}</span>
                    <span style={{ color:'#8C8B84' }}>{ep.endpoint}</span>
                  </div>
                ))}
                <p style={{ fontSize:'11px', color:'#4A4A45', marginTop:'4px', lineHeight:1.6 }}>No API key required — powers the live demo below. Rate limited to 10 requests/minute, 50/hour.</p>
              </div>
            </div>

            {/* Response tabs */}
            <div>
              <div className="tab-bar">
                <button className={`tab-btn${apiTab === 'shield' ? ' active-shield' : ''}`} onClick={() => setApiTab('shield')}>Shield — EXACT</button>
                <button className={`tab-btn${apiTab === 'clean'  ? ' active-shield' : ''}`} onClick={() => setApiTab('clean')}>Shield — CLEAN</button>
                <button className={`tab-btn${apiTab === 'video'  ? ' active-shield' : ''}`} onClick={() => setApiTab('video')}>Video lane</button>
                <button className={`tab-btn${apiTab === 'pulse'  ? ' active-pulse'  : ''}`} onClick={() => setApiTab('pulse')}>Pulse response</button>
                <button className={`tab-btn${apiTab === 'libupsert'    ? ' active-pulse' : ''}`} onClick={() => setApiTab('libupsert')}>Backfill — upsert (Mode B)</button>
                <button className={`tab-btn${apiTab === 'libupserturl' ? ' active-pulse' : ''}`} onClick={() => setApiTab('libupserturl')}>Backfill — upsert URL (Mode A)</button>
                <button className={`tab-btn${apiTab === 'libdelete'    ? ' active-pulse' : ''}`} onClick={() => setApiTab('libdelete')}>Backfill — delete vector</button>
                <button className={`tab-btn${apiTab === 'libjob'       ? ' active-pulse' : ''}`} onClick={() => setApiTab('libjob')}>Backfill — job status</button>
              </div>
              <div style={{ background:'#060605', border:`0.5px solid ${apiTab === 'pulse' ? 'rgba(77,158,255,0.15)' : 'rgba(255,255,255,0.07)'}`, borderRadius:'12px', padding:'1.5rem', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', lineHeight:1.9 }}>
                {apiTab === 'shield' ? (
                  <>
                    <div style={{ color:'#4A4A45', marginBottom:'10px', fontSize:'11px' }}># POST /hash/check response</div>
                    <div style={{ color:'#F0EFE8' }}>{'{'}</div>
                    <div style={{ paddingLeft:'18px' }}>
                      <div><span style={{ color:'#00E59B' }}>"case_uuid"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"cse_83f1a2b3…"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"match_found"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#4D9EFF' }}>true</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"classification"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FF4D4D' }}>"EXACT"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"action"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FF4D4D' }}>"content_removed"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"hamming_distance"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#4D9EFF' }}>2</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"matched_case_id"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"case_7c4d…"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"review_queue"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#4A4A45' }}>null</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"pipeline_1_result"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FF4D4D' }}>"EXACT"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"pipeline_2_queued"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#4D9EFF' }}>false</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"confidence_score"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#4D9EFF' }}>0.9922</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"matched_lane"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"standard"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"timestamp"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"2026-06-27T…"</span></div>
                    </div>
                    <div style={{ color:'#F0EFE8' }}>{'}'}</div>
                  </>
                ) : apiTab === 'clean' ? (
                  <>
                    <div style={{ color:'#4A4A45', marginBottom:'10px', fontSize:'11px' }}># POST /hash/check — CLEAN (no match)</div>
                    <div style={{ color:'#F0EFE8' }}>{'{'}</div>
                    <div style={{ paddingLeft:'18px' }}>
                      <div><span style={{ color:'#00E59B' }}>"case_uuid"</span>: <span style={{ color:'#FFB224' }}>"cse_44a9f2c1…"</span>,</div>
                      <div><span style={{ color:'#00E59B' }}>"match_found"</span>: <span style={{ color:'#4D9EFF' }}>false</span>,</div>
                      <div><span style={{ color:'#00E59B' }}>"classification"</span>: <span style={{ color:'#00E59B' }}>"CLEAN"</span>,</div>
                      <div><span style={{ color:'#00E59B' }}>"action"</span>: <span style={{ color:'#00E59B' }}>"content_allowed"</span>,</div>
                      <div><span style={{ color:'#00E59B' }}>"hamming_distance"</span>: <span style={{ color:'#4A4A45' }}>null</span>,</div>
                      <div><span style={{ color:'#00E59B' }}>"confidence_score"</span>: <span style={{ color:'#4A4A45' }}>null</span>,</div>
                      <div><span style={{ color:'#00E59B' }}>"matched_lane"</span>: <span style={{ color:'#4A4A45' }}>null</span>,</div>
                      <div><span style={{ color:'#00E59B' }}>"pipeline_2_queued"</span>: <span style={{ color:'#4D9EFF' }}>false</span>,</div>
                      <div><span style={{ color:'#00E59B' }}>"timestamp"</span>: <span style={{ color:'#FFB224' }}>"2026-06-27T…"</span></div>
                    </div>
                    <div style={{ color:'#F0EFE8' }}>{'}'}</div>
                  </>
                ) : apiTab === 'video' ? (
                  <>
                    <div style={{ color:'#4A4A45', marginBottom:'10px', fontSize:'11px' }}># POST /hash/check — video exact match</div>
                    <div style={{ color:'#F0EFE8' }}>{'{'}</div>
                    <div style={{ paddingLeft:'18px' }}>
                      <div><span style={{ color:'#00E59B' }}>"case_uuid"</span>: <span style={{ color:'#FFB224' }}>"cse_77d2c1b0…"</span>,</div>
                      <div><span style={{ color:'#00E59B' }}>"match_found"</span>: <span style={{ color:'#4D9EFF' }}>true</span>,</div>
                      <div><span style={{ color:'#00E59B' }}>"classification"</span>: <span style={{ color:'#FF4D4D' }}>"EXACT"</span>,</div>
                      <div><span style={{ color:'#00E59B' }}>"action"</span>: <span style={{ color:'#FF4D4D' }}>"content_removed"</span>,</div>
                      <div><span style={{ color:'#00E59B' }}>"matched_lane"</span>: <span style={{ color:'#FFB224' }}>"video_md5"</span>,</div>
                      <div><span style={{ color:'#00E59B' }}>"matched_case_id"</span>: <span style={{ color:'#FFB224' }}>"case_3b1e…"</span>,</div>
                      <div><span style={{ color:'#00E59B' }}>"pipeline_2_queued"</span>: <span style={{ color:'#4D9EFF' }}>false</span>,</div>
                      <div><span style={{ color:'#00E59B' }}>"timestamp"</span>: <span style={{ color:'#FFB224' }}>"2026-06-27T…"</span></div>
                    </div>
                    <div style={{ color:'#F0EFE8' }}>{'}'}</div>
                  </>
                ) : apiTab === 'pulse' ? (
                  <>
                    <div style={{ color:'#4A4A45', marginBottom:'10px', fontSize:'11px' }}># POST /platform/complaints response</div>
                    <div style={{ color:'#F0EFE8' }}>{'{'}</div>
                    <div style={{ paddingLeft:'18px' }}>
                      <div><span style={{ color:'#4D9EFF' }}>"complaint_id"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"CPL-0041"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#4D9EFF' }}>"case_id"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"your-internal-ref"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#4D9EFF' }}>"platform_id"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"plt_abc123"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#4D9EFF' }}>"vector_stored"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#4D9EFF' }}>true</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#4D9EFF' }}>"message"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"Complaint registered. Future uploads matched."</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#4D9EFF' }}>"used_mock_extraction"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#4D9EFF' }}>false</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#4D9EFF' }}>"backfill_matches"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#F0EFE8' }}>[]</span></div>
                    </div>
                    <div style={{ color:'#F0EFE8' }}>{'}'}</div>
                  </>
                ) : apiTab === 'libupsert' ? (
                  <>
                    <div style={{ color:'#4A4A45', marginBottom:'10px', fontSize:'11px' }}># POST /pulse/library/batch-upsert — Mode B, no tier gate</div>
                    <div style={{ color:'#4A4A45', marginBottom:'10px', fontSize:'11px' }}>// platform computes DINOv2 locally, sends only vectors + your own content id</div>
                    <div style={{ color:'#F0EFE8' }}>{'{'}</div>
                    <div style={{ paddingLeft:'18px' }}>
                      <div><span style={{ color:'#00E59B' }}>"platform_id"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"plt_abc123"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"upserted_count"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#4D9EFF' }}>498</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"rejected"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#F0EFE8' }}>[</span><span style={{ color:'#FFB224' }}>"img_00391.jpg"</span><span style={{ color:'#F0EFE8' }}>, </span><span style={{ color:'#FFB224' }}>"img_00477.jpg"</span><span style={{ color:'#F0EFE8' }}>]</span></div>
                    </div>
                    <div style={{ color:'#F0EFE8' }}>{'}'}</div>
                    <div style={{ color:'#4A4A45', marginTop:'10px', fontSize:'11px' }}>// bad vectors in a batch land in "rejected" — they don't fail the whole request</div>
                  </>
                ) : apiTab === 'libupserturl' ? (
                  <>
                    <div style={{ color:'#4A4A45', marginBottom:'10px', fontSize:'11px' }}># POST /pulse/library/batch-upsert-url — Mode A, gated feature</div>
                    <div style={{ color:'#4A4A45', marginBottom:'10px', fontSize:'11px' }}>// Corvinth fetches + computes DINOv2 itself. Runs as an async job.</div>
                    <div style={{ color:'#F0EFE8' }}>{'{'}</div>
                    <div style={{ paddingLeft:'18px' }}>
                      <div><span style={{ color:'#00E59B' }}>"job_id"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"bfjob_9f13ac0e…"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"platform_id"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"plt_abc123"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"status"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"queued"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"total_items"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#4D9EFF' }}>25000</span></div>
                    </div>
                    <div style={{ color:'#F0EFE8' }}>{'}'}</div>
                    <div style={{ color:'#4A4A45', marginTop:'10px', fontSize:'11px' }}>// returns immediately — poll GET /pulse/library/jobs/{'{job_id}'} for progress</div>
                  </>
                ) : apiTab === 'libdelete' ? (
                  <>
                    <div style={{ color:'#4A4A45', marginBottom:'10px', fontSize:'11px' }}># DELETE /pulse/library/{'{platform_content_id}'}</div>
                    <div style={{ color:'#4A4A45', marginBottom:'10px', fontSize:'11px' }}>// call this whenever you delete the source content, or a stale vector can still match</div>
                    <div style={{ color:'#F0EFE8' }}>{'{'}</div>
                    <div style={{ paddingLeft:'18px' }}>
                      <div><span style={{ color:'#00E59B' }}>"platform_content_id"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"img_00391.jpg"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"deleted"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#4D9EFF' }}>true</span></div>
                    </div>
                    <div style={{ color:'#F0EFE8' }}>{'}'}</div>
                  </>
                ) : (
                  <>
                    <div style={{ color:'#4A4A45', marginBottom:'10px', fontSize:'11px' }}># GET /pulse/library/jobs/{'{job_id}'}</div>
                    <div style={{ color:'#F0EFE8' }}>{'{'}</div>
                    <div style={{ paddingLeft:'18px' }}>
                      <div><span style={{ color:'#00E59B' }}>"job_id"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"bfjob_9f13ac0e…"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"platform_id"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"plt_abc123"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"status"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"in_progress"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"total_items"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#4D9EFF' }}>25000</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"processed_count"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#4D9EFF' }}>18250</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"failed_count"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#4D9EFF' }}>12</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"last_processed_index"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#4D9EFF' }}>18262</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"created_at"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"2026-07-05T02:10:00Z"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"updated_at"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"2026-07-05T02:47:12Z"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#00E59B' }}>"completed_at"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#4A4A45' }}>null</span></div>
                    </div>
                    <div style={{ color:'#F0EFE8' }}>{'}'}</div>
                  </>
                )}
              </div>
            </div>



            {/* Webhook signature verification — day-one reference */}
            <div style={{ marginTop:'2.5rem' }}>
              <h3 style={{ fontSize:'15px', color:'#F0EFE8', marginBottom:'6px' }}>Verifying webhook signatures</h3>
              <p style={{ fontSize:'13px', color:'#8A8A82', lineHeight:1.7, marginBottom:'14px' }}>
                Every webhook is signed with HMAC-SHA256 over the exact raw request body — hash the bytes as received, not a re-parsed/re-serialized copy, or the signature won't match. Compare using a constant-time function (never <code>===</code> or <code>==</code>) so verification doesn't leak timing information.
              </p>
              <p style={{ fontSize:'13px', color:'#8A8A82', lineHeight:1.7, marginBottom:'14px' }}>
                Webhook delivery retries up to 3 times with exponential backoff if we don't receive a 2xx response — your handler may receive the same <code>case_uuid</code> + event more than once (e.g. if your ack was lost in transit even though you processed it). Dedupe on <code>case_uuid</code> before acting, so a duplicate delivery can't trigger <code>remove_content</code> twice.
              </p>

              <div className="tab-bar">
                <button className={`tab-btn${webhookLang === 'node' ? ' active-shield' : ''}`} onClick={() => setWebhookLang('node')}>Node.js</button>
                <button className={`tab-btn${webhookLang === 'python' ? ' active-shield' : ''}`} onClick={() => setWebhookLang('python')}>Python</button>
              </div>
              <pre style={{ background:'#060605', border:'0.5px solid rgba(255,255,255,0.07)', borderRadius:'12px', padding:'1.5rem', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', lineHeight:1.7, overflowX:'auto', color:'#F0EFE8' }}>
{webhookLang === 'node' ? `const crypto = require('crypto');
const express = require('express');
const app = express();

// Use express.raw(), not express.json() — you must hash the exact raw
// bytes Corvinth sent. Re-parsing and re-stringifying JSON can reorder
// keys or change spacing, silently breaking signature verification.
app.post('/webhooks/corvinth', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-corvinth-signature'];
  const rawBody = req.body; // Buffer, not parsed JSON

  const expected = crypto
    .createHmac('sha256', process.env.CORVINTH_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return res.status(401).send('Invalid signature');
  }

  const payload = JSON.parse(rawBody);
  // Dedupe on payload.case_uuid before acting — retries can redeliver.
  console.log('Verified Corvinth event:', payload.event, payload.case_uuid);
  res.status(200).send('OK');
});` : `import hmac, hashlib, os
from fastapi import FastAPI, Request, HTTPException

app = FastAPI()
WEBHOOK_SECRET = os.environ["CORVINTH_WEBHOOK_SECRET"]

@app.post("/webhooks/corvinth")
async def corvinth_webhook(request: Request):
    raw_body = await request.body()  # exact bytes, before any parsing
    signature = request.headers.get("x-corvinth-signature", "")

    expected = hmac.new(WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()
    # Dedupe on payload["case_uuid"] before acting — retries can redeliver.
    print("Verified Corvinth event:", payload["event"], payload["case_uuid"])
    return {"status": "ok"}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      <hr/>

      {/* ── LIVE API DEMO ─────────────────────────────────────────────────────── */}
      <section id="demo">
        <div className="inner">
          <p className="section-tag">live api demo</p>
          <h2 className="section-title">Test the Engine.</h2>
          <p className="section-sub">Submit a PDQ hash and see a real API response from the match engine. No API key required. Limited to 10 requests/minute.</p>
          <ApiDemo/>
        </div>
      </section>

      <hr/>

      {/* ── SCREEN 08 — DATA BOUNDARY ─────────────────────────────────────────── */}
      <section id="data-boundary" className="screen08" aria-labelledby="screen08-title">
        <div className="screen08-inner">
          <header className="screen08-intro">
            <p className="screen08-eyebrow">Data boundary</p>
            <h2 id="screen08-title">What Corvinth receives. What Corvinth keeps.</h2>
            <p>The data boundary depends on where image compute happens. In either model, Corvinth retains the platform-scoped detection data and context required to operate the product—not a repository of customer image bytes.</p>
          </header>
          <section className="screen08-lifecycle" aria-labelledby="screen08-lifecycle-title">
            <div className="screen08-lifecycle-heading">
              <p id="screen08-lifecycle-title">Two compute paths <span>→</span> one platform-scoped durable state</p>
              <span>What crosses · what is temporary · what persists</span>
            </div>

            <div className="screen08-paths">
              <article className="screen08-path screen08-path-managed">
                <header className="screen08-path-header">
                  <span>01</span>
                  <p>Managed Compute</p>
                </header>
                <h3>Image bytes are temporary.</h3>
                <p className="screen08-path-copy">Corvinth receives platform/object identity together with ephemeral fetch access, retrieves the image for the required compute, and does not durably retain the image bytes.</p>
                <div className="screen08-flow" aria-label="Managed Compute data flow">
                  <div className="screen08-flow-stage screen08-flow-crosses">
                    <span>Crosses into Corvinth</span>
                    <strong>Platform / object identity<br />+ ephemeral fetch access</strong>
                  </div>
                  <i aria-hidden="true">↓</i>
                  <div className="screen08-flow-stage screen08-flow-temporary">
                    <span>Temporary inside Corvinth</span>
                    <strong>Fetch image bytes for required compute</strong>
                    <small>Temporary fetch access is not durable product state. Image bytes do not become durable state.</small>
                  </div>
                  <i aria-hidden="true">↓</i>
                  <div className="screen08-flow-stage screen08-flow-output">
                    <span>Feeds durable detection state</span>
                    <strong>Derived detection representation</strong>
                  </div>
                </div>
              </article>

              <article className="screen08-path screen08-path-customer">
                <header className="screen08-path-header">
                  <span>02</span>
                  <p>Customer Compute</p>
                </header>
                <h3>Image processing stays with the customer.</h3>
                <p className="screen08-path-copy">The customer performs the image compute inside its own infrastructure. Corvinth receives the derived detection representation required for the operation, together with the platform and object context required for matching and correlation. Case/evidence context is associated where the workflow requires it.</p>
                <div className="screen08-flow" aria-label="Customer Compute data flow">
                  <div className="screen08-flow-stage screen08-flow-customer-side">
                    <span>Customer infrastructure</span>
                    <strong>Image bytes stay customer-side</strong>
                  </div>
                  <i aria-hidden="true">↓</i>
                  <div className="screen08-flow-stage screen08-flow-customer-compute">
                    <span>Customer Compute</span>
                    <strong>Derived detection representation<br />+ platform / object context</strong>
                  </div>
                  <i aria-hidden="true">↓</i>
                  <div className="screen08-flow-stage screen08-flow-output">
                    <span>Crosses into Corvinth</span>
                    <strong>Required detection data and context</strong>
                  </div>
                </div>
              </article>
            </div>

            <div className="screen08-convergence" aria-hidden="true"><span></span><i>↓</i><span></span></div>

            <article className="screen08-durable-state" aria-labelledby="screen08-durable-title">
              <div className="screen08-durable-label"><span>03</span> Platform-scoped durable Corvinth state</div>
              <h3 id="screen08-durable-title">Detection state, not an image repository.</h3>
              <p>Corvinth retains the data needed for detection, matching, and associated evidence context. It does not turn Managed Compute into durable customer-image storage.</p>
              <ul>
                <li>Detection references</li>
                <li>Matching representations retained where required</li>
                <li>Platform / object context</li>
                <li>Associated evidence context</li>
                <li>Operational / audit metadata</li>
              </ul>
            </article>
          </section>

          <section className="screen08-persistence" aria-label="What persists and what does not durably persist">
            <article>
              <p>Persists</p>
              <ul>
                <li>Detection references</li>
                <li>Matching representations retained where required</li>
                <li>Platform / object context</li>
                <li>Evidence / operational metadata</li>
              </ul>
            </article>
            <article>
              <p>Does not durably persist</p>
              <ul>
                <li>Managed-compute image bytes</li>
                <li>Ephemeral fetch access</li>
              </ul>
            </article>
          </section>

          <aside className="screen08-isolation" aria-label="Platform isolation boundary">
            <div>
              <p>Same platform scope</p>
              <h3>Durable detection state remains scoped to the platform it belongs to.</h3>
            </div>
            <p>Matching and evidence lookup remain within the same platform scope. References, evidence, and metadata from another tenant are neither searched nor exposed.</p>
          </aside>

          <div className="screen08-proof-strip" aria-label="Data-boundary trust statements">
            <span>Platform-isolated scope</span>
            <span>No durable managed-compute image bytes</span>
          </div>

          <div className="screen08-closing">
            <p>Corvinth may process image bytes depending on the compute mode. It does not become your image repository.</p>
            <span>What persists is the platform-scoped detection data and context required to operate Corvinth.</span>
          </div>
        </div>
      </section>

      <hr/>

      {/* ── TRUST & COMPLIANCE ────────────────────────────────────────────────── */}
      <section>
        <div className="inner">
          <p className="section-tag">trust and compliance</p>
          <h2 className="section-title">Built honestly on available technology.</h2>
          <p className="section-sub">Corvinth is built on open-source perceptual hashing and DINOv2 semantic vectors. The architecture supports optional Microsoft PhotoDNA integration — not currently active in production. When enabled, it operates on a platform opt-in basis with full disclosure in the DPA.</p>
          <div className="trust-grid">
            {[
              { icon:<svg className="icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title:'Zero image storage', body:'Images are never sent to or stored on Corvinth servers. The SDK runs on your infrastructure. Only the hash or vector crosses the network boundary.' },
              { icon:<svg className="icon" viewBox="0 0 24 24"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>, title:'Rotation tolerant', body:'All 8 orientations stored at index time. Rotated or flipped re-uploads are still caught by Shield. An optional second, normalized hash lane catches brightness/contrast evasion attempts that the standard lane alone would miss. Arbitrary rotations caught by Pulse.' },
              { icon:<svg className="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>, title:'PDQ + DINOv2', body:'Uses Meta PDQ for perceptual hashing and DINOv2 for semantic vectors. Both run locally via the SDK — no pixels sent to Corvinth.' },
              { icon:<svg className="icon" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, title:'Your policy, our detection', body:'We return a signal. You enforce your policy. Corvinth is the detection layer — not the decision maker.' },
              { icon:<svg className="icon" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>, title:'FTC-ready audit log', body:'Every decision receives a cryptographically chained audit log. Exportable for FTC or legal review at any time.' },
              { icon:<svg className="icon" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, title:'Compliance-ready architecture', body:'Catches violations at upload — before any removal request is filed. Evidence is already logged before any regulator asks for it.' },
              { icon:<svg className="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>, title:'Near-miss pattern detection', body:'NEAR_MISS content is allowed through, but every occurrence is logged and analyzed for coordinated evasion patterns — repeated near-variant re-uploads from the same actor get flagged for threat intelligence review, even when no single upload crosses the block threshold.' },
              { icon:<svg className="icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>, title:'Signed webhooks', body:'Every webhook we send is signed with HMAC-SHA256 over the raw request body. Verify the X-Corvinth-Signature header against your webhook secret before trusting a payload.' },
            ].map((card, i) => (
              <div key={i} className="trust-card">
                <div className="ticon">{card.icon}</div>
                <h4>{card.title}</h4>
                <p>{card.body}</p>
              </div>
            ))}
          </div>
          <div className="pills">
            {['Meta PDQ','DINOv2','Qdrant cosine','Open-source hashing','Near-duplicate detection','Compliance logs','Review queue','Case management'].map(p => (
              <span key={p} className="pill">{p}</span>
            ))}
          </div>
          <div className="disclaimer-box">
            <p>Corvinth's hashing format is compatible with the StopNCII PDQ standard. Corvinth is not currently partnered with or integrated into StopNCII's feed, and does not represent or speak for StopNCII, Meta, or any listed organization. Corvinth is an independent trust and safety infrastructure company.</p>
          </div>
        </div>
      </section>

      <hr/>

      {/* ── SCREEN 05 — WHY NOW ─────────────────────────────────────────────── */}
      <section id="tida" className="screen05" aria-labelledby="screen05-title">
        <div className="screen05-inner">
          <header className="screen05-intro">
            <p className="screen05-eyebrow">Why now</p>
            <h2 id="screen05-title">When the removal clock starts, manual search becomes an infrastructure problem.</h2>
          </header>

          <div className="screen05-opening" aria-label="Report to removal operating path">
            <p className="screen05-kicker">The operating reality</p>
            <ol className="screen05-request-flow">
              {['report', 'support / admin', 'engineer', 'manual search', 'removal'].map((step) => <li key={step}>{step}</li>)}
            </ol>
            <p>Engineering doesn&apos;t start the clock. For a covered platform, the 48-hour period begins when it receives a valid removal request through its TIDA notice-and-removal process.</p>
          </div>

          <div className="screen05-pressure" aria-label="Regulatory pressure">
            <article>
              <p className="screen05-pressure-label">48 hours</p>
              <p>Covered platforms must remove qualifying reported content and make reasonable efforts to identify and remove known identical copies within 48 hours after receiving a valid removal request through their TIDA notice-and-removal process.</p>
            </article>
            <article>
              <p className="screen05-pressure-label">Reasonable efforts</p>
              <p>Platforms must make reasonable efforts to identify and remove known identical copies.</p>
            </article>
            <p className="screen05-pressure-line">Big platforms can staff this problem. Small platforms still have to solve it.</p>
          </div>

          <div className="screen05-infrastructure" aria-label="Where Corvinth fits in the platform workflow">
            <div className="screen05-infrastructure-intro">
              <p className="screen05-kicker">The boundary</p>
              <h3>TIDA creates urgency. It does not define Corvinth&apos;s data model.</h3>
              <p>Image safety infrastructure for matching platform-selected visual references.</p>
            </div>
            <div className="screen05-layers">
              <article className="screen05-layer">
                <p>Legal pressure</p>
                <div><span>valid qualifying request</span><i aria-hidden="true">→</i><span>time-bound platform obligation</span></div>
              </article>
              <article className="screen05-layer">
                <p>Engineering consequence</p>
                <div><span>reported content</span><i aria-hidden="true">→</i><span>find the reported item</span><i aria-hidden="true">→</i><span>identify known identical copies</span><i aria-hidden="true">→</i><span>platform evaluates and acts</span></div>
              </article>
              <article className="screen05-layer screen05-layer-corvinth">
                <p>Corvinth underneath</p>
                <div><span>platform-selected visual reference</span><i aria-hidden="true">→</i><span>platform-scoped matching</span><i aria-hidden="true">→</i><span>detection context returned to the platform</span></div>
              </article>
            </div>
            <p className="screen05-underneath">The obligation exists above Corvinth. The discovery infrastructure sits underneath it.</p>
          </div>

          <div className="screen05-ownership" aria-label="Platform and Corvinth ownership split">
            <article>
              <p className="screen05-kicker">The platform owns</p>
              <ul><li>notice / request workflow</li><li>legal validity</li><li>policy decision</li><li>removal / enforcement</li></ul>
            </article>
            <article>
              <p className="screen05-kicker">Corvinth provides</p>
              <ul><li>platform-scoped detection</li><li>matching infrastructure</li><li>detection context returned to the platform</li></ul>
            </article>
          </div>
          <p className="screen05-boundary-copy">Corvinth does not determine whether a legal request is valid, whether content is unlawful, or what enforcement action the platform must take.</p>

          <div className="screen05-compare" aria-label="Classifier versus reference-based matching">
            <header><p className="screen05-kicker">A different question</p><h3>The product boundary is reference-based detection, not content-category classification.</h3></header>
            <div className="screen05-compare-grid">
              <article>
                <p className="screen05-compare-label">Classifier</p>
                <h4>“What is this image?”</h4>
                <p className="screen05-compare-flow">Image <span>→</span> classification <span>→</span> content category</p>
              </article>
              <article className="screen05-compare-corvinth">
                <p className="screen05-compare-label">Corvinth</p>
                <h4>“Where does this platform-selected visual reference appear?”</h4>
                <p className="screen05-compare-flow">Platform-selected visual reference <span>→</span> platform-scoped matching <span>→</span> match + evidence</p>
              </article>
            </div>
            <p className="screen05-compare-note">Reported content can become a visual reference when the platform selects it for tracking. Corvinth matches platform-selected visual references using fingerprints and visual signatures — it does not require a content-category label to detect a match.</p>
          </div>

          <p className="screen05-closing">The platform already has the report. Corvinth gives it the infrastructure to find matching platform content.</p>
        </div>
      </section>

      <hr/>

      {/* ── LIABILITY CALCULATOR — now comes after product understanding ──────── */}
      <section id="calculator" style={{ background:'#060605', padding:'6rem 2.5rem' }}>
        <div className="inner-sm" style={{ textAlign:'center' }}>
          <p className="section-tag">exposure calculator</p>
          <h2 className="section-title">What&apos;s your platform&apos;s risk?</h2>
          <p style={{ fontSize:'15px', color:'#8C8B84', marginBottom:'2.5rem', fontWeight:300, lineHeight:1.75 }}>
            $53,088 is the FTC&apos;s current civil penalty per TIDA violation — that figure is real and confirmed.
            There is no published benchmark for how many violations a platform like yours might actually have,
            so estimate a number you believe is realistic and see what it adds up to.
          </p>
          <div className="calc-box">
            <div className="calc-top">
              <div className="calc-label">Estimated unresolved violations</div>
              <div className="calc-value">{violationsEstimate}</div>
            </div>
            <input type="range" min="1" max="100" step="1" value={violationsEstimate}
              onChange={e => setViolationsEstimate(Number(e.target.value))} className="calc-slider" />
            <div className="calc-ticks"><span>1</span><span>25</span><span>50</span><span>100</span></div>
            <div className="calc-result">
              <div className="calc-result-label">Estimated exposure</div>
              <div className="calc-result-num">{formatExposure(estimatedExposure)}</div>
              <div className="calc-result-sub">
                {violationsEstimate.toLocaleString()} violation{violationsEstimate === 1 ? '' : 's'} × $53,088 each — the FTC&apos;s current TIDA civil penalty
              </div>
            </div>
            <p style={{ fontSize:'11px', color:'#4A4A45', fontFamily:"'JetBrains Mono',monospace", textAlign:'center', marginBottom:'1.25rem', letterSpacing:'0.02em' }}>
              Hypothetical planning tool — the violation count is a number you choose, not a sourced
              statistic. The $53,088 figure alone is the real, FTC-confirmed number here.
            </p>
            <div className="calc-cta-row">
              <span className="calc-corvinth-cost">Corvinth costs from <b>$99/mo</b> to cover this.</span>
              <a className="btn-primary" href="#contact">get protected →</a>
            </div>
          </div>
        </div>
      </section>

      <hr/>

      {/* ── PRICING ───────────────────────────────────────────────────────────── */}
      <section id="pricing">
        <div className="inner" style={{ maxWidth:'900px' }}>
          <p className="section-tag">pricing</p>
          <h2 className="section-title">Transparent, usage-based pricing.</h2>
          <p className="section-sub">Starter is Shield-only. Growth unlocks Pulse — semantic detection and the complaint registry.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'1rem' }}>
            {/* Founding tier */}
            <div style={{ background:'rgba(255,178,36,0.04)', border:'0.5px solid rgba(255,178,36,0.35)', borderRadius:'16px', padding:'1.75rem', display:'flex', flexDirection:'column', position:'relative', boxShadow:'0 0 40px rgba(255,178,36,0.06)' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg, transparent, #FFB224, transparent)', borderRadius:'16px 16px 0 0' }}/>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'11px', fontWeight:500, color:'#FFB224', textTransform:'uppercase', letterSpacing:'0.10em', fontFamily:"'JetBrains Mono',monospace", marginBottom:'0.75rem' }}>
                Founding Access
                <span style={{ color:'#FFB224', fontSize:'9px', padding:'2px 8px', background:'rgba(255,178,36,0.10)', border:'0.5px solid rgba(255,178,36,0.30)', borderRadius:'999px' }}>3 platforms only</span>
              </div>
              <div style={{ fontSize:'36px', fontWeight:800, color:'#F0EFE8', letterSpacing:'-1.5px', marginBottom:'0.15rem', lineHeight:1 }}>$99<span style={{ fontSize:'14px', fontWeight:400, color:'#8C8B84' }}>/month</span></div>
              <div style={{ fontSize:'11px', color:'#FFB224', fontFamily:"'JetBrains Mono',monospace", marginBottom:'0.5rem' }}>full Shield + Pulse access · 3 platforms only</div>
              <div style={{ marginBottom:'1rem' }}><span style={{ fontSize:'10px', fontFamily:"'JetBrains Mono',monospace", padding:'2px 8px', borderRadius:'4px', background:'rgba(77,158,255,0.10)', color:'#4D9EFF', border:'0.5px solid rgba(77,158,255,0.25)' }}>✓ Pulse included</span></div>
              <div style={{ fontSize:'13px', color:'#8C8B84', marginBottom:'1.5rem', lineHeight:1.6 }}>Full Shield + Pulse access. For our first three platforms.</div>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'8px', marginBottom:'1.75rem', flex:1 }}>
                {['Full Shield API — hash matching','Full Pulse API — semantic detection','Complaint registry','Library backfill — scan existing uploads (Mode B)','Audit log export','Direct line to founder','Weekly feedback calls'].map(f => (
                  <li key={f} style={{ fontSize:'13px', color:'#8C8B84', display:'flex', alignItems:'center', gap:'10px' }}>
                    <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#FFB224', flexShrink:0, display:'inline-block', boxShadow:'0 0 4px rgba(255,178,36,0.5)' }}/>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#contact" style={{ display:'block', textAlign:'center', padding:'11px', borderRadius:'10px', fontSize:'14px', fontWeight:500, background:'rgba(255,178,36,0.12)', color:'#FFB224', border:'0.5px solid rgba(255,178,36,0.35)', textDecoration:'none' }}>apply for founding access</a>
            </div>

            {/* Starter / Growth / Enterprise */}
            {[
              { name:'Starter', price:'$299', period:'/month', perScan:'~$0.0003/scan · 1M scans included', desc:'For platforms under 1M monthly uploads that need Shield compliance without operational overhead.', features:['Shield API — hash matching','Up to 1M scans/month','Audit log export','Webhook notifications','FTC compliance reports'], pulseIncluded:false, featured:false, cta:'request access' },
              { name:'Growth',  price:'$799', period:'/month', perScan:'~$0.0002/scan · 5M scans included', desc:'For high-growth platforms that need Pulse for victim complaints, semantic detection, and video.',  features:['Everything in Starter','Full Pulse API — semantic detection','Complaint registry','Library backfill — scan existing uploads (Mode B)','Video lane — MD5+SHA-256 exact match, StopNCII-compatible, computed locally','5M scans/month'], pulseIncluded:true, featured:true, cta:'request access' },
              { name:'Enterprise', price:'Custom', period:'', perScan:'Unlimited scans · dedicated infra', desc:'For high-volume platforms and custom needs.', features:['Unlimited scans','Pulse + Shield','Library backfill — Mode A available (metered)','Dedicated infrastructure','On-premise option','SLA available with dedicated infra','Legal & compliance support'], pulseIncluded:true, featured:false, cta:'contact us' },
            ].map(plan => (
              <div key={plan.name} style={{ background: plan.featured ? 'rgba(0,229,155,0.05)' : '#0e0e0c', border:`0.5px solid ${plan.featured ? 'rgba(0,229,155,0.35)' : 'rgba(255,255,255,0.07)'}`, borderRadius:'16px', padding:'1.75rem', display:'flex', flexDirection:'column', position:'relative', boxShadow: plan.featured ? '0 0 40px rgba(0,229,155,0.08)' : 'none' }}>
                {plan.featured && <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg, transparent, #00E59B, transparent)', borderRadius:'16px 16px 0 0' }}/>}
                <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'11px', fontWeight:500, color:'#4A4A45', textTransform:'uppercase', letterSpacing:'0.10em', fontFamily:"'JetBrains Mono',monospace", marginBottom:'0.75rem' }}>
                  {plan.name}
                  {plan.featured && <span style={{ color:'#00E59B', fontSize:'9px', padding:'2px 8px', background:'rgba(0,229,155,0.12)', border:'0.5px solid rgba(0,229,155,0.25)', borderRadius:'999px' }}>popular</span>}
                </div>
                <div style={{ fontSize:'36px', fontWeight:800, color:'#F0EFE8', letterSpacing:'-1.5px', marginBottom:'0.15rem', lineHeight:1 }}>{plan.price}<span style={{ fontSize:'14px', fontWeight:400, color:'#8C8B84' }}>{plan.period}</span></div>
                <div style={{ fontSize:'11px', color:'#4A4A45', fontFamily:"'JetBrains Mono',monospace", marginBottom:'0.5rem' }}>{plan.perScan}</div>
                <div style={{ marginBottom:'1rem' }}><span style={{ fontSize:'10px', fontFamily:"'JetBrains Mono',monospace", padding:'2px 8px', borderRadius:'4px', background: plan.pulseIncluded ? 'rgba(77,158,255,0.10)' : 'rgba(255,255,255,0.03)', color: plan.pulseIncluded ? '#4D9EFF' : '#4A4A45', border:`0.5px solid ${plan.pulseIncluded ? 'rgba(77,158,255,0.25)' : 'rgba(255,255,255,0.06)'}` }}>{plan.pulseIncluded ? '✓ Pulse included' : '✗ Pulse not included'}</span></div>
                <div style={{ fontSize:'13px', color:'#8C8B84', marginBottom:'1.5rem', lineHeight:1.6 }}>{plan.desc}</div>
                <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'8px', marginBottom:'1.75rem', flex:1 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ fontSize:'13px', color:'#8C8B84', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#00E59B', flexShrink:0, display:'inline-block', boxShadow:'0 0 4px rgba(0,229,155,0.5)' }}/>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#contact" style={{ display:'block', textAlign:'center', padding:'11px', borderRadius:'10px', fontSize:'14px', fontWeight:500, background: plan.featured ? '#00E59B' : 'transparent', color: plan.featured ? '#060605' : '#8C8B84', border: plan.featured ? 'none' : '0.5px solid rgba(255,255,255,0.10)', textDecoration:'none', transition:'all 0.15s' }}>{plan.cta}</a>
              </div>
            ))}
          </div>

          <p style={{ textAlign:'center', marginTop:'1.5rem', fontSize:'12px', color:'#4A4A45', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.03em', lineHeight:1.7 }}>
            Founding tier — 3 platforms only, full Shield + Pulse access from $99/mo. Once the founding tier closes, standard pricing applies from $299/mo.{' '}
            <a href="mailto:founder@corvinth.com" style={{ color:'#FFB224', textDecoration:'underline' }}>Email founder@corvinth.com</a> to apply before it fills.
          </p>

          {/* Pricing FAQ */}
          <div style={{ marginTop:'3rem' }}>
            <div style={{ fontSize:'10px', fontWeight:500, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'0.12em', fontFamily:'var(--font-mono)', marginBottom:'1rem' }}>billing questions</div>
            <div className="faq-list">
              {[
                { q:'Does a re-upload of the same image count as a new scan?', a:"Yes. Every call to /hash/check counts as one scan, regardless of whether the hash has been seen before. This keeps billing predictable and reflects the actual compute cost of the lookup." },
                { q:'What counts as a failed upload — does it consume a scan?', a:"No. If your platform rejects an upload before calling Corvinth (e.g. wrong file type, too large), that does not consume a scan. A scan is counted only when a hash is sent to /hash/check. If the Corvinth API returns an error on our side, that call is not counted." },
                { q:'What happens if I go over my monthly scan limit?', a:"We don't hard-cap your platform at the limit — scanning keeps working. If you're consistently running above your plan's included volume, we'll reach out to talk about moving you to the right plan rather than surprise-billing you for overage." },
                { q:'Is there a free trial or sandbox?', a:"You can try real matching right now with the live demo above — no API key, no signup. We don't yet auto-provision a separate sandbox environment per account at registration; if you want test credentials before going live, just ask when you sign up." },
              ].map((item, i) => <FaqItem key={i} q={item.q} a={item.a}/>)}
            </div>
          </div>
        </div>
      </section>

      <hr/>

      {/* ── FAQ ───────────────────────────────────────────────────────────────── */}
      <section id="faq" className="bg-section">
        <div className="inner" style={{ maxWidth:'700px' }}>
          <p className="section-tag">faq</p>
          <h2 className="section-title">Questions platforms actually ask.</h2>
          <div className="faq-list">
            {[
              { q:"What happens if there's a false positive and a legitimate image gets blocked?", a:"It depends on your platform's settings. An EXACT match is always removed immediately. A FUZZY match (a close-but-not-perfect hash match) is handled one of three ways: if you've opted into strict mode, it's treated as EXACT and removed; if you're on a plan with our AI tiebreaker and supply a presigned URL, it's held for automatic AI review; otherwise — the default for most platforms — it's shadow-quarantined and the uploader gets an automatic challenge link to dispute it. Every decision gets a case UUID and a permanent, chain-verified audit log entry, and you can file a counter-notice via the /appeals endpoint at any time." },
              { q:"Are you actually integrated with StopNCII's database, or just PDQ-compatible?", a:"Just PDQ-compatible, and we'll say that plainly: Corvinth is not currently partnered with or integrated into StopNCII's feed. Our hashing format uses the same open-source Meta PDQ standard, so the architecture is ready to ingest a feed like theirs, but today Corvinth's database is built from direct victim complaints (Pulse) and hashes reported by our own platform customers. We are an independent company and do not represent StopNCII." },
              { q:'Does Corvinth ever see or store the actual images?', a:"No. The Corvinth SDK runs entirely on your infrastructure and computes the hash and vector locally. Only the PDQ hash (256 bits) or DINOv2 vector (384 floats) crosses the network boundary — not image bytes. It is architecturally impossible for Corvinth to reconstruct the original image from these values." },
              { q:'How small is "too small" to need this?', a:"TIDA has no size exemption. If your platform receives user-uploaded images, you are in scope. The $53,088 fine is per violation, so even a platform with modest traffic can face significant exposure from a handful of un-removed cases. Corvinth's Starter plan at $299/month is specifically designed for smaller platforms that can't staff a trust-and-safety team." },
              { q:"What's the integration effort for an engineering team?", a:"One API endpoint and no SDK strictly required — though we provide one. A backend engineer can have /hash/check called on every upload in an afternoon. Node.js/TypeScript and Python SDKs are in active development. Most platforms are live within a working day." },
              { q:"What is Pulse and when do I need it?", a:"Pulse is the semantic detection pipeline. It uses DINOv2 vectors and cosine similarity to catch images that PDQ hashing misses: heavy crops, arbitrary rotations, and direct victim complaints where no hash exists yet. Pulse is included in the Growth plan and above." },
            ].map((item, i) => <FaqItem key={i} q={item.q} a={item.a}/>)}
          </div>
        </div>
      </section>

      <hr/>

      {/* ── FOR VICTIMS ───────────────────────────────────────────────────────── */}
      <section className="victims-section">
        <div className="victims-inner" style={{ padding:'5rem 2rem' }}>
          <div style={{ marginBottom:'1.5rem' }}>
            <span style={{ display:'inline-block', fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#00E59B', textTransform:'uppercase', letterSpacing:'0.14em', padding:'3px 10px', background:'rgba(0,229,155,0.06)', border:'0.5px solid rgba(0,229,155,0.18)', borderRadius:'999px' }}>for victims</span>
          </div>
          <h2>If your images are being shared without your consent</h2>
          <p>Platforms using Corvinth can receive your complaint directly.</p>
          <p>Your images are <em>never stored</em> — only a mathematical fingerprint, computed on your own device, is used for detection.</p>
        </div>
      </section>

      <hr/>

      {/* ── REGULATORY UPDATES ───────────────────────────────────────────────── */}
      <section className="blog-teaser-section">
        <div className="inner" style={{ maxWidth:'640px', textAlign:'center' }}>
          <p className="section-tag">regulatory updates</p>
          <h2 className="section-title">TIDA just passed. There will be more.</h2>
          <p className="section-sub" style={{ margin:'0 auto 2rem' }}>
            We publish plain-English regulatory updates for platform engineers — not lawyers. NCII law is moving fast. Stay ahead of it.
          </p>
          <a href="mailto:founder@corvinth.com?subject=Subscribe me to regulatory updates"
            style={{ fontSize:'14px', textDecoration:'underline', color:'#4A4A45', transition:'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color='#8C8B84'}
            onMouseLeave={e => e.currentTarget.style.color='#4A4A45'}>
            Email us to subscribe →
          </a>
        </div>
      </section>

      <hr/>

      {/* ── FOUNDER ───────────────────────────────────────────────────────────── */}
      <section id="founder">
        <div className="inner" style={{ maxWidth:'700px' }}>
          <p className="section-tag">a note from the team</p>
          <h2 className="section-title">There&apos;s a human accountable for this.</h2>
          <div className="founder-card">
            <div className="founder-avatar">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width:'52px', height:'52px' }}>
                <circle cx="24" cy="24" r="24" fill="rgba(0,229,155,0.10)"/>
                <circle cx="24" cy="19" r="7" stroke="#00E59B" strokeWidth="1.5" fill="none"/>
                <path d="M10 40c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#00E59B" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
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
              <a href="mailto:founder@corvinth.com" className="founder-email">founder@corvinth.com</a>
            </div>
          </div>
        </div>
      </section>

      <hr/>

      {/* ── CONTACT / WAITLIST FORM ───────────────────────────────────────────── */}
      <section id="contact" className="contact-section">
        <div className="inner-sm">
          <div style={{ background:'#0e0e0c', border:'0.5px solid rgba(255,255,255,0.08)', borderRadius:'20px', padding:'3rem 2.5rem', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg, transparent, rgba(0,229,155,0.5), transparent)' }}/>
            <p style={{ textAlign:'center', fontSize:'10px', fontWeight:500, color:'#00E59B', textTransform:'uppercase', letterSpacing:'0.14em', fontFamily:"'JetBrains Mono',monospace", marginBottom:'1rem' }}>get started</p>
            <h2 style={{ textAlign:'center', fontSize:'clamp(26px,3vw,36px)', fontWeight:800, color:'#F0EFE8', letterSpacing:'-1px', marginBottom:'0.75rem', lineHeight:1.1 }}>Ready to integrate?</h2>
            <p style={{ textAlign:'center', fontSize:'15px', color:'#8C8B84', marginBottom:'2rem', lineHeight:1.75, fontWeight:300 }}>
              Tell us about your platform and we&apos;ll get you API credentials within 24 hours.
            </p>

            {formStatus === 'success' ? (
              <div style={{ textAlign:'center', padding:'2rem 0' }}>
                <div style={{ fontSize:'28px', marginBottom:'1rem' }}>✓</div>
                <p style={{ fontSize:'17px', fontWeight:600, color:'#F0EFE8', marginBottom:'0.5rem' }}>You&apos;re on the list.</p>
                <p style={{ fontSize:'14px', color:'#8C8B84', lineHeight:1.75 }}>
                  Expect credentials within 24 hours — check your inbox at{' '}
                  <span style={{ color:'#00E59B', fontFamily:"'JetBrains Mono',monospace" }}>{form.work_email}</span>.
                </p>
              </div>
            ) : (
              <>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Contact name <span>*</span></label>
                    <input name="contact_name" placeholder="Jane Smith" value={form.contact_name} onChange={handleFormChange} className="form-input" disabled={formStatus === 'submitting'}/>
                  </div>
                  <div className="form-field">
                    <label>Work email <span>*</span></label>
                    <input name="work_email" type="email" placeholder="jane@company.com" value={form.work_email} onChange={handleFormChange} className="form-input" disabled={formStatus === 'submitting'}/>
                  </div>
                  <div className="form-field">
                    <label>Company / Platform <span>*</span></label>
                    <input name="company_name" placeholder="Acme Dating Inc." value={form.company_name} onChange={handleFormChange} className="form-input" disabled={formStatus === 'submitting'}/>
                  </div>
                  <div className="form-field">
                    <label>Platform URL <span>*</span></label>
                    <input name="platform_url" placeholder="https://yourapp.com" value={form.platform_url} onChange={handleFormChange} className="form-input" disabled={formStatus === 'submitting'}/>
                  </div>
                  <div className="form-field">
                    <label>Platform type <span>*</span></label>
                    <select name="platform_type" value={form.platform_type} onChange={handleFormChange} className="form-input" style={{ cursor:'pointer', color: form.platform_type ? '#F0EFE8' : '#4A4A45' }} disabled={formStatus === 'submitting'}>
                      <option value="">Select type…</option>
                      <option value="social">Social platform</option>
                      <option value="dating">Dating app</option>
                      <option value="messaging">Messaging app</option>
                      <option value="creator">Creator platform</option>
                      <option value="marketplace">Marketplace</option>
                      <option value="gaming">Gaming</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Monthly uploads <span>*</span></label>
                    <select name="monthly_upload_volume" value={form.monthly_upload_volume} onChange={handleFormChange} className="form-input" style={{ cursor:'pointer', color: form.monthly_upload_volume ? '#F0EFE8' : '#4A4A45' }} disabled={formStatus === 'submitting'}>
                      <option value="">Select volume…</option>
                      <option value="under_10k">Under 10,000 / month</option>
                      <option value="10k_100k">10,000 – 100,000 / month</option>
                      <option value="100k_1m">100,000 – 1M / month</option>
                      <option value="over_1m">Over 1M / month</option>
                    </select>
                  </div>
                  <div className="form-field full">
                    <label>Do you need Pulse?</label>
                    <select name="pipeline_choice" value={form.pipeline_choice} onChange={handleFormChange} className="form-input" style={{ cursor:'pointer', color: form.pipeline_choice ? '#F0EFE8' : '#4A4A45' }} disabled={formStatus === 'submitting'}>
                      <option value="">Select…</option>
                      <option value="shield_only">Shield only — hash matching</option>
                      <option value="shield_and_pulse">Pulse + Shield — semantic detection + complaint registry</option>
                      <option value="unsure">Help me decide</option>
                    </select>
                    {form.pipeline_choice === 'unsure' && (
                      <div style={{
                        padding:'1rem 1.25rem',
                        background:'rgba(77,158,255,0.05)',
                        border:'0.5px solid rgba(77,158,255,0.20)',
                        borderRadius:'10px',
                        fontSize:'13px',
                        color:'#8C8B84',
                        lineHeight:1.75,
                        marginTop:'0.5rem'
                      }}>
                        <div style={{ color:'#4D9EFF', fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'0.10em', textTransform:'uppercase', marginBottom:'0.75rem' }}>quick breakdown</div>
                        <p style={{ marginBottom:'0.75rem' }}>
                          <strong style={{ color:'#F0EFE8' }}>Shield only</strong> — PDQ hash matching against known NCII. Catches exact and near-identical uploads at ingest. Best for platforms starting with TIDA compliance under 1M uploads/month.
                        </p>
                        <p style={{ marginBottom:'0.75rem' }}>
                          <strong style={{ color:'#F0EFE8' }}>Pulse + Shield</strong> — adds DINOv2 semantic detection. Catches cropped, rotated, or brightness-edited variants that PDQ misses. Also enables a victim complaint registry. Best for dating apps, creator platforms, and high-volume social.
                        </p>
                        <p style={{ fontSize:'11px', color:'#4A4A45', fontFamily:"'JetBrains Mono',monospace" }}>
                          Not sure? Submit anyway — we'll recommend the right plan based on your volume and platform type.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="form-field full">
                    <label>How did you hear about us?</label>
                    <input name="referral_source" placeholder="Twitter, a colleague, YC forum…" value={form.referral_source} onChange={handleFormChange} className="form-input" disabled={formStatus === 'submitting'}/>
                  </div>
                  <div className="form-field full">
                    <label>Use case / message</label>
                    <textarea name="use_case" rows={3} placeholder="Tell us briefly what you're building and how Corvinth fits in…" value={form.use_case} onChange={handleFormChange} className="form-input" style={{ resize:'vertical', lineHeight:1.65 }} disabled={formStatus === 'submitting'}/>
                  </div>
                </div>
                {formError && (
                  <p style={{ fontSize:'13px', color:'#FF4D4D', marginTop:'1rem', fontFamily:"'JetBrains Mono',monospace", lineHeight:1.6 }}>
                    Something went wrong — email us directly at{' '}
                    <a href="mailto:founder@corvinth.com" style={{ color:'#FF4D4D', textDecoration:'underline' }}>founder@corvinth.com</a>
                  </p>
                )}
                <button onClick={handleFormSubmit} disabled={formStatus === 'submitting'} className="form-submit" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', opacity: formStatus === 'submitting' ? 0.7 : 1 }}>
                  {formStatus === 'submitting' ? (
                    <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation:'spin 0.8s linear infinite', flexShrink:0 }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Sending…</>
                  ) : 'request API access →'}
                </button>
                <p style={{ textAlign:'center', marginTop:'1rem', fontSize:'11px', color:'#4A4A45', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.04em' }}>
                  Early access from <b style={{ color:'#8C8B84', fontWeight:500 }}>$99/mo</b> · Standard plans from <b style={{ color:'#8C8B84', fontWeight:500 }}>$299/mo</b>
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <hr/>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer>
        <p>CORVINTH · Trust &amp; safety infrastructure · API v0.2.0 · 2026</p>
        <div className="footer-links">
          <a href="#how">how it works</a>
          <a href="#shield">shield</a>
          <a href="#integration">integration</a>
          <a href="https://corvinth-api.onrender.com/docs" target="_blank" rel="noopener noreferrer">docs</a>
          <a href="mailto:founder@corvinth.com">founder@corvinth.com</a>
        </div>
      </footer>
      </div>
    </>
  );
}
