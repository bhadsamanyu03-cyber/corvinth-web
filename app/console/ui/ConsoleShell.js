'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { consoleRequest } from './data';
import { Icon, Field } from './primitives';

const SessionContext = createContext(null);
export const useConsoleSession = () => useContext(SessionContext);
const navigation = [['/console', 'Overview', 'grid'], ['/console/pulse', 'Pulse', 'scan'], ['/console/detections', 'Detections', 'shield'], ['/console/cases', 'Reported cases', 'cases'], ['/console/scans', 'Historical scans', 'scan'], ['/console/api', 'API Reference', 'code'], ['/console/integration', 'Integration', 'connect']];

function Brand() { return <Link href="/" className="cc-brand" aria-label="Corvinth homepage"><svg viewBox="0 0 32 36" aria-hidden="true"><path d="m16 0 16 9v10l-8-4v-2l-8-4-8 4v10l8 4 8-4v-2l8-4v10l-16 9L0 27V9z" fill="currentColor"/></svg><span>Corvinth</span></Link>; }

export default function ConsoleShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sessionRevision = useRef(0);
  const mutationPending = useRef(false);
  useEffect(() => {
    let alive = true;
    const check = async () => {
      if (mutationPending.current) return;
      const revision = sessionRevision.current;
      try { const data = await consoleRequest('session'); if (alive && revision === sessionRevision.current) { setSession(data.status === 'active' ? data : null); setError(''); } }
      catch (err) { if (alive && revision === sessionRevision.current) { setSession(null); setError(err.message); } }
      finally { if (alive) setChecking(false); }
    };
    check();
    const interval = setInterval(check, 60000);
    const resume = () => { if (document.visibilityState === 'visible') check(); };
    const expire = () => { sessionRevision.current += 1; setSession(null); setError('Your session has ended. Enter a new invitation to continue.'); };
    window.addEventListener('corvinth-console-expired', expire);
    window.addEventListener('focus', resume);
    document.addEventListener('visibilitychange', resume);
    return () => { alive = false; clearInterval(interval); window.removeEventListener('corvinth-console-expired', expire); window.removeEventListener('focus', resume); document.removeEventListener('visibilitychange', resume); };
  }, []);
  useEffect(() => { document.querySelector('.cc-heading h1')?.focus(); }, [pathname]);
  async function login(event) {
    event.preventDefault(); setBusy(true); setError('');
    sessionRevision.current += 1; mutationPending.current = true;
    const form = event.currentTarget;
    const token = new FormData(form).get('token').trim();
    try { const data = await consoleRequest('session', { method: 'POST', body: { token } }); form.reset(); setSession(data); router.replace('/console'); }
    catch (err) { setError(err.message); }
    finally { mutationPending.current = false; setBusy(false); }
  }
  async function logout() {
    setBusy(true); setError('');
    sessionRevision.current += 1; mutationPending.current = true;
    try { await consoleRequest('session', { method: 'DELETE' }); setSession(null); router.replace('/console/login'); }
    catch (err) { setError(err.message); }
    finally { mutationPending.current = false; setBusy(false); }
  }
  if (checking || !session) return <div className="cc-shell cc-auth"><header><Brand/><span className="cc-eyebrow">Customer console</span></header><main className="cc-login"><div className="cc-icon-tile"><Icon name="shield"/></div><p className="cc-eyebrow">Your platform. Your decisions.</p><h1>Welcome to your<br/>control room.</h1><p>Report content, follow cases, and keep your integration in view.</p>{checking ? <p role="status">Checking your session…</p> : <form onSubmit={login}><Field label="Console invitation" hint="Use the platform invitation issued to you by Corvinth."><input name="token" type="password" autoComplete="off" required maxLength={100} placeholder="Enter your invitation" disabled={busy}/></Field>{error && <p className="cc-error" role="alert">{error}</p>}<button className="cc-button cc-primary" disabled={busy}>{busy ? 'Signing in…' : 'Open console'}<Icon name="arrow"/></button><p className="cc-help">Need access? <a href="mailto:support@corvinth.com">Contact Corvinth</a></p></form>}</main><footer>Corvinth records the evidence. Your platform decides what happens next.</footer></div>;
  return <SessionContext.Provider value={session}><div className="cc-shell"><a className="cc-skip" href="#console-main">Skip to content</a><aside className="cc-sidebar"><Brand/><p className="cc-sidebar-label">Customer console</p><nav aria-label="Console navigation">{navigation.map(([href, title, icon]) => <Link href={href} key={href} aria-current={(href === '/console' ? pathname === href : pathname.startsWith(href)) ? 'page' : undefined}><Icon name={icon}/>{title}</Link>)}</nav><div className="cc-sidebar-bottom"><span className="cc-eyebrow">Evidence into action</span><p>Detection by Corvinth.<br/>Decisions by your team.</p><Link href="/console/report/pdq" className="cc-button cc-primary">Report content <span aria-hidden="true">+</span></Link></div></aside><div className="cc-body"><header className="cc-topbar"><div><span className="cc-platform-mark">{session.platform_name?.slice(0, 1).toUpperCase()}</span><strong>{session.platform_name}</strong><span className="cc-topbar-divider"/><span>Platform workspace</span></div><button className="cc-text-button" onClick={logout} disabled={busy}>{busy ? 'Signing out…' : 'Sign out'} ↗</button></header><main id="console-main" className="cc-main">{error && <p className="cc-error" role="alert">{error}</p>}{children}</main><footer className="cc-footer"><span>Corvinth customer console</span><span>Platform-scoped access · <Link href="/console/integration">Integration details ↗</Link></span></footer></div></div></SessionContext.Provider>;
}
