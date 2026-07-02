// app/page.js
'use client';

import { useState } from 'react';

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
  const [howTab,  setHowTab]  = useState('shield');

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
      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <nav>
        <a className="logo" href="#">cor<span className="accent">vinth</span></a>
        <div className="nav-right">
          <a className="btn-ghost" href="#how">how it works</a>
          <a className="btn-ghost" href="#shield">shield</a>
          <a className="btn-ghost" href="#pulse">pulse</a>
          <a className="btn-ghost" href="#pricing">pricing</a>
          <a className="btn-ghost" href="https://corvinth-api.onrender.com/docs" target="_blank" rel="noopener noreferrer">docs</a>
          <a className="btn-primary" href="#contact">request access</a>
          <button className={`hamburger${mobileMenuOpen ? ' open' : ''}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            <span/><span/><span/>
          </button>
        </div>
      </nav>

      {/* ── MOBILE MENU ──────────────────────────────────────────────────────── */}
      <div className={`mobile-menu${mobileMenuOpen ? ' open' : ''}`}>
        <a href="#how"     onClick={() => setMobileMenuOpen(false)}>How it works</a>
        <a href="#shield"  onClick={() => setMobileMenuOpen(false)}>Shield</a>
        <a href="#pulse"   onClick={() => setMobileMenuOpen(false)}>Pulse</a>
        <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
        <a href="https://corvinth-api.onrender.com/docs" target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}>Docs</a>
        <a href="#contact" className="mobile-cta" onClick={() => setMobileMenuOpen(false)}>Request access →</a>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="hero" style={{ paddingTop: '8rem' }}>
        <div className="badge">
          <svg className="icon" style={{ width:'10px', height:'10px', fill:'currentColor', stroke:'none' }} viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Deploy in an afternoon · Privacy-first architecture · Powered by PDQ + DINOv2
        </div>
        <h1>
          Protect your platform<br />
          from known NCII —<br />
          <em>before it spreads.</em>
        </h1>
        <p>
          Privacy-first image and video safety infrastructure for platforms with user-generated content.
          Deploy in an afternoon. No images ever leave your servers.
        </p>

        {/* Hero code snippet */}
        <div className="hero-snippet">
          <div className="snippet-header">
            <span className="snippet-dot"/><span className="snippet-dot"/><span className="snippet-dot"/>
            <span className="snippet-lang">node.js · integrate in minutes</span>
          </div>
          <pre className="snippet-body">{`# install
npm install @corvinth/sdk          # v0.2.0
# pip install corvinth             # v0.2.0 · Python`}</pre>
          <pre className="snippet-body">{`import { CorvinthClient } from '@corvinth/sdk';
const client = new CorvinthClient({ apiKey: process.env.CORVINTH_API_KEY });

const result = await client.checkHash({
  pdq_hash,             // 64-char hex, computed locally by SDK
  pdq_dihedral_hashes,  // all 8 orientations — no pixels sent
});

if (result.action === 'content_removed') {
  return res.status(403).json({ blocked: true });
}
// → { case_uuid, classification, action,
//     confidence_score, matched_lane,
//     hamming_distance, matched_case_id, review_queue,
//     pipeline_1_result, pipeline_2_queued, timestamp }`}</pre>
        </div>

        <div className="hero-cta">
          <a className="btn-primary lg" href="#contact">request early access</a>
          <a className="btn-ghost lg"   href="#how">see how it works</a>
        </div>
      </div>

      {/* ── BUILT FOR — self-identification ──────────────────────────────────── */}
      <section style={{ padding:'0 2.5rem 5rem', background:'var(--bg)' }}>
        <div className="inner" style={{ textAlign:'center' }}>
          <p style={{ fontSize:'10px', color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'0.14em', fontFamily:'var(--font-mono)', marginBottom:'2rem' }}>Built for</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', justifyContent:'center' }}>
            {['Social Platforms','Dating Apps','Messaging Apps','Creator Platforms','AI Communities','Adult Content Platforms'].map(type => (
              <div key={type} style={{ padding:'10px 20px', borderRadius:'999px', border:'0.5px solid var(--border-mid)', background:'var(--bg-card)', fontSize:'13px', color:'var(--text-muted)', fontFamily:'var(--font-mono)', letterSpacing:'0.02em' }}>
                {type}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CORVINTH — outcomes not features ─────────────────────────────── */}
      <section style={{ padding:'6rem 2.5rem' }}>
        <div className="inner">
          <p className="section-tag">why corvinth</p>
          <h2 className="section-title">Save six months of engineering.</h2>
          <p className="section-sub">
            Building NCII detection from scratch means VP-Trees, perceptual hashing, semantic embeddings, audit logging, and a compliance workflow. That&apos;s a full sprint. Corvinth is the version that ships this afternoon.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px,1fr))', gap:'1px', background:'var(--border)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-xl)', overflow:'hidden', marginTop:'2.5rem' }}>
            {[
              {
                outcome: 'Deploy this afternoon.',
                detail:  'One API endpoint in your upload pipeline. The SDK computes hashes on your server. No infrastructure changes required.',
                icon: <svg className="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
              },
              {
                outcome: 'Catch edits, crops, rotations.',
                detail:  'Pulse uses DINOv2 semantic vectors to match heavily edited variants that simple hash matching misses entirely.',
                icon: <svg className="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
              },
              {
                outcome: 'FTC audit log, out of the box.',
                detail:  'Every decision receives a cryptographically chained audit entry. Exportable for FTC review at any time.',
                icon: <svg className="icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
              },
              {
                outcome: 'Your policy. Our signal.',
                detail:  'Corvinth returns allow / review / block / clean. You decide what happens next. We are the detection layer, not the decision maker.',
                icon: <svg className="icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
              },
            ].map((card, i) => (
              <div key={i} className="usecase">
                <div className="usecase-icon">{card.icon}</div>
                <h4>{card.outcome}</h4>
                <p>{card.detail}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop:'2rem', fontSize:'13px', color:'var(--text-faint)', maxWidth:'560px' }}>
            NCII is where Corvinth starts. The same hashing, matching, and audit infrastructure underneath Shield and Pulse is built to extend to other categories of harmful or unauthorized content over time.
          </p>
        </div>
      </section>

      <hr/>

      {/* ── TRUSTED ARCHITECTURE — zero-knowledge flow ───────────────────────── */}
      <section style={{ padding:'5rem 2.5rem', background:'var(--bg-card)' }}>
        <div className="inner" style={{ maxWidth:'760px', textAlign:'center' }}>
          <p className="section-tag">trusted architecture</p>
          <h2 className="section-title">No images ever leave your infrastructure under Pipeline 1.</h2>
          <p className="section-sub" style={{ margin:'0 auto 3rem' }}>
            The SDK runs entirely on your servers. Only a 256-bit hash crosses the network — never pixels. This is Pipeline 1 (Shield). Pipeline 2 deep scans are opt-in, disclosed separately, and disabled by default.
          </p>
          {/* Flow diagram */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flexWrap:'wrap', gap:'0', margin:'0 auto', maxWidth:'680px' }}>
            {[
              { label:'Image', sub:'your server', color:'var(--text-muted)' },
              null,
              { label:'SDK', sub:'runs locally', color:'var(--green)' },
              null,
              { label:'PDQ Hash', sub:'256 bits only', color:'var(--green)' },
              null,
              { label:'Corvinth', sub:'match engine', color:'var(--text-muted)' },
              null,
              { label:'Decision', sub:'<100ms · p50', color:'var(--green)' },
            ].map((step, i) =>
              step === null ? (
                <span key={i} style={{ color:'var(--text-faint)', fontSize:'18px', padding:'0 6px', userSelect:'none' }}>→</span>
              ) : (
                <div key={i} style={{ padding:'14px 18px', borderRadius:'10px', border:`0.5px solid ${step.color === 'var(--green)' ? 'rgba(0,229,155,0.25)' : 'var(--border)'}`, background: step.color === 'var(--green)' ? 'rgba(0,229,155,0.06)' : 'var(--bg-off)', textAlign:'center', minWidth:'90px' }}>
                  <div style={{ fontSize:'13px', fontWeight:600, color: step.color, fontFamily:'var(--font-mono)', letterSpacing:'0.01em' }}>{step.label}</div>
                  <div style={{ fontSize:'10px', color:'var(--text-faint)', marginTop:'3px', fontFamily:'var(--font-mono)' }}>{step.sub}</div>
                </div>
              )
            )}
          </div>
          <div style={{ marginTop:'2.5rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'2.5rem', flexWrap:'wrap' }}>
            {[
              '0 pixels sent to Corvinth · Pipeline 1',
              'GDPR & TIDA compliant by design',
              'No configuration required',
            ].map(item => (
              <div key={item} style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'var(--text-muted)' }}>
                <span style={{ color:'var(--green)', fontSize:'15px' }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr/>

      {/* ── HOW IT WORKS — 5-step integration ────────────────────────────────── */}
      <section id="how" style={{ padding:'6rem 2.5rem', background:'var(--bg-off)' }}>
        <div className="inner" style={{ maxWidth:'680px' }}>
          <p className="section-tag">integration</p>
          <h2 className="section-title">Live in a day. Audit-ready by day two.</h2>
          <p className="section-sub">
            This isn&apos;t a multi-sprint project. Most teams are fully integrated in a single working day.
          </p>

          {/* 5-step flow */}
          <div style={{ display:'flex', flexDirection:'column', gap:'0', marginBottom:'3rem' }}>
            {[
              { n:'01', label:'Install SDK',         body:'npm install @corvinth/sdk — Node.js/TypeScript and Python in active development. No SDK required either; one HTTP call works today.' },
              { n:'02', label:'Compute PDQ locally', body:'The SDK hashes the image on your server. All 8 orientations in one call. No pixels leave your infrastructure.' },
              { n:'03', label:'POST the hash',       body:'Send the 64-char hex hash to POST /hash/check with your API key. Under 100ms round-trip.' },
              { n:'04', label:'Receive decision',    body:'allow · review · block — with a case UUID and optional Hamming distance for audit.' },
              { n:'05', label:'Enforce your policy', body:'Act on the decision in your upload handler. Corvinth fires your webhook automatically for exact matches.' },
            ].map((step, i, arr) => (
              <div key={i} className="tl-item">
                {i < arr.length - 1 && <div className="tl-line"/>}
                <div className="tl-dot">{step.n}</div>
                <div className="tl-content">
                  <h3>{step.label}</h3>
                  <p>{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* How it works tabs — Shield / Pulse detail */}
          <div className="tab-bar" style={{ marginBottom:'2rem' }}>
            <button className={`tab-btn${howTab === 'shield' ? ' active-shield' : ''}`} onClick={() => setHowTab('shield')}>Flow A — Shield</button>
            <button className={`tab-btn${howTab === 'pulse'  ? ' active-pulse'  : ''}`} onClick={() => setHowTab('pulse')}>Flow B — Pulse</button>
          </div>

          {howTab === 'shield' ? (
            <div className="timeline">
              {[
                { n:'01', title:'Normalize on your server',      body:'The SDK handles EXIF orientation, resizing, compression — all locally. No pixels sent anywhere.' },
                { n:'02', title:'Generate 8 PDQ fingerprints',   body:'Meta PDQ produces fingerprints for all 8 orientations simultaneously. Rotation and re-encoding are tolerated by design.' },
                { n:'03', title:'Match against NCII database',   body:"Hash sent to Corvinth's API. VP-Tree Hamming-distance lookup across all orientations. Under 100ms." },
                { n:'04', title:'Decision returned to you',      body:'allow · review · block · clean — plus a case UUID, classification, confidence_score, matched_lane, and Hamming distance for your audit log.' },
              ].map((s, i, arr) => (
                <div key={s.n} className="tl-item">
                  {i < arr.length-1 && <div className="tl-line"/>}
                  <div className="tl-dot">{s.n}</div>
                  <div className="tl-content"><h3>{s.title}</h3><p>{s.body}</p></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="timeline">
              {[
                { n:'01', title:'Victim files a complaint',       body:'Platform receives the complaint and POSTs to /platform/complaints with a presigned CDN URL (Mode A · all tiers) or a pre-computed DINOv2 vector (Mode B · Enterprise).' },
                { n:'02', title:'Corvinth stores the embedding',  body:'Mode A: Corvinth fetches the URL under SSRF-hardened constraints and computes the 384-dim vector server-side. Mode B: your pre-computed vector is stored directly — image bytes never leave your servers.' },
                { n:'03', title:'Vector stored in your registry', body:"Only the vector and complaint metadata are stored in Qdrant under your platform's namespace. Strictly scoped — no cross-platform matching." },
                { n:'04', title:'Future uploads matched semantically', body:'Cosine similarity against your complaint registry on every /hash/check call. Crops, rotations, brightness edits — caught. Results include pulse_similarity score (0.0–1.0).' },
              ].map((s, i, arr) => (
                <div key={s.n} className="tl-item">
                  {i < arr.length-1 && <div className="tl-line"/>}
                  <div className="tl-dot" style={{ borderColor:'rgba(77,158,255,0.4)', color:'#4D9EFF' }}>{s.n}</div>
                  <div className="tl-content"><h3>{s.title}</h3><p>{s.body}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <hr/>

      {/* ── PROOF STRIP ──────────────────────────────────────────────────────── */}
      <div className="proof">
        <div className="proof-item">
          <div className="proof-num">&lt;100ms</div>
          <div className="proof-label">Shield decision latency · single worker baseline</div>
        </div>
        <div className="proof-item">
          <div className="proof-num">0 pixels</div>
          <div className="proof-label">Pipeline 1 · never sent to Corvinth</div>
        </div>
        <div className="proof-item">
          <div className="proof-num">crops + rotations</div>
          <div className="proof-label">caught by Pulse · what PDQ alone cannot reach</div>
        </div>
        <div className="proof-item">
          <div className="proof-num">1 afternoon</div>
          <div className="proof-label">typical integration time</div>
        </div>
      </div>

      <hr/>

      {/* ── STOPNCII DIFFERENTIATOR ───────────────────────────────────────────── */}
      <div className="stopncii-callout">
        <div className="stopncii-icon">
          <svg className="icon" viewBox="0 0 24 24" style={{ width:'20px', height:'20px' }}>
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
        </div>
        <div className="stopncii-body">
          <div className="stopncii-label">Key differentiator</div>
          <h3>We match against real reported NCII hashes — not generic nudity detection.</h3>
          <p>Corvinth is built to be format-compatible with the StopNCII PDQ hash standard — the same fingerprinting scheme used across the industry's largest victim-reporting network. Corvinth is not currently partnered with or integrated into StopNCII's feed; matches run against Corvinth's own database, populated via direct victim complaints (Pulse) and platform-reported hashes. A photo on a beach is not a violation. A specific image reported by a victim is.</p>
        </div>
      </div>

      {/* ── SDK STRIP ─────────────────────────────────────────────────────────── */}
      <div className="social-strip">
        <div className="social-strip-label">SDK in active development · v0.2.0</div>
        <div className="social-logos">
          {['Node.js / TypeScript — npm install @corvinth/sdk','Python — pip install corvinth'].map(tech => (
            <div key={tech} className="social-logo-item">{tech}</div>
          ))}
        </div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#4A4A45', textAlign:'center', marginTop:'0.75rem' }}>
          checkHash() · checkVideo() · submitComplaint() · addHash()
        </div>
      </div>

      {/* ── PIPELINE FLOW DIAGRAM ─────────────────────────────────────────────── */}
      <div className="pipeline-flows">
        <div className="pipeline-row">
          <span className="pipeline-label shield">Shield</span>
          {['Every upload','PDQ hash (local SDK)','VP-Tree match','Allow · Review · Block'].map((step,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <div style={{ padding:'9px 16px', background: i===3 ? 'rgba(0,229,155,0.08)' : '#0e0e0c', border:`0.5px solid ${i===3 ? 'rgba(0,229,155,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius:'8px', fontSize:'12px', color: i===3 ? '#00E59B' : '#8C8B84', fontFamily:"'JetBrains Mono',monospace", whiteSpace:'nowrap' }}>{step}</div>
              {i < 3 && <span style={{ color:'#2a2a25', fontSize:'14px', userSelect:'none' }}>→</span>}
            </div>
          ))}
        </div>
        <div className="pipeline-row">
          <span className="pipeline-label pulse">Pulse</span>
          {['Direct report','DINOv2 vector (local SDK)','Qdrant cosine','Semantic match'].map((step,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <div style={{ padding:'9px 16px', background: i===3 ? 'rgba(77,158,255,0.08)' : '#0e0e0c', border:`0.5px solid ${i===3 ? 'rgba(77,158,255,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius:'8px', fontSize:'12px', color: i===3 ? '#4D9EFF' : '#8C8B84', fontFamily:"'JetBrains Mono',monospace", whiteSpace:'nowrap' }}>{step}</div>
              {i < 3 && <span style={{ color:'#2a2a25', fontSize:'14px', userSelect:'none' }}>→</span>}
            </div>
          ))}
        </div>
        <div className="pipeline-row">
          <span className="pipeline-label" style={{ background:'rgba(255,178,36,0.10)', color:'#FFB224', border:'0.5px solid rgba(255,178,36,0.25)' }}>Video</span>
          {['Every video upload','MD5 + SHA-256 (local SDK)','O(1) set lookup','Exact match · Allow'].map((step,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <div style={{ padding:'9px 16px', background: i===3 ? 'rgba(255,178,36,0.08)' : '#0e0e0c', border:`0.5px solid ${i===3 ? 'rgba(255,178,36,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius:'8px', fontSize:'12px', color: i===3 ? '#FFB224' : '#8C8B84', fontFamily:"'JetBrains Mono',monospace", whiteSpace:'nowrap' }}>{step}</div>
              {i < 3 && <span style={{ color:'#2a2a25', fontSize:'14px', userSelect:'none' }}>→</span>}
            </div>
          ))}
        </div>
      </div>

      <hr/>

      {/* ── SHIELD DASHBOARD MOCKUP ───────────────────────────────────────────── */}
      <section id="shield" className="bg-section">
        <div className="inner" style={{ maxWidth:'980px' }}>
          <p className="section-tag">shield — hash matching</p>
          <h2 className="section-title">What your team sees every day.</h2>
          <p className="section-sub">A real-time view of every scan decision — matches, blocks, and review queue items — with a full audit trail behind every case.</p>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'1.25rem' }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#4A4A45', textTransform:'uppercase', letterSpacing:'0.10em', padding:'5px 12px', borderRadius:'999px', border:'0.5px solid rgba(255,255,255,0.10)', background:'rgba(255,255,255,0.03)' }}>Illustrative dashboard · sample data, not live production metrics</span>
          </div>
          <div style={{ background:'#060605', border:'0.5px solid rgba(255,255,255,0.10)', borderRadius:'16px', overflow:'hidden', boxShadow:'0 40px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ padding:'12px 1.5rem', borderBottom:'0.5px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#0a0a08' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#00E59B', boxShadow:'0 0 6px rgba(0,229,155,0.6)' }}/>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#8C8B84' }}>corvinth / shield · TestDating</span>
              </div>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#4A4A45', textTransform:'uppercase', letterSpacing:'0.08em' }}>sample</span>
            </div>
            <div className="dashboard-grid">
              <div style={{ padding:'1.5rem', borderRight:'0.5px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize:'10px', fontWeight:500, color:'#4A4A45', textTransform:'uppercase', letterSpacing:'0.12em', fontFamily:"'JetBrains Mono',monospace", marginBottom:'1rem' }}>Recent decisions</div>
                {[
                  { id:'CASE-3829', label:'EXACT',     status:'Blocked', color:'#FF4D4D', bg:'rgba(255,77,77,0.07)',   dist:'0',  time:'2s ago' },
                  { id:'CASE-3830', label:'FUZZY',     status:'Review',  color:'#FFB224', bg:'rgba(255,178,36,0.07)', dist:'6',  time:'14s ago' },
                  { id:'CASE-3831', label:'EXACT',     status:'Blocked', color:'#FF4D4D', bg:'rgba(255,77,77,0.07)',   dist:'0',  time:'41s ago' },
                  { id:'CASE-3832', label:'NEAR_MISS', status:'Review',  color:'#FFB224', bg:'rgba(255,178,36,0.07)', dist:'14', time:'1m ago' },
                  { id:'CASE-3833', label:'FUZZY',     status:'Blocked', color:'#FF4D4D', bg:'rgba(255,77,77,0.07)',   dist:'3',  time:'2m ago' },
                  { id:'CASE-3834', label:'CLEAN',     status:'Allowed', color:'#00E59B', bg:'rgba(0,229,155,0.07)',  dist:'—',  time:'3m ago' },
                ].map(c => (
                  <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderRadius:'8px', marginBottom:'4px', background:c.bg, border:`0.5px solid ${c.color}1A` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#8C8B84' }}>{c.id}</span>
                      <span style={{ fontSize:'10px', fontWeight:500, color:c.color, fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.04em' }}>{c.label}</span>
                      <span style={{ fontSize:'11px', color:'#4A4A45' }}>dist: {c.dist}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ fontSize:'10px', color:'#4A4A45', fontFamily:"'JetBrains Mono',monospace" }}>{c.time}</span>
                      <span style={{ fontSize:'11px', fontWeight:500, color:c.color, background:c.bg, padding:'3px 10px', borderRadius:'999px', border:`0.5px solid ${c.color}33`, fontFamily:"'JetBrains Mono',monospace" }}>{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding:'1.5rem' }}>
                <div style={{ fontSize:'10px', fontWeight:500, color:'#4A4A45', textTransform:'uppercase', letterSpacing:'0.12em', fontFamily:"'JetBrains Mono',monospace", marginBottom:'1.25rem' }}>Today</div>
                {[
                  { label:'Uploads scanned', value:'1,248,991', color:'#F0EFE8' },
                  { label:'Matches found',   value:'317',        color:'#FF4D4D' },
                  { label:'Sent to review',  value:'84',         color:'#FFB224' },
                  { label:'Avg response',    value:'60–120ms',   color:'#00E59B' },
                  { label:'Active cases',    value:'12',         color:'#F0EFE8' },
                ].map(m => (
                  <div key={m.label} style={{ marginBottom:'1.25rem' }}>
                    <div style={{ fontSize:'10px', color:'#4A4A45', fontFamily:"'JetBrains Mono',monospace", marginBottom:'3px', letterSpacing:'0.06em', textTransform:'uppercase' }}>{m.label}</div>
                    <div style={{ fontSize:'24px', fontWeight:700, color:m.color, letterSpacing:'-0.5px', lineHeight:1 }}>{m.value}</div>
                    {m.label === 'Avg response' && (
                      <div style={{ fontSize:'9px', color:'#4A4A45', fontFamily:"'JetBrains Mono',monospace", marginTop:'2px', letterSpacing:'0.06em' }}>p50 · under 50 rps</div>
                    )}
                  </div>
                ))}
                <div style={{ marginTop:'1.5rem', padding:'10px 14px', background:'rgba(0,229,155,0.07)', border:'0.5px solid rgba(0,229,155,0.18)', borderRadius:'8px' }}>
                  <div style={{ fontSize:'10px', color:'#00E59B', fontFamily:"'JetBrains Mono',monospace", marginBottom:'4px', letterSpacing:'0.08em', textTransform:'uppercase' }}>48h compliance</div>
                  <div style={{ fontSize:'13px', color:'#8C8B84' }}>All cases within deadline</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr/>

      {/* ── PULSE DASHBOARD MOCKUP ────────────────────────────────────────────── */}
      <section id="pulse">
        <div className="inner" style={{ maxWidth:'980px' }}>
          <p className="section-tag" style={{ background:'rgba(77,158,255,0.08)', borderColor:'rgba(77,158,255,0.25)', color:'#4D9EFF' }}>pulse — semantic detection</p>
          <h2 className="section-title">Catch what hashes miss.</h2>
          <p className="section-sub">Pulse handles direct victim complaints, heavily cropped variants, and arbitrary rotations that PDQ cannot reach. Powered by DINOv2 384-dim vectors and cosine similarity. Submit a complaint via a presigned URL (we compute the embedding server-side, under SSRF-hardened constraints) or, on Enterprise, send a pre-computed vector directly — your image bytes never have to leave your infrastructure either way.</p>
          <div style={{ background:'#060605', border:'0.5px solid rgba(77,158,255,0.15)', borderRadius:'16px', overflow:'hidden', boxShadow:'0 40px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ padding:'12px 1.5rem', borderBottom:'0.5px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#0a0a08' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#4D9EFF', boxShadow:'0 0 6px rgba(77,158,255,0.6)' }}/>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#8C8B84' }}>corvinth / pulse · TestDating</span>
              </div>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#4A4A45', textTransform:'uppercase', letterSpacing:'0.08em' }}>live</span>
            </div>
            <div className="dashboard-grid">
              <div style={{ padding:'1.5rem', borderRight:'0.5px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize:'10px', fontWeight:500, color:'#4A4A45', textTransform:'uppercase', letterSpacing:'0.12em', fontFamily:"'JetBrains Mono',monospace", marginBottom:'1rem' }}>Complaint registry</div>
                {[
                  { id:'CPL-0041', caseId:'cse_9f2a',  score:'0.97', status:'Active',   color:'#FF4D4D', bg:'rgba(255,77,77,0.07)' },
                  { id:'CPL-0040', caseId:'cse_3b1e',  score:'0.91', status:'Active',   color:'#FF4D4D', bg:'rgba(255,77,77,0.07)' },
                  { id:'CPL-0039', caseId:'cse_7c4d',  score:'0.88', status:'Resolved', color:'#00E59B', bg:'rgba(0,229,155,0.07)' },
                  { id:'CPL-0038', caseId:'cse_2a9f',  score:'0.94', status:'Active',   color:'#FF4D4D', bg:'rgba(255,77,77,0.07)' },
                ].map(c => (
                  <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderRadius:'8px', marginBottom:'4px', background:c.bg, border:`0.5px solid ${c.color}1A` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#8C8B84' }}>{c.id}</span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#4A4A45' }}>{c.caseId}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#4A4A45' }}>sim: {c.score}</span>
                      <span style={{ fontSize:'11px', fontWeight:500, color:c.color, background:c.bg, padding:'3px 10px', borderRadius:'999px', border:`0.5px solid ${c.color}33`, fontFamily:"'JetBrains Mono',monospace" }}>{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding:'1.5rem' }}>
                <div style={{ fontSize:'10px', fontWeight:500, color:'#4A4A45', textTransform:'uppercase', letterSpacing:'0.12em', fontFamily:"'JetBrains Mono',monospace", marginBottom:'1.25rem' }}>Semantic stats</div>
                {[
                  { label:'Active complaints', value:'41',   color:'#FF4D4D' },
                  { label:'Resolved',          value:'189',  color:'#00E59B' },
                  { label:'Avg similarity',    value:'0.94', color:'#4D9EFF' },
                  { label:'Variants caught',   value:'1,204',color:'#F0EFE8' },
                ].map(m => (
                  <div key={m.label} style={{ marginBottom:'1.25rem' }}>
                    <div style={{ fontSize:'10px', color:'#4A4A45', fontFamily:"'JetBrains Mono',monospace", marginBottom:'3px', letterSpacing:'0.06em', textTransform:'uppercase' }}>{m.label}</div>
                    <div style={{ fontSize:'24px', fontWeight:700, color:m.color, letterSpacing:'-0.5px', lineHeight:1 }}>{m.value}</div>
                  </div>
                ))}
                <div style={{ marginTop:'1.5rem', padding:'10px 14px', background:'rgba(77,158,255,0.07)', border:'0.5px solid rgba(77,158,255,0.18)', borderRadius:'8px' }}>
                  <div style={{ fontSize:'10px', color:'#4D9EFF', fontFamily:"'JetBrains Mono',monospace", marginBottom:'4px', letterSpacing:'0.08em', textTransform:'uppercase' }}>DINOv2 vectors</div>
                  <div style={{ fontSize:'13px', color:'#8C8B84' }}>384-dim · cosine similarity</div>
                </div>
              </div>
            </div>
          </div>
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
                ) : (
                  <>
                    <div style={{ color:'#4A4A45', marginBottom:'10px', fontSize:'11px' }}># POST /platform/complaints response</div>
                    <div style={{ color:'#F0EFE8' }}>{'{'}</div>
                    <div style={{ paddingLeft:'18px' }}>
                      <div><span style={{ color:'#4D9EFF' }}>"complaint_id"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"CPL-0041"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#4D9EFF' }}>"case_id"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"your-internal-ref"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#4D9EFF' }}>"platform_id"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"plt_abc123"</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#4D9EFF' }}>"vector_stored"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#4D9EFF' }}>true</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#4D9EFF' }}>"message"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#FFB224' }}>"Complaint registered. Future uploads matched."</span><span style={{ color:'#5E5E57' }}>,</span></div>
                      <div><span style={{ color:'#4D9EFF' }}>"used_mock_extraction"</span><span style={{ color:'#5E5E57' }}>: </span><span style={{ color:'#4D9EFF' }}>false</span></div>
                    </div>
                    <div style={{ color:'#F0EFE8' }}>{'}'}</div>
                  </>
                )}
              </div>
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

      {/* ── ONBOARDING TIMELINE ───────────────────────────────────────────────── */}
      <section className="bg-section">
        <div className="inner">
          <p className="section-tag">onboarding</p>
          <h2 className="section-title">Live in a day. Audit-ready by day two.</h2>
          <p className="section-sub">This isn&apos;t a multi-sprint project. Most engineering teams are fully integrated in a single working day.</p>
          <div className="onboard-grid">
            {[
              { day:'Day 0', title:'Get your credentials', body:'Request access and receive API credentials — typically within 24 hours. We send you an API key and integration notes for Node.js/TypeScript and Python (SDKs in active development; raw HTTP works today).', tasks:['API key issued','Integration notes sent','Live demo available with no API key'] },
              { day:'Day 1', title:'One endpoint in your pipeline', body:'Add a single POST call to your upload handler. The SDK computes the hash on your server — nothing else changes in your infrastructure.', tasks:['POST /hash/check integrated','Block / review / allow logic wired','First real scan running'] },
              { day:'Day 2', title:'Audit log running', body:'Enable webhook notifications and connect the audit log export to your compliance tooling. You now have a paper trail for every decision your platform makes.', tasks:['Audit log exporting','Webhooks configured','Legal team can pull reports'] },
            ].map((step, i) => (
              <div key={i} className="onboard-step">
                <div className="onboard-day">{step.day}</div>
                <h4>{step.title}</h4>
                <p>{step.body}</p>
                <div className="onboard-tasks">
                  {step.tasks.map(task => <div key={task} className="onboard-task">{task}</div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr/>

      {/* ── SECURITY & DATA HANDLING ──────────────────────────────────────────── */}
      <section id="security">
        <div className="inner">
          <p className="section-tag">security &amp; data handling</p>
          <h2 className="section-title">Where does the data go?</h2>
          <p className="section-sub">The first question your legal team will ask. Here is the complete answer.</p>
          <div className="security-grid">
            {[
              { title:'Zero image storage', body:'Images are never sent to or stored on Corvinth servers under Pipeline 1 (Shield). The SDK runs entirely on your infrastructure. Only a 256-bit hash or a 384-dim vector crosses the network boundary. Pipeline 2 deep scans are opt-in and disclosed separately.', icon:<svg className="icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
              { title:'Encryption in transit', body:'All API traffic uses TLS 1.3. Hash values and vectors in transit are non-reversible and cannot reconstruct the original image. Even if intercepted, a 256-bit hash reveals nothing about image content.', icon:<svg className="icon" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
              { title:'Hash retention policy', body:'We store only the fingerprint, vector, and decision metadata — never original content. Hash data is retained for audit log purposes and can be configured per contract for enterprise customers.', icon:<svg className="icon" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg> },
            ].map((card, i) => (
              <div key={i} className="security-card">
                <div className="security-icon">{card.icon}</div>
                <h4>{card.title}</h4>
                <p>{card.body}</p>
              </div>
            ))}
          </div>
          <div className="dpa-offer">
            <svg className="icon" viewBox="0 0 24 24" style={{ flexShrink:0, color:'#00E59B', width:'20px', height:'20px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <p><strong>Data Processing Agreement available.</strong> Enterprise customers can request a signed DPA before integration. Email <a href="mailto:founder@corvinth.com" style={{ color:'var(--green)' }}>founder@corvinth.com</a> with your legal team&apos;s requirements.</p>
            <a href="mailto:founder@corvinth.com?subject=DPA%20Request" className="btn-ghost" style={{ flexShrink:0 }}>request DPA →</a>
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

      {/* ── TIDA / REGULATION — comes AFTER the product ──────────────────────── */}
      <section id="tida" style={{ padding:'6rem 2.5rem', background:'var(--bg-off)' }}>
        <div className="inner">
          <p className="section-tag">the regulation</p>
          <h2 className="section-title">Why image safety suddenly matters.</h2>
          <p className="section-sub">Regulatory pressure on platforms is accelerating globally. The U.S. Take It Down Act is the clearest example — but it won&apos;t be the last.</p>
          <div className="tida-timeline">
            {[
              { date:'Feb 2025',    label:'TIDA introduced',                    body:'Bipartisan bill introduced in both House and Senate with broad support. Named partly in response to the Taylor Swift deepfake incident.' },
              { date:'Apr 2025',    label:'Passed Senate 95–1',                 body:'Near-unanimous vote. Senators cited the explosion of AI-generated NCII targeting minors and adults across social and dating platforms.' },
              { date:'May 19 2026', label:'Signed into law · FTC enforcement begins', body:'Platforms now have 48 hours to remove flagged NCII after a valid request. Failure = $53,088 per violation. The FTC has active jurisdiction.', highlight:true },
              { date:'Now',         label:'Your platform is covered',           body:'If users can upload images on your platform, you are in scope. Dating apps, social platforms, messaging apps, creator tools — no exceptions for size.', highlight:true },
            ].map((item, i, arr) => (
              <div key={i} className={`tl-item${item.highlight ? ' tl-highlight' : ''}`}>
                {i < arr.length-1 && <div className="tl-line"/>}
                <div className={`tl-dot${item.highlight ? ' tl-dot-hot' : ''}`}>{item.highlight ? '!' : String(i+1).padStart(2,'0')}</div>
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

      <hr/>

      {/* ── WHAT IF YOU DO NOTHING ───────────────────────────────────────────── */}
      <section className="donothing-section">
        <div className="inner">
          <p className="section-tag">if you do nothing</p>
          <h2 className="section-title">Two different engineering realities.</h2>
          <p className="section-sub">
            The difference between platforms that handle image safety well and platforms that don&apos;t
            isn&apos;t intent — it&apos;s infrastructure.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2.5rem', marginBottom: '2.5rem' }}>
            {/* Without Corvinth */}
            <div style={{ background: 'rgba(255,77,77,0.04)', border: '0.5px solid rgba(255,77,77,0.18)', borderRadius: '16px', padding: '1.75rem' }}>
              <div style={{ fontSize: '10px', fontWeight: 500, color: '#FF4D4D', textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: "'JetBrains Mono',monospace", marginBottom: '1.25rem' }}>Without Corvinth</div>
              {[
                'User uploads image',
                'No detection at ingest',
                'Victim files abuse report',
                'Support ticket created',
                'Manual investigation begins',
                '48h deadline missed',
                'FTC complaint filed',
                'Platform at risk',
              ].map((step, i, arr) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '13px', color: i >= 5 ? '#FF4D4D' : '#8C8B84', padding: '7px 0', fontFamily: "'JetBrains Mono',monospace" }}>↓ {step}</div>
                </div>
              ))}
            </div>

            {/* With Corvinth */}
            <div style={{ background: 'rgba(0,229,155,0.04)', border: '0.5px solid rgba(0,229,155,0.18)', borderRadius: '16px', padding: '1.75rem' }}>
              <div style={{ fontSize: '10px', fontWeight: 500, color: '#00E59B', textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: "'JetBrains Mono',monospace", marginBottom: '1.25rem' }}>With Corvinth</div>
              {[
                'User uploads image',
                'SDK hashes locally — no pixels sent',
                'POST /hash/check → <100ms',
                'Decision returned: allow · review · block',
                'Case UUID created',
                'Audit log entry written',
                'Webhook fired to your platform',
                'Evidence ready before any complaint',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '13px', color: i >= 4 ? '#00E59B' : '#8C8B84', padding: '7px 0', fontFamily: "'JetBrains Mono',monospace" }}>↓ {step}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1rem', padding: '1rem 1.5rem', background: 'rgba(255,178,36,0.05)', border: '0.5px solid rgba(255,178,36,0.2)', borderRadius: '12px', fontSize: '13px', color: '#8C8B84', lineHeight: 1.75 }}>
            <strong style={{ color: '#FFB224' }}>Note on TIDA:</strong> Under the Take It Down Act (U.S., active May 2026), platforms have 48 hours to remove flagged NCII after a valid request. Failure is $53,088 per violation. Corvinth catches violations at upload — before the clock starts.
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <a className="btn-primary lg" href="#contact">don&apos;t wait for a complaint →</a>
          </div>
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
                {['Full Shield API — hash matching','Full Pulse API — semantic detection','Complaint registry','Audit log export','Direct line to founder','Weekly feedback calls'].map(f => (
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
              { name:'Growth',  price:'$799', period:'/month', perScan:'~$0.0002/scan · 5M scans included', desc:'For high-growth platforms that need Pulse for victim complaints, semantic detection, and video.',  features:['Everything in Starter','Full Pulse API — semantic detection','Complaint registry','Video lane — MD5/SHA-256 matching','5M scans/month'], pulseIncluded:true, featured:true, cta:'request access' },
              { name:'Enterprise', price:'Custom', period:'', perScan:'Unlimited scans · dedicated infra', desc:'For high-volume platforms and custom needs.', features:['Unlimited scans','Pulse + Shield','Dedicated infrastructure','On-premise option','SLA 99.9% uptime','Legal & compliance support'], pulseIncluded:true, featured:false, cta:'contact us' },
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
          <a href="#pulse">pulse</a>
          <a href="https://corvinth-api.onrender.com/docs" target="_blank" rel="noopener noreferrer">docs</a>
          <a href="mailto:founder@corvinth.com">founder@corvinth.com</a>
        </div>
      </footer>
    </>
  );
}