'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import DemoAccess from './DemoAccess';
import styles from './DemoPreview.module.css';

export default function DemoPreview() {
  const [opened, setOpened] = useState(false);
  const access = useRef(null);
  const router = useRouter();
  const enter = useCallback(() => router.push('/demo'), [router]);
  useEffect(() => { if (opened) access.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' }); }, [opened]);

  return <section id="demo" aria-labelledby="demo-title">
    <div className={`inner ${styles.invitation}`}>
      <div className={styles.doorway}>
        <div className={styles.copy}>
          <p className="section-tag">Live API demo</p>
          <h2 id="demo-title">See Corvinth work.</h2>
          <p className={styles.description}>One reported image. Another upload.<br />See what Corvinth detects.</p>
        </div>
        <div className={styles.action}>
          <button id="demo-start" className={styles.start} aria-expanded={opened} aria-controls="demo-access" onClick={() => setOpened(!opened)}>{opened ? 'Close access' : 'Try Corvinth'} <span aria-hidden="true">{opened ? '−' : '→'}</span></button>
          <p>A private demo. Your invitation.</p>
        </div>
        <ol className={styles.story} aria-label="Inside the demo"><li><span>01</span>Report an image</li><li><span>02</span>Try a re-upload</li><li><span>03</span>See the result</li></ol>
      </div>
      {opened && <div ref={access} className={styles.accessPanel} id="demo-access"><div className={styles.accessIntro}><p className={styles.eyebrow}>Step inside</p><h3>Your invitation.<br />A closer look.</h3><p>Have an invitation? Enter your token.<br />Need one? Request it here.</p></div><DemoAccess onReady={enter} /></div>}
    </div>
  </section>;
}
