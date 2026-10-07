'use client';

/* Approved display images retain their composition; no visual transformations. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useState } from 'react';
import { canExecute } from '../lib/demo-state.mjs';
import styles from './DemoWorkspace.module.css';

const PAGE_SIZE = 6;

export function AssetImage({ asset, neutral = false, emptyLabel = 'Select an image' }) {
  if (asset && !neutral) return <img src={asset.preview_url} alt={asset.alt} width="480" height="600" loading="lazy" />;
  return <div className={styles.imageSlot} aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><rect x="3.5" y="3.5" width="25" height="25" rx="4" /><circle cx="11" cy="11" r="2.5" /><path d="m4 23 7-7 5 5 5-8 7 10" /></svg><span>{asset ? 'Demo asset' : emptyLabel}</span></div>;
}

export function ImagePreview({ asset, label, neutral }) {
  return <figure className={styles.imagePreview} data-empty={!asset}>
    <div className={styles.previewHeading}><span>{label}</span><strong>{asset?.label || 'No image selected'}</strong></div>
    <div className={styles.imageFrame}><AssetImage asset={asset} neutral={neutral} /></div>
    <figcaption className={styles.srOnly}>{asset ? asset.label : 'Choose an image from the library.'}</figcaption>
  </figure>;
}

function useGallery(state) {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const eligible = state.assets.filter((asset) => state.stage === 'reference' ? asset.can_reference : asset.can_upload);
  const pageSize = state.stage === 'upload' ? 12 : PAGE_SIZE;
  const slides = state.stage === 'upload' && eligible.some((asset) => asset.slide)
    ? ['slide1', 'slide2', 'slide3'].map((slide) => eligible.filter((asset) => asset.slide === slide)) : null;
  const pages = slides ? slides.length : Math.max(1, Math.ceil(eligible.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const start = slides ? slides.slice(0, currentPage).reduce((count, items) => count + items.length, 0) : currentPage * pageSize;
  const pageAssets = slides ? slides[currentPage] : eligible.slice(start, start + pageSize);
  const matches = pageAssets.filter((asset) => asset.label.toLowerCase().includes(filter.toLowerCase()));
  const visible = matches;
  return { eligible, matches, pages, currentPage, start, visible, pageSize, filter, setFilter, setPage };
}

function InputExplanation({ mode, selected }) {
  const steps = mode === 'managed' ? ['Selected image', 'Presigned URL', 'Corvinth'] : ['Selected image', 'Corvinth SDK', 'Image hashes', 'Corvinth'];
  return <div className={styles.inputExplanation}>
    <ol aria-label="What Corvinth receives">{steps.map((step, index) => <li key={step}>{index > 0 && <span aria-hidden="true">→</span>}{step}</li>)}</ol>
    <p>{mode === 'managed'
      ? 'What Corvinth receives: a fresh, short-lived presigned URL for ' + (selected ? 'this exact selected image.' : 'the image you select.')
      : 'What Corvinth receives: locally computed image hashes from the Corvinth SDK. The image stays with your platform.'}</p>
  </div>;
}

function ActualInput({ asset, demo }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const input = demo.inputs?.[asset.id];
  const managed = demo.state.mode === 'managed';
  const current = input?.mode === demo.state.mode && input.expires_at * 1000 > now;
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [open]);
  async function view() {
    setBusy(true); setMessage('');
    try { await demo.viewInput(asset); setOpen(true); }
    catch { setMessage('We couldn’t retrieve this input. Try again.'); }
    finally { setBusy(false); }
  }
  async function copy() {
    try { const fresh = input?.expires_at * 1000 > Date.now() ? input : await demo.viewInput(asset);
      await navigator.clipboard.writeText(fresh.presigned_url); setMessage('Copied.'); }
    catch { setMessage('Couldn’t copy. Select and copy the URL below.'); }
  }
  return <div className={styles.actualInput}>
    <div><span>{asset.label}</span><button type="button" className={styles.textButton} disabled={busy || Boolean(demo.state.pending)} onClick={open ? () => setOpen(false) : view}>
      {busy ? 'Loading…' : open ? 'Hide input' : managed ? 'View presigned URL' : 'View image hashes'}</button></div>
    {open && input?.mode === demo.state.mode && <div className={styles.inputBody}>
      {managed ? <><p>Short-lived URL for this exact image. {current ? 'Report/Check uses this URL while it remains valid.' : 'Expired — reopen to refresh.'}</p>
        <code>{input.presigned_url}</code><button type="button" className={styles.textButton} onClick={copy} disabled={busy || Boolean(demo.state.pending)}>Copy URL</button></>
        : <><p>SDK 1.1.0 · precomputed from this exact image</p><pre>{JSON.stringify(input.hashes, null, 2)}</pre></>}
    </div>}
    {message && <p role="status">{message}</p>}
  </div>;
}

export default function DemoImageWorkspace({ demo, neutral }) {
  const { state } = demo;
  const gallery = useGallery(state);
  const ready = state.library === 'ready';
  const loading = state.pending?.operation === 'assets';
  const busy = Boolean(state.pending && !state.pending.silent);
  const statusId = useId();
  const canRun = canExecute(state);
  const chosen = state.stage === 'reference' ? (state.selection ? [state.selection] : []) : state.selections;
  const action = state.stage === 'reference' ? 'Report image' : chosen.length > 1 ? `Check ${chosen.length} images` : 'Check image';
  const progressMessage = {
    report: 'Reporting your image…', check: 'Checking your selected images…',
    reset: 'Changing your reference…', end: 'Ending your demo…',
  }[state.pending?.operation];
  const status = loading ? 'Loading your image library…'
    : !ready ? state.library === 'error' ? 'We couldn’t load your images. Please try again.' : 'No demo images are available to select right now.'
    : state.stage === 'upload' && !state.session.runs_remaining ? 'You’ve used your demo allowance.'
    : state.stage === 'upload' && chosen.length > state.session.runs_remaining ? `Select at most ${state.session.runs_remaining} image${state.session.runs_remaining === 1 ? '' : 's'} for your remaining allowance.`
    : busy && progressMessage ? progressMessage
    : !state.session.execution_available ? 'Image checks aren’t available right now.'
    : state.selection ? state.stage === 'reference' ? state.selection.label + ' selected. Reporting uses no runs.'
      : `${chosen.length} selected · ${chosen.length} run${chosen.length > 1 ? 's' : ''}.` : 'Select an image to continue.';

  return <div className={styles.imageWorkspace}>
    <div className={styles.library} data-demo-library>
      <div className={styles.libraryHeader}><h3>{state.stage === 'reference' ? 'Original images' : 'Re-upload images'} {ready && <span>{gallery.eligible.length}</span>}</h3>
        {ready && gallery.eligible.length > gallery.pageSize && <label className={styles.search}><span className={styles.srOnly}>Find a demo image</span><input type="search" placeholder="Find an image" value={gallery.filter} onChange={(event) => gallery.setFilter(event.target.value)} /></label>}
      </div>
      <div className={styles.galleryGrid} data-picker={state.stage} role="group" aria-label={state.stage === 'reference' ? 'Images to report' : 'Images to try as an upload'} aria-busy={loading}>
        {ready ? gallery.visible.map((asset) => <button key={asset.id} type="button" className={styles.asset} data-asset-id={asset.id}
          aria-pressed={chosen.some((item) => item.id === asset.id)} disabled={Boolean(state.pending) || (state.stage === 'upload' && chosen.length === 3 && !chosen.some((item) => item.id === asset.id))} onClick={() => demo.select(asset.id)}>
          <span className={styles.thumbnail}><AssetImage asset={asset} neutral={neutral} />{chosen.some((item) => item.id === asset.id) && <span className={styles.selectedMark} aria-hidden="true">✓</span>}</span>
          <span>{asset.label}</span>
        </button>) : Array.from({ length: PAGE_SIZE }, (_, index) => <div key={index} className={styles.emptyAsset} data-empty-slot="true"><div className={styles.thumbnail}><AssetImage emptyLabel="Demo asset" /></div><span>Demo asset <span className={styles.slotNumber}>{String(index + 1).padStart(2, '0')}</span></span></div>)}
      </div>
      {ready && !gallery.matches.length && <p className={styles.libraryMessage}>No images match. Try a different search.</p>}
      {!ready && <p className={styles.libraryMessage} role="status">{status}{state.library === 'error' && <button className={styles.textButton} disabled={busy} onClick={demo.retryAssets}>Reload images</button>}</p>}
      {ready && <div className={styles.pagination}><span role="status">{gallery.visible.length} images shown · {gallery.eligible.length} total</span>
        {gallery.pages > 1 && <div><button aria-label="Previous images" disabled={!gallery.currentPage} onClick={() => gallery.setPage(gallery.currentPage - 1)}>←</button><span>{gallery.currentPage + 1} / {gallery.pages}</span><button aria-label="Next images" disabled={gallery.currentPage === gallery.pages - 1} onClick={() => gallery.setPage(gallery.currentPage + 1)}>→</button></div>}
      </div>}
    </div>
    <div className={styles.selection} data-demo-selection>
      <ImagePreview asset={state.selection} label={state.stage === 'reference' ? 'Selected image' : 'Attempted upload'} neutral={neutral} />
      {state.stage === 'upload' && <div className={styles.selectedUploads} aria-label="Selected uploads"><span>{chosen.length} / 3 selected</span>{chosen.map((asset) => <button key={asset.id} type="button" disabled={busy} onClick={() => demo.select(asset.id)} aria-label={'Remove ' + asset.label}>{asset.label} <span aria-hidden="true">×</span></button>)}</div>}
      <InputExplanation mode={state.mode} selected={Boolean(state.selection)} />
      {!neutral && chosen.map((asset) => <ActualInput key={asset.id + state.mode} asset={asset} demo={demo} />)}
      <button className={styles.primary} disabled={!canRun} aria-describedby={statusId} onClick={state.stage === 'reference' ? demo.report : demo.check}>{['report', 'check'].includes(state.pending?.operation) ? 'Processing…' : action} <span aria-hidden="true">→</span></button>
      <p id={statusId} className={styles.selectionStatus} role="status">{ready ? status : 'Choose an available image to continue.'}</p>
    </div>
  </div>;
}
