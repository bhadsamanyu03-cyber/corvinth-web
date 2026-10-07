'use client';

import { ImagePreview } from './DemoImageWorkspace';
import { getDinoDemoBand, getDemoResultSummary } from '../lib/demo-result-presentation.mjs';
import styles from './DemoWorkspace.module.css';

const classifications = {
  EXACT: ['EXACT', 'Corvinth returned an exact match.'],
  FUZZY: ['FUZZY', 'Corvinth returned a fuzzy match.'],
  NEAR_MISS: ['NEARMISS', 'Corvinth returned a near-miss result.'],
  CLEAN: ['CLEAN', 'Corvinth returned no match for this check.'],
};

function HashDetails({ pdq }) {
  return <details className={styles.vectorDetails}><summary>Full PDQ hash sets · View details</summary>
    {['reference', 'attempted'].map((side) => <div key={side}><p>{side === 'reference' ? 'Reported image' : 'Attempted image'}</p>
      {['standard', 'normalized'].map((lane) => <div key={lane}><p>{lane} · 8 dihedral hashes</p>
        <pre>{pdq[side + '_hashes'][lane].join('\n')}</pre></div>)}</div>)}
  </details>;
}

export default function DemoResult({ entry, reference, neutral, index, total }) {
  const result = entry.result;
  const dinoBand = result?.dino ? getDinoDemoBand(result.dino.cosine_similarity) : null;
  const summary = getDemoResultSummary(result?.classification, dinoBand);
  return <article className={styles.resultEntry} data-result-asset={entry.asset_id}>
    {total > 1 && <h2 className={styles.resultTitle}>{index + 1} / {total} · {entry.asset?.label}</h2>}
    {result ? <>
      {summary && <p className={styles.resultSummary} data-demo-result-summary>{summary}</p>}
      <div className={result.dino ? styles.resultLanes : styles.pdqOnly} data-classification={result.classification}>
        <div className={styles.resultLane}>
          <p className={styles.eyebrow}>{neutral ? 'Simulated PDQ classification' : 'PDQ classification'}</p>
          <p>{entry.asset?.label}</p>
          <strong>{classifications[result.classification][0]}</strong>
          <p>{classifications[result.classification][1]}</p>
          {result.pdq && <>
            <p className={styles.distance}>Hamming distance: <b>{result.pdq.hamming_distance}</b> / 256</p>
            <p>{result.pdq.lane} lane · {result.pdq.pair_kind === 'winning' ? 'Winning hash pair' : 'Closest hash pair (not a match)'}</p>
            <dl className={styles.hashPair}><div><dt>Reported image hash</dt><dd><code>{result.pdq.reference_hash}</code></dd></div>
              <div><dt>Attempted image hash</dt><dd><code>{result.pdq.attempted_hash}</code></dd></div></dl>
            <HashDetails pdq={result.pdq} />
          </>}
        </div>
        {result.dino && <div className={styles.resultLane}>
          <div className={styles.dinoHeading}>
            <p className={styles.eyebrow}>DINOv2 · semantic similarity</p>
            <span className={styles.demoInterpretation}>Demo interpretation</span>
          </div>
          {dinoBand && <strong data-demo-similarity-band={dinoBand}>{dinoBand}</strong>}
          <p>UI-only similarity band, not a production classification.</p>
          <p className={styles.similarityEvidence}>Cosine similarity: <code>{result.dino.cosine_similarity}</code></p>
          <p>{result.dino.profile.model_version}</p>
          <p>{result.dino.profile.algorithm_version} · {result.dino.profile.configuration_version}</p>
          <details className={styles.vectorDetails}><summary>384-d vector · View vector</summary>
            <p>Attempted image</p><pre>{JSON.stringify(result.dino.candidate_vector, null, 2)}</pre>
            <p>Reported image</p><pre>{JSON.stringify(result.dino.reference_vector, null, 2)}</pre>
          </details>
        </div>}
      </div>
      <div className={styles.comparison}><ImagePreview asset={reference.asset} label="Reported image" neutral={neutral} /><ImagePreview asset={entry.asset} label="Attempted upload" neutral={neutral} /></div>
      <details className={styles.requestDetails}><summary>Request details</summary><dl>
        <div><dt>Compute mode</dt><dd>{result.mode === 'managed' ? 'Managed compute' : 'Customer compute'}</dd></div>
        <div><dt>Classification</dt><dd>{result.classification}</dd></div><div><dt>Request</dt><dd>{result.request_id}</dd></div>
      </dl><details><summary>Response fields</summary><pre>{JSON.stringify(result, null, 2)}</pre></details></details>
    </> : <div className={styles.error} role="alert">We couldn’t complete the check for {entry.asset?.label}. This admitted attempt used one run; no result is being shown.</div>}
  </article>;
}
