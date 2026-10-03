'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { liveDemoClient } from '../lib/demo-client.mjs';
import { DemoError, readSession } from '../lib/demo-contract.mjs';
import { liveTokenRequests, readTokenRequest, readTokenRequestReceipt } from '../lib/demo-access.mjs';
import styles from './DemoAccess.module.css';

const messages = {
  demo_token_invalid: 'This token is invalid, expired, or has reached its access limit. Check the token you received.',
  demo_invalid_request: 'Paste the complete demo token supplied by Corvinth.',
  demo_session_invalid: 'Your demo access has expired. Enter your token again.',
  demo_rate_limited: 'The demo has reached its access limit. Please try again later.',
  demo_origin_rejected: 'Demo access is unavailable from this page address.',
  demo_invalid_response: 'We couldn’t confirm your access. Please try again.',
  demo_unavailable: 'The demo is temporarily unavailable. Please try again.',
  demo_request_invalid: 'Enter a valid work email and a full company URL, including https://.',
  demo_request_unavailable: 'Token requests aren’t connected yet. Nothing was submitted. Please try again later.',
  demo_request_unconfirmed: 'We couldn’t confirm delivery. Your request has not been marked as sent.',
};

export default function DemoAccess({ onReady, adapter = liveDemoClient, requests = liveTokenRequests, resume = true, development = false }) {
  const [view, setView] = useState('token');
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const active = useRef(null);
  const token = useRef(null);
  const heading = useRef(null);
  const id = useId();

  const run = useCallback(async (operation, input) => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setPending(operation); setError('');
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      if (operation === 'request') {
        readTokenRequestReceipt(await requests.submit({ ...readTokenRequest(input), signal: controller.signal }));
        if (active.current === controller && !controller.signal.aborted) setSent(true);
      } else {
        const session = readSession(await (operation === 'resume'
          ? adapter.getSession({ signal: controller.signal })
          : adapter.startSession({ token: input, signal: controller.signal })) || { status: 'inactive' });
        if (operation === 'start' && !session) throw new DemoError('demo_token_invalid');
        if (session && Date.parse(session.expires_at) <= Date.now()) throw new DemoError('demo_session_invalid');
        if (session && active.current === controller && !controller.signal.aborted) onReady();
      }
    } catch (failure) {
      if (active.current === controller) setError(messages[failure.code] || (operation === 'request' ? messages.demo_request_unconfirmed : messages.demo_unavailable));
    } finally {
      clearTimeout(timeout);
      if (active.current === controller) { active.current = null; setPending(null); }
    }
  }, [adapter, requests, onReady]);

  useEffect(() => {
    let cancelled = false;
    // Defer until after Strict Mode's mount probe; do not redeem twice.
    if (resume) queueMicrotask(() => { if (!cancelled) run('resume'); });
    return () => { cancelled = true; active.current?.abort(); active.current = null; };
  }, [resume, run]);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [view]);

  function redeem(event) {
    event.preventDefault();
    const value = token.current.value.trim(); token.current.value = '';
    run('start', value);
  }
  function request(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    run('request', { work_email: values.get('work_email'), company_url: values.get('company_url') });
  }
  function switchView(next) { setView(next); setError(''); }

  return <div className={styles.access} aria-busy={Boolean(pending)}>
    <div className={styles.choices} role="group" aria-label="Demo access options">
      <button aria-pressed={view === 'token'} disabled={Boolean(pending)} onClick={() => switchView('token')}>I have a token</button>
      <button aria-pressed={view === 'request'} disabled={Boolean(pending)} onClick={() => switchView('request')}>Request a token</button>
    </div>
    {view === 'token' ? <form onSubmit={redeem}>
      <h2 ref={heading} tabIndex={-1}>Enter demo token</h2>
      <label className={styles.srOnly} htmlFor={`${id}-token`}>Demo token</label>
      <input ref={token} id={`${id}-token`} name="token" type="password" required maxLength={100} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="Paste your demo token" disabled={Boolean(pending)} />
      <button className={styles.primary} disabled={Boolean(pending)} type="submit">{pending === 'resume' ? 'Checking your access…' : pending ? 'Opening demo…' : 'Start demo'} <span aria-hidden="true">→</span></button>
      <p className={styles.note}>Your invitation opens a private, time-limited demo.</p>
    </form> : sent ? <div className={styles.receipt} role="status"><h2>Request sent.</h2><p>I’ll send your demo token to your work email.</p>{development && <p className={styles.note}>Development fixture only. No email was sent.</p>}</div>
    : <form onSubmit={request}>
      <h2 ref={heading} tabIndex={-1}>Request a demo token</h2>
      <label htmlFor={`${id}-email`}>Work email</label>
      <input id={`${id}-email`} name="work_email" type="email" autoComplete="email" required maxLength={254} placeholder="you@company.com" disabled={Boolean(pending)} />
      <label htmlFor={`${id}-url`}>Company / platform URL</label>
      <input id={`${id}-url`} name="company_url" type="url" autoComplete="url" required maxLength={2048} placeholder="https://your-platform.com" disabled={Boolean(pending)} aria-describedby={!requests.available ? `${id}-availability` : undefined} />
      <button className={styles.primary} disabled={Boolean(pending)} type="submit">{pending ? 'Sending…' : 'Request demo token'} <span aria-hidden="true">→</span></button>
      {!requests.available && <p className={styles.note} id={`${id}-availability`}>Token requests aren’t connected yet. These details will not be sent.</p>}
    </form>}
    {error && <p className={styles.error} role="alert">{error}</p>}
  </div>;
}
