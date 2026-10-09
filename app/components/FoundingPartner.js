import styles from './FoundingPartner.module.css';

export default function FoundingPartner() {
  return (
    <section id="founding-partner" className={styles.section} aria-labelledby="founding-partner-title">
      <div className={styles.card}>
        <div className={styles.heading}>
          <h2 id="founding-partner-title">Founding Partner Program</h2>
          <p className={styles.availability}>3 platforms only.</p>
        </div>

        <div className={styles.offer}>
          <div className={styles.pricing}>
            <p className={styles.price}><strong><span className={styles.currency}>$</span>99</strong><span>/month</span></p>
            <p className={styles.introTerm}>For your first 3 months from go-live.</p>
            <p className={styles.foundingRate}><strong>$299/month thereafter</strong><span> — your exclusive founding-partner rate.</span></p>
            <p className={styles.standardRate}>Standard pricing: <span>$499/month</span></p>
          </div>

          <div className={styles.benefits}>
            <h3>Included</h3>
            <ul>
              <li><span className={styles.check} aria-hidden="true">✓</span><p><strong>100K images/month</strong><span> — Continuous PDQ matching and re-upload detection.</span></p></li>
              <li><span className={styles.check} aria-hidden="true">✓</span><p><strong>Pulse DINOv2 — Early Access</strong><span> — Historical library scanning and semantic similarity. Review-only, with agreed scan limits.</span></p></li>
              <li><span className={styles.check} aria-hidden="true">✓</span><p><strong>Direct founder onboarding</strong><span> — Personal integration support and priority feedback.</span></p></li>
            </ul>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.terms}>
            <h3>In return</h3>
            <p>One flexible weekly feedback call with your platform&apos;s admin or founder for audits, trials and product feedback.</p>
            <p>Your founding-partner rate continues while you actively participate. Calls can be rescheduled by mutual agreement.</p>
          </div>
          <a className={styles.cta} href="#contact">Apply for Founding Partner Access<span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>
  );
}
