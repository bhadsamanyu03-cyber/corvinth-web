'use client';

import { useEffect, useRef, useState } from 'react';
import { label } from './data';

export function Icon({ name = 'grid', ...props }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    cases: <><path d="M4 5h6l2 3h8v12H4z"/><path d="M8 12h8M8 16h5"/></>,
    scan: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M3 12h18"/><path d="M8 8h8v8H8z"/></>,
    code: <><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 20"/></>,
    connect: <><path d="M8 8V3m8 5V3M6 8h12v4a6 6 0 0 1-12 0zm6 10v3"/></>,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/></>,
    pulse: <><path d="M2 12h5l3-7 4 14 3-7h5"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.grid}</svg>;
}

export function Heading({ eyebrow, title, children, action }) {
  return <header className="cc-heading"><div>{eyebrow && <p className="cc-eyebrow">{eyebrow}</p>}<h1 tabIndex={-1}>{title}</h1>{children && <p className="cc-subtitle">{children}</p>}</div>{action}</header>;
}
export function Badge({ value }) { return <span className="cc-badge" data-state={value}>{label(value)}</span>; }
export function Empty({ title, children, icon = 'cases' }) { return <div className="cc-empty"><Icon name={icon}/><h3>{title}</h3>{children && <p>{children}</p>}</div>; }
export function DataState({ resource, children, empty, compact = false }) {
  if (resource.loading) return <div className={`cc-loading ${compact ? 'cc-compact' : ''}`} role="status"><span className="cc-spinner"/>Loading…</div>;
  if (resource.error) return <div className="cc-error" role="alert"><strong>{resource.error.status === 403 ? 'Access restricted' : 'Unable to load this information'}</strong><p>{resource.error.message}</p><button className="cc-text-button" onClick={resource.reload}>Try again</button></div>;
  if (!resource.data) return empty || null;
  return children(resource.data);
}
export function Pagination({ skip, next, onChange }) { return <nav className="cc-pagination" aria-label="Pagination"><button className="cc-button cc-secondary" disabled={!skip} onClick={() => onChange(Math.max(0, skip - 20))}>← Previous</button><span>Page {Math.floor(skip / 20) + 1}</span><button className="cc-button cc-secondary" disabled={next === null || next === undefined} onClick={() => onChange(next)}>Next →</button></nav>; }
export function Field({ label: title, hint, children }) { return <label className="cc-field"><span>{title}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function Facts({ entries }) { return <dl className="cc-facts">{entries.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value ?? 'Not available'}</dd></div>)}</dl>; }

export function ConfirmAction({ title, description, button, onConfirm, reason = false, disabled = false }) {
  const dialog = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const element = dialog.current;
    const prevent = event => { if (busy) event.preventDefault(); };
    element?.addEventListener('cancel', prevent);
    return () => element?.removeEventListener('cancel', prevent);
  }, [busy]);
  async function confirm(event) {
    event.preventDefault(); setBusy(true); setError('');
    const form = event.currentTarget;
    try { await onConfirm(new FormData(form).get('reason')); dialog.current?.close(); form.reset(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <><button className="cc-button cc-danger" disabled={disabled} onClick={() => { setError(''); dialog.current.showModal(); }}>{button}</button><dialog ref={dialog} className="cc-dialog" aria-label={title}><form onSubmit={confirm}><p className="cc-eyebrow">Confirm action</p><h2>{title}</h2><p>{description}</p>{reason && <Field label="Reason"><textarea name="reason" required minLength={10} maxLength={2000} rows={3}/></Field>}{error && <p className="cc-error" role="alert">{error}</p>}<div className="cc-actions"><button type="button" className="cc-button cc-secondary" disabled={busy} onClick={() => dialog.current.close()}>Keep unchanged</button><button className="cc-button cc-danger" disabled={busy}>{busy ? 'Submitting…' : button}</button></div></form></dialog></>;
}
