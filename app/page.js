// app/page.js
'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import DemoPreview from './components/DemoPreview';
import FoundingPartner from './components/FoundingPartner';

function Screen12FaqItem({ index, topic, q, a, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const number = String(index + 1).padStart(2, '0');
  const questionId = `screen12-question-${index + 1}`;
  const answerId = `screen12-answer-${index + 1}`;

  return (
    <article className={`screen12-faq-item${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="screen12-faq-trigger"
        id={questionId}
        aria-expanded={open}
        aria-controls={answerId}
        onClick={() => setOpen(!open)}
      >
        <span className="screen12-faq-number" aria-hidden="true">{number}</span>
        <span className="screen12-faq-question-copy">
          <span className="screen12-faq-topic">{topic}</span>
          <span className="screen12-faq-question">{q}</span>
        </span>
        <span className="screen12-faq-toggle" aria-hidden="true"><i></i><i></i></span>
      </button>
      <div
        className="screen12-faq-answer"
        id={answerId}
        role="region"
        aria-labelledby={questionId}
        hidden={!open}
      >
        <div className="screen12-faq-answer-inner">{a}</div>
      </div>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Waitlist form
  const [form, setForm] = useState({
    contact_name: '', work_email: '', company_name: '', platform_url: '',
    monthly_upload_volume: '', use_case: '',
  });
  const [formStatus, setFormStatus] = useState('idle');
  const [formError, setFormError] = useState('');
  const [formFieldErrors, setFormFieldErrors] = useState({});
  const submissionInFlight = useRef(false);

  const handleFormChange = event => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFormError('');
    setFormFieldErrors(prev => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleFormSubmit = async event => {
    event.preventDefault();
    if (submissionInFlight.current) return;

    setFormError('');
    const requiredFields = {
      contact_name: 'Enter your name.',
      work_email: 'Enter your email address.',
      company_name: 'Enter your company or platform.',
    };
    const requiredErrors = Object.fromEntries(
      Object.entries(requiredFields).filter(([name]) => !form[name].trim())
    );
    const invalidControls = Array.from(event.currentTarget.elements).filter(
      control => control.willValidate && !control.validity.valid
    );
    const constraintErrors = Object.fromEntries(
      invalidControls.map(control => [control.name, control.validationMessage])
    );
    const validationErrors = { ...requiredErrors, ...constraintErrors };

    if (Object.keys(validationErrors).length) {
      setFormFieldErrors(validationErrors);
      setFormError('Please correct the highlighted fields.');
      const firstInvalid = invalidControls[0] || event.currentTarget.elements.namedItem(Object.keys(validationErrors)[0]);
      firstInvalid?.focus();
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setFormError('The access-request service is unavailable. Please try again later.');
      return;
    }

    setFormFieldErrors({});
    submissionInFlight.current = true;
    setFormStatus('submitting');
    const payload = Object.fromEntries(
      Object.entries(form).filter(entry => entry[1] !== '')
    );

    try {
      const response = await fetch(`${apiUrl}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = Array.isArray(data?.detail) ? data.detail[0] : null;
        const field = detail?.loc?.at(-1);
        const message = detail?.msg ||
          (typeof data?.detail === 'string' && data.detail) ||
          data?.error ||
          data?.message ||
          'Submission failed. Please try again.';
        if (typeof field === 'string' && Object.hasOwn(form, field)) {
          setFormFieldErrors({ [field]: message });
        }
        throw new Error(message);
      }

      if (data?.status !== 'received') {
        throw new Error('The access request could not be confirmed. Please try again.');
      }

      setFormStatus('success');
    } catch (error) {
      setFormError(error.message || 'Something went wrong. Please try again.');
      setFormStatus('idle');
      submissionInFlight.current = false;
    }
  };

  return (
    <>
      <div className="page-frame">
      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <nav className="screen01-nav">
        <a className="logo screen01-logo" href="#top" aria-label="Corvinth home">
          <Image src="/favicon.ico" width={34} height={38} alt="" aria-hidden="true" unoptimized />
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
          <a className="screen01-nav-cta" href="#contact">Request API access</a>
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
        <a href="#contact" className="mobile-cta" onClick={() => setMobileMenuOpen(false)}>Request API access</a>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section id="top" className="hero" aria-labelledby="hero-title">
        <div className="hero-backdrop" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="hero-category">IMAGE SAFETY INFRASTRUCTURE</p>
            <h1 id="hero-title">
              <span>One reported image.</span>
              <span>Find its matches across your platform.</span>
            </h1>
            <p className="hero-description">
              Image safety infrastructure for platforms with user-generated content. Corvinth detects matching images across your platform&apos;s existing media and new uploads.
            </p>
            <p className="hero-boundary">Corvinth returns the match result.{' '}<br /><strong>Your platform decides what happens next.</strong></p>
            <div className="hero-cta">
              <a className="hero-cta-primary" href="#contact">Request API access <span aria-hidden="true">→</span></a>
              <a className="hero-cta-secondary" href="#demo">View live demo</a>
            </div>
            <p className="hero-trust">
              <span className="hero-trust-line">PLATFORM-SCOPED MATCHING <span>·</span></span>{' '}
              <span className="hero-trust-line">MANAGED OR CUSTOMER COMPUTE <span>·</span></span>{' '}
              <span className="hero-trust-line">NO DURABLE IMAGE-BYTE STORAGE</span>
            </p>
          </div>

          <div className="hero-proof" aria-label="Illustration of platform-scoped detection">
            <div className="hero-proof-header">
              <div><span className="hero-proof-mark" aria-hidden="true" /><span>Platform-scoped detection</span></div>
              <span className="hero-proof-scope">Same platform scope</span>
            </div>
            <div className="hero-proof-flow">
              <div className="hero-proof-step hero-proof-selected">
                <h2>Platform-selected<br />image</h2>
                <div className="hero-proof-photo"><img className="hero-proof-source-image" src="/screen01-personal-original.webp" alt="Fully clothed adult woman taking a mirror selfie at home, with her face covered by her phone" /></div>
                <div className="hero-proof-step-caption"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2 20 5v6c0 5-3.3 8.5-8 11-4.7-2.5-8-6-8-11V5l8-3Z"/><path d="m8.5 12 2.3 2.3 4.8-5"/></svg><span>Selected by your team</span></div>
              </div>
              <div className="hero-proof-connector hero-proof-reference" aria-label="Reference"><span>Reference</span><b aria-hidden="true">→</b></div>
              <div className="hero-proof-step hero-proof-matching">
                <h2>Platform-scoped<br />matching</h2>
                <p>existing content · new uploads</p>
                <div className="hero-proof-stack"><span>Image<br />matching</span><i /><i /><i /><i /></div>
                <div className="hero-proof-step-caption"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><span>Searching your<br />platform content</span></div>
              </div>
              <div className="hero-proof-connector hero-proof-arrow" aria-hidden="true"><b>→</b></div>
              <div className="hero-proof-step hero-proof-result">
                <h2>Match found</h2>
                <div className="hero-proof-thumbnails" aria-hidden="true">
                  <img src="/hero-matches/blurred.png" alt="" />
                  <img src="/hero-matches/original.png" alt="" />
                  <img src="/hero-matches/filtered.png" alt="" />
                  <img src="/hero-matches/rotate90.png" alt="" />
                  <img src="/hero-matches/cropped.png" alt="" />
                  <img src="/hero-matches/darkened.png" alt="" />
                </div>
                <div className="hero-proof-details">
                  <span>match_found</span><strong>true</strong>
                  <span>classification</span><strong>EXACT</strong>
                </div>
                <p className="hero-proof-boundary">Corvinth detects. Your platform decides.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-feature-row">
          <div><span className="hero-feature-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="10"/><circle cx="16" cy="16" r="3"/><path d="M16 1v7m0 16v7M1 16h7m16 0h7"/></svg></span><p><strong>Platform-scoped matching</strong><span>Find matching content across your platform.</span></p></div>
          <div><span className="hero-feature-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><rect x="5" y="5" width="22" height="6" rx="1"/><rect x="5" y="13" width="22" height="6" rx="1"/><rect x="5" y="21" width="22" height="6" rx="1"/><path d="M22 8h2m-2 8h2m-2 8h2"/></svg></span><p><strong>Managed or Customer Compute</strong><span>Choose where image compute happens.</span></p></div>
          <div><span className="hero-feature-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="m12 20 8-8M11 13l-2 2a6 6 0 0 0 8 8l2-2m2-2 2-2a6 6 0 0 0-8-8l-2 2"/></svg></span><p><strong>Corvinth detects. Your platform decides.</strong><span>Match results integrate into your existing review and enforcement workflow.</span></p></div>
        </div>
      </section>

      {/* ── BUILT FOR — self-identification ──────────────────────────────────── */}
      <section className="built-for-section" style={{ padding:'0 2.5rem 5rem', background:'var(--bg)' }}>
        <div className="inner" style={{ textAlign:'center' }}>
          <p className="built-for-heading" style={{ fontSize:'clamp(15px, 1.25vw, 17px)', color:'var(--green)', textTransform:'uppercase', letterSpacing:'0.22em', fontFamily:'var(--font-mono)', marginBottom:'1.5rem' }}>Built for</p>
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
              Detection isn&apos;t just a model call. You need references registered, existing images indexed, new uploads checked, and every match routed back into your workflow. That&apos;s the system Corvinth provides — without becoming your next infrastructure project.
            </p>
          </div>
          <div className="screen02-cards">
            <article className="screen02-card">
              <span className="screen02-card-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="7" height="6" rx="1"/><rect x="14.5" y="13" width="7" height="6" rx="1"/><path d="M9.5 8h4a4 4 0 0 1 4 4v1M14.5 16h-4a4 4 0 0 1-4-4v-1"/></svg></span>
              <h3>References in. Matches out.</h3>
              <p>Register reported images as references. Corvinth matches them against your platform&apos;s indexed images and new uploads.</p>
            </article>
            <article className="screen02-card">
              <span className="screen02-card-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 2.5h8l4 4V21.5H6z"/><path d="M14 2.5v4h4M9 11h6M9 15h6M9 19h4"/></svg></span>
              <h3>Fits into your existing media pipeline.</h3>
              <p>Send presigned image URLs for Corvinth-managed processing, or send derived representations from your own infrastructure.</p>
            </article>
            <article className="screen02-card">
              <span className="screen02-card-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2.5 20 5.5v5.7c0 5-3.1 8.1-8 10.3-4.9-2.2-8-5.3-8-10.3V5.5z"/><path d="m8.5 12 2.4 2.4 4.8-5"/></svg></span>
              <h3>Your policy. Our detection.</h3>
              <p>Corvinth tells you what matched and provides a structured record for every case. What you do with that is yours.</p>
            </article>
          </div>
          <div className="screen02-close">
            <h3>You define what to track. We find it.</h3>
            <p>Your team selects the images to track. Corvinth detects matching images across your platform&apos;s existing media and new uploads.</p>
          </div>
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
                <li>Corvinth detection infrastructure</li>
                <li>Match result</li>
              </ol>
              <p className="architecture-card-copy">Presigned URL sent to Corvinth. Corvinth fetches the image for processing.</p>
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
                <li>Corvinth detection infrastructure</li>
                <li>Match result</li>
              </ol>
              <p className="architecture-card-copy">Image processing stays inside your infrastructure. Corvinth receives the required fingerprint together with the platform-scoped object reference needed to correlate the match result back to content in your system — never the image itself.</p>
            </article>
          </div>

          <div className="architecture-shared" aria-label="Shared architecture properties">
            <span>No durable image-byte storage</span>
            <span>You choose where images are processed</span>
            <span>Same detection infrastructure</span>
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
                <span>Reference</span>
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
            <span className="screen04-step">03 / MATCH + STRUCTURED CASE RECORD</span>
            <div>
              <h3>Corvinth returns the match; the case record preserves the context.</h3>
              <p>Your platform decides what happens next.</p>
            </div>
            <span className="screen04-boundary">Corvinth detects. Your platform decides.</span>
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
              <p className="screen06-capability-index">01 / Structured case record</p>
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
            <p>Register references, connect your media pipeline, and route match results into your existing workflow.</p>
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
                  <small>Presigned URL sent to Corvinth</small>
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

            <div className="screen07-result-route" aria-label="Match result flows into your existing workflow">
              <span>Match result + detection metadata</span>
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
              <span>Corvinth detects and returns context. Your platform decides what happens next.</span>
            </li>
          </ol>

          <div className="screen07-ownership-strip" aria-label="Product boundary">
            <article>
              <p>Your stack stays yours</p>
              <ul>
                {['Media storage', 'Reference selection and policy', 'Moderation workflows', 'Enforcement decisions'].map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
            <article>
              <p>Corvinth provides</p>
              <ul>
                {['Detection references', 'Image matching', 'Match results and detection metadata'].map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          </div>

          <p className="screen07-closing">Corvinth returns match results. You decide what happens next.</p>
        </div>
      </section>

      <hr/>

      {/* ── LIVE API DEMO ─────────────────────────────────────────────────────── */}
      <DemoPreview/>

      <hr/>

      {/* ── SCREEN 09 — TECHNICAL FOUNDATION ─────────────────────────────────── */}
      <section className="screen09" aria-labelledby="screen09-title">
        <div className="screen09-inner">
          <header className="screen09-intro">
            <p className="screen09-eyebrow">Technical foundation</p>
            <h2 id="screen09-title">PDQ is a foundation, not the product.</h2>
            <div className="screen09-detail">
              <p>PDQ is an established image-fingerprinting method used within Corvinth. Corvinth builds the operational detection system around it.</p>
              <a className="screen09-pdq-link" href="https://github.com/facebook/ThreatExchange/tree/4af74a5ef94ff58b5744379a017b1f44be18bd3a/pdq" target="_blank" rel="noopener noreferrer">About PDQ <span aria-hidden="true">→</span></a>
            </div>
          </header>
        </div>
      </section>

      <hr/>

      {/* ── SCREEN 05 — WHY NOW ─────────────────────────────────────────────── */}
      <section id="tida" className="screen05" aria-labelledby="screen05-title">
        <div className="screen05-inner">
          <header className="screen05-intro">
            <p className="screen05-eyebrow">Why now</p>
            <h2 id="screen05-title">Removing one image is not the same as finding its copies.</h2>
            <p className="screen05-deck">Under the TAKE IT DOWN Act, covered platforms must remove qualifying intimate imagery and make reasonable efforts to identify and remove known identical copies within 48 hours of a valid request. Corvinth provides image-matching infrastructure to support that discovery process.</p>
          </header>

          <div className="screen05-opening" aria-label="Report to removal operating path">
            <p className="screen05-kicker">The operating reality</p>
            <ol className="screen05-request-flow">
              {['report', 'support / admin', 'engineer', 'manual search', 'removal'].map((step) => <li key={step}>{step}</li>)}
            </ol>
            <p>Engineering doesn&apos;t start the clock. For a covered platform, the 48-hour period begins when it receives a valid removal request through its TIDA notice-and-removal process.</p>
          </div>

          <aside className="screen05-pressure" aria-labelledby="screen05-pressure-title">
            <p className="screen05-pressure-label">U.S. regulatory context</p>
            <h3 id="screen05-pressure-title">The TAKE IT DOWN Act</h3>
            <p>Under Section 3, covered platforms must establish a notice-and-removal process. Following a valid request, they must remove covered intimate imagery and make reasonable efforts to identify and remove known identical copies within 48 hours.</p>
            <p className="screen05-pressure-note">FTC enforcement began May 19, 2026.</p>
            <a href="https://www.ftc.gov/business-guidance/resources/complying-take-it-down-act" target="_blank" rel="noopener noreferrer">Read the FTC’s guidance <span aria-hidden="true">↗</span></a>
          </aside>

        </div>
      </section>

      <hr/>

      {/* ── SCREEN 12 — FAQ ───────────────────────────────────────────────────── */}
      <section id="faq" className="screen12-faq" aria-labelledby="screen12-faq-title">
        <div className="screen12-faq-glow" aria-hidden="true"></div>
        <div className="screen12-faq-shell">
          <header className="screen12-faq-intro">
            <p className="section-tag">FAQ</p>
            <h2 id="screen12-faq-title">Questions platforms actually ask.</h2>
            <p className="screen12-faq-deck">The useful answer is the precise one. These are the boundaries teams usually want clear before they connect a detection system to their workflow.</p>
            <aside className="screen12-faq-boundary" aria-label="Corvinth operating boundary">
              <span>The operating boundary</span>
              <p><strong>Corvinth detects</strong> and returns context.</p>
              <p><strong>Your platform decides</strong> what happens next.</p>
            </aside>
          </header>

          <div className="screen12-faq-column">
            <div className="screen12-faq-list-heading" aria-hidden="true">
              <span>Five practical questions</span>
              <span>Open what matters to your team</span>
            </div>
            <div className="screen12-faq-list">
              {[
                {
                  topic: 'Detection and decisions',
                  q: 'What happens if Corvinth returns a false positive?',
                  a: <>
                    <p className="screen12-faq-answer-lead">Corvinth returns the match result and supporting context. Your platform decides how that result is reviewed or acted on under its own policy.</p>
                    <p>Your platform decides whether to review, remove, allow, or otherwise act according to its own policy. Matching thresholds and review settings are detection configuration—not automatic enforcement by Corvinth.</p>
                  </>,
                },
                {
                  topic: 'Independence',
                  q: 'Is Corvinth integrated with StopNCII?',
                  a: <p className="screen12-faq-answer-lead">Corvinth is not partnered with or integrated into StopNCII and does not represent StopNCII. Corvinth operates its own image-matching infrastructure, incorporating perceptual hashing and DINOv2-based semantic image matching.</p>,
                },
                {
                  topic: 'Image handling',
                  q: 'Does Corvinth receive or store my images?',
                  a: <>
                    <p className="screen12-faq-answer-lead">That depends on your processing mode.</p>
                    <p><strong>Managed Compute:</strong> Corvinth fetches and processes an image from a presigned URL.</p>
                    <p><strong>Customer Compute:</strong> Your platform can send precomputed matching hashes, with its own content identifier when it needs match correlation, instead of an image URL.</p>
                  </>,
                },
                {
                  topic: 'Team size',
                  q: 'How small is "too small" to need this?',
                  a: <p className="screen12-faq-answer-lead">Small teams are where the tradeoff can matter most: manual discovery competes directly with product and engineering work. Corvinth provides the detection layer without requiring the platform to build and operate that infrastructure itself.</p>,
                },
                {
                  topic: 'Integration',
                  q: "What's the integration effort for an engineering team?",
                  a: <>
                    <p className="screen12-faq-answer-lead">Integration means establishing the platform scope, connecting the compute path that fits your infrastructure—Managed Compute or Customer Compute—and routing Corvinth&apos;s results into the workflow your team already uses.</p>
                    <p>The integration surface is bounded, but the timeline depends on your storage, upload, review, and case-handling workflow.</p>
                  </>,
                },
              ].map((item, index) => (
                <Screen12FaqItem
                  key={item.q}
                  index={index}
                  topic={item.topic}
                  q={item.q}
                  a={item.a}
                  defaultOpen={index === 0}
                />
              ))}
            </div>
            <p className="screen12-faq-close">Detection infrastructure should make the boundary clearer—not add another layer of ambiguity.</p>
          </div>
        </div>
      </section>

      <hr/>

      {/* ── FOR PLATFORM USERS ───────────────────────────────────────────────── */}
      <section id="platform-users" className="screen13-users" aria-labelledby="screen13-users-title">
        <div className="screen13-users-shell">
          <p className="screen13-users-tag"><span aria-hidden="true" />For platform users</p>
          <h2 id="screen13-users-title">You report to the platform. <span>Corvinth helps it search.</span></h2>
          <p className="screen13-users-lead">If a platform turns the item you reported into a detection reference, Corvinth can search that platform&apos;s own content for matches—helping find copies beyond the item you originally reported.</p>
          <div className="screen13-users-boundary" aria-label="Reporting responsibility boundary">
            <p><strong>You do not report to Corvinth.</strong> Corvinth does not decide whether your report is valid or what gets removed. Those decisions stay with the platform.</p>
            <p className="screen13-users-boundary-statement">Corvinth is not a reporting destination.</p>
          </div>
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
                I built Corvinth because small platforms often don&apos;t have a detection pipeline — they have an inbox. Someone files a report, it reaches an admin, gets forwarded to an engineer, and valuable time disappears into manual searching.
              </p>
              <p className="founder-text">
                Corvinth is built to replace the manual-search part of that chain with detection infrastructure, so when a platform is working against a removal deadline, engineering is not burning most of that window manually hunting for copies.
              </p>
              <p className="founder-text">
                Small teams shouldn&apos;t need a dedicated trust-and-safety engineering organization just to have this infrastructure. I built Corvinth to fit a startup&apos;s infrastructure budget and work alongside the systems the team already uses.
              </p>
              <p className="founder-text">
                I&apos;m not anonymous — email me directly with questions, including hard ones about what Corvinth can and cannot do.
              </p>
              <a href="mailto:founder@corvinth.com" className="founder-email">founder@corvinth.com</a>
            </div>
          </div>
        </div>
      </section>

      <hr/>

      <FoundingPartner />

      {/* ── CONTACT / WAITLIST FORM ───────────────────────────────────────────── */}
      <section id="contact" className="contact-section">
        <div className="inner-sm">
          <div style={{ background:'#0e0e0c', border:'0.5px solid rgba(255,255,255,0.08)', borderRadius:'20px', padding:'3rem 2.5rem', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg, transparent, rgba(0,229,155,0.5), transparent)' }}/>
            <p style={{ textAlign:'center', fontSize:'10px', fontWeight:500, color:'#00E59B', textTransform:'uppercase', letterSpacing:'0.14em', fontFamily:"'JetBrains Mono',monospace", marginBottom:'1rem' }}>INVITE-ONLY PILOT</p>
            <h2 style={{ textAlign:'center', fontSize:'clamp(26px,3vw,36px)', fontWeight:800, color:'#F0EFE8', letterSpacing:'-1px', marginBottom:'0.75rem', lineHeight:1.1 }}>Request API access.</h2>
            <p style={{ textAlign:'center', fontSize:'15px', color:'#8C8B84', marginBottom:'2rem', lineHeight:1.75, fontWeight:300 }}>
              Tell us about your platform and we&apos;ll get you API credentials within 24 hours.
            </p>

            {formStatus === 'success' ? (
              <div role="status" aria-live="polite" style={{ textAlign:'center', padding:'2rem 0' }}>
                <div style={{ fontSize:'28px', marginBottom:'1rem' }}>✓</div>
                <p style={{ fontSize:'17px', fontWeight:600, color:'#F0EFE8', marginBottom:'0.5rem' }}>Your access request has been received.</p>
                <p style={{ fontSize:'14px', color:'#8C8B84', lineHeight:1.75 }}>
                  Expect credentials within 24 hours — check your inbox at{' '}
                  <span style={{ color:'#00E59B', fontFamily:"'JetBrains Mono',monospace" }}>{form.work_email}</span>.
                </p>
              </div>
            ) : (
              <form noValidate onSubmit={handleFormSubmit} aria-busy={formStatus === 'submitting'}>
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="contact_name">Your name <span aria-hidden="true">*</span></label>
                    <input id="contact_name" name="contact_name" type="text" autoComplete="name" required minLength={2} maxLength={100} placeholder="Jane Smith" value={form.contact_name} onChange={handleFormChange} className="form-input" aria-invalid={Boolean(formFieldErrors.contact_name)} aria-describedby={formFieldErrors.contact_name ? 'contact_name-error' : undefined} disabled={formStatus === 'submitting'}/>
                    {formFieldErrors.contact_name && <p id="contact_name-error" className="form-field-error">{formFieldErrors.contact_name}</p>}
                  </div>
                  <div className="form-field">
                    <label htmlFor="work_email">Email <span aria-hidden="true">*</span></label>
                    <input id="work_email" name="work_email" type="email" autoComplete="email" required placeholder="jane@example.com" value={form.work_email} onChange={handleFormChange} className="form-input" aria-invalid={Boolean(formFieldErrors.work_email)} aria-describedby={formFieldErrors.work_email ? 'work_email-error' : undefined} disabled={formStatus === 'submitting'}/>
                    {formFieldErrors.work_email && <p id="work_email-error" className="form-field-error">{formFieldErrors.work_email}</p>}
                  </div>
                  <div className="form-field full">
                    <label htmlFor="company_name">Company / platform <span aria-hidden="true">*</span></label>
                    <input id="company_name" name="company_name" type="text" autoComplete="organization" required minLength={2} maxLength={100} placeholder="Acme Dating Inc." value={form.company_name} onChange={handleFormChange} className="form-input" aria-invalid={Boolean(formFieldErrors.company_name)} aria-describedby={formFieldErrors.company_name ? 'company_name-error' : undefined} disabled={formStatus === 'submitting'}/>
                    {formFieldErrors.company_name && <p id="company_name-error" className="form-field-error">{formFieldErrors.company_name}</p>}
                  </div>
                  <div className="form-field full">
                    <label htmlFor="platform_url">Platform website</label>
                    <input id="platform_url" name="platform_url" type="url" autoComplete="url" placeholder="https://yourplatform.com" value={form.platform_url} onChange={handleFormChange} className="form-input" aria-invalid={Boolean(formFieldErrors.platform_url)} aria-describedby={formFieldErrors.platform_url ? 'platform_url-error' : undefined} disabled={formStatus === 'submitting'}/>
                    {formFieldErrors.platform_url && <p id="platform_url-error" className="form-field-error">{formFieldErrors.platform_url}</p>}
                  </div>
                  <div className="form-field full">
                    <label htmlFor="monthly_upload_volume">Approximate monthly image uploads</label>
                    <select id="monthly_upload_volume" name="monthly_upload_volume" value={form.monthly_upload_volume} onChange={handleFormChange} className="form-input" style={{ cursor:'pointer', color: form.monthly_upload_volume ? '#F0EFE8' : '#4A4A45' }} aria-invalid={Boolean(formFieldErrors.monthly_upload_volume)} aria-describedby={formFieldErrors.monthly_upload_volume ? 'monthly_upload_volume-error' : undefined} disabled={formStatus === 'submitting'}>
                      <option value="">Select volume…</option>
                      <option value="under_10k">Under 10,000 / month</option>
                      <option value="10k_100k">10,000 – 100,000 / month</option>
                      <option value="100k_1m">100,000 – 1M / month</option>
                      <option value="over_1m">Over 1M / month</option>
                      <option value="not_sure_prelaunch">Not sure / Pre-launch</option>
                    </select>
                    {formFieldErrors.monthly_upload_volume && <p id="monthly_upload_volume-error" className="form-field-error">{formFieldErrors.monthly_upload_volume}</p>}
                  </div>
                  <div className="form-field full">
                    <label htmlFor="use_case">What would you use Corvinth for?</label>
                    <textarea id="use_case" name="use_case" rows={3} maxLength={1000} placeholder="Tell us briefly what you're building and how Corvinth fits in…" value={form.use_case} onChange={handleFormChange} className="form-input" style={{ resize:'vertical', lineHeight:1.65 }} aria-invalid={Boolean(formFieldErrors.use_case)} aria-describedby={formFieldErrors.use_case ? 'use_case-error' : undefined} disabled={formStatus === 'submitting'}/>
                    {formFieldErrors.use_case && <p id="use_case-error" className="form-field-error">{formFieldErrors.use_case}</p>}
                  </div>
                </div>
                {formError && (
                  <p className="form-error" role="alert" aria-live="assertive">{formError}</p>
                )}
                <button type="submit" disabled={formStatus === 'submitting'} className="form-submit" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', opacity: formStatus === 'submitting' ? 0.7 : 1 }}>
                  {formStatus === 'submitting' ? (
                    <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation:'spin 0.8s linear infinite', flexShrink:0 }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Sending…</>
                  ) : 'Request API access'}
                </button>
              </form>
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
