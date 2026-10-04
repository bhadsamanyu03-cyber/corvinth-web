'use client';

/* Approved display images retain their composition; no visual transformations. */
/* eslint-disable @next/next/no-img-element */
import { useId, useState } from 'react';
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
  const matches = eligible.filter((asset) => asset.label.toLowerCase().includes(filter.toLowerCase()));
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const start = currentPage * PAGE_SIZE;
  const visible = matches.slice(start, start + PAGE_SIZE);
  return { eligible, matches, pages, currentPage, start, visible, filter, setFilter, setPage };
}

function InputExplanation({ mode, selected }) {
  const steps = mode === 'managed' ? ['Selected image', 'Presigned URL', 'Corvinth'] : ['Selected image', 'Corvinth SDK', 'Derived signals', 'Corvinth'];
  return <div className={styles.inputExplanation}>
    <ol aria-label="What Corvinth receives">{steps.map((step, index) => <li key={step}>{index > 0 && <span aria-hidden="true">→</span>}{step}</li>)}</ol>
    <p>{mode === 'managed'
      ? 'What Corvinth receives: a fresh, short-lived presigned URL for ' + (selected ? 'this exact selected image.' : 'the image you select.')
      : 'What Corvinth receives: derived signals computed by the Corvinth SDK. The image stays with your platform.'}</p>
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
  const action = state.stage === 'reference' ? 'Report image' : 'Check image';
  const progressMessage = {
    report: 'Reporting your image…', check: 'Checking your image…',
    reset: 'Changing your reference…', end: 'Ending your demo…',
  }[state.pending?.operation];
  const status = loading ? 'Loading your image library…'
    : !ready ? state.library === 'error' ? 'We couldn’t load your images. Please try again.' : 'No demo images are available to select right now.'
    : !state.session.runs_remaining ? 'You’ve used your demo allowance.'
    : busy && progressMessage ? progressMessage
    : !state.session.execution_available ? 'Image checks aren’t available right now.'
    : state.selection ? state.selection.label + ' selected.' : 'Select an image to continue.';

  return <div className={styles.imageWorkspace}>
    <div className={styles.library} data-demo-library>
      <div className={styles.libraryHeader}><h3>Image library {ready && <span>{gallery.eligible.length}</span>}</h3>
        {ready && gallery.eligible.length > PAGE_SIZE && <label className={styles.search}><span className={styles.srOnly}>Find a demo image</span><input type="search" placeholder="Find an image" value={gallery.filter} onChange={(event) => { gallery.setFilter(event.target.value); gallery.setPage(0); }} /></label>}
      </div>
      <div className={styles.galleryGrid} role="group" aria-label={state.stage === 'reference' ? 'Images to report' : 'Images to try as an upload'} aria-busy={loading}>
        {ready ? gallery.visible.map((asset) => <button key={asset.id} type="button" className={styles.asset} data-asset-id={asset.id}
          aria-pressed={state.selection?.id === asset.id} disabled={Boolean(state.pending)} onClick={() => demo.select(asset.id)}>
          <span className={styles.thumbnail}><AssetImage asset={asset} neutral={neutral} />{state.selection?.id === asset.id && <span className={styles.selectedMark} aria-hidden="true">✓</span>}</span>
          <span>{asset.label}</span>
        </button>) : Array.from({ length: PAGE_SIZE }, (_, index) => <div key={index} className={styles.emptyAsset} data-empty-slot="true"><div className={styles.thumbnail}><AssetImage emptyLabel="Demo asset" /></div><span>Demo asset <span className={styles.slotNumber}>{String(index + 1).padStart(2, '0')}</span></span></div>)}
      </div>
      {ready && !gallery.matches.length && <p className={styles.libraryMessage}>No images match. Try a different search.</p>}
      {!ready && <p className={styles.libraryMessage} role="status">{status}{state.library === 'error' && <button className={styles.textButton} disabled={busy} onClick={demo.retryAssets}>Reload images</button>}</p>}
      {ready && <div className={styles.pagination}><span role="status">{gallery.matches.length ? gallery.start + 1 : 0}–{Math.min(gallery.start + PAGE_SIZE, gallery.matches.length)} of {gallery.matches.length} images</span>
        {gallery.pages > 1 && <div><button aria-label="Previous images" disabled={!gallery.currentPage} onClick={() => gallery.setPage(gallery.currentPage - 1)}>←</button><span>{gallery.currentPage + 1} / {gallery.pages}</span><button aria-label="Next images" disabled={gallery.currentPage === gallery.pages - 1} onClick={() => gallery.setPage(gallery.currentPage + 1)}>→</button></div>}
      </div>}
    </div>
    <div className={styles.selection} data-demo-selection>
      <ImagePreview asset={state.selection} label={state.stage === 'reference' ? 'Selected image' : 'Attempted upload'} neutral={neutral} />
      <InputExplanation mode={state.mode} selected={Boolean(state.selection)} />
      <button className={styles.primary} disabled={!canRun} aria-describedby={statusId} onClick={state.stage === 'reference' ? demo.report : demo.check}>{['report', 'check'].includes(state.pending?.operation) ? 'Processing…' : action} <span aria-hidden="true">→</span></button>
      <p id={statusId} className={styles.selectionStatus} role="status">{ready ? status : 'Choose an available image to continue.'}</p>
    </div>
  </div>;
}
