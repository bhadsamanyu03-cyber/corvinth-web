import test from 'node:test';
import assert from 'node:assert/strict';
import { getDinoDemoBand, getDemoResultSummary } from '../app/lib/demo-result-presentation.mjs';

test('DINO demo bands use the exact returned score, with inclusive lower boundaries', () => {
  for (const [score, band] of [
    [1, 'MATCH'], [0.85, 'MATCH'], [0.84999, 'NEAR MISS'],
    [0.70, 'NEAR MISS'], [0.69999, 'CLEAN'], [0, 'CLEAN'], [-1, 'CLEAN'],
  ]) assert.equal(getDinoDemoBand(score), band, String(score));
});

test('missing or invalid similarity is never presented as a clean result', () => {
  for (const score of [undefined, null, '0.9', NaN, Infinity, -Infinity]) {
    assert.equal(getDinoDemoBand(score), null);
    assert.equal(getDemoResultSummary('EXACT', getDinoDemoBand(score)), null);
  }
});

test('summary distinguishes authoritative PDQ from the DINO demo similarity range', () => {
  assert.equal(getDemoResultSummary('EXACT', 'MATCH'), 'PDQ matched; DINOv2 similarity also falls in the demo match range.');
  assert.equal(getDemoResultSummary('FUZZY', 'CLEAN'), 'PDQ matched; DINOv2 similarity falls in the clean range.');
  assert.equal(getDemoResultSummary('CLEAN', 'MATCH'), 'PDQ returned no match; DINOv2 similarity falls in the demo match range.');
  assert.equal(getDemoResultSummary('CLEAN', 'CLEAN'), 'PDQ returned no match; DINOv2 similarity falls in the clean range.');
  for (const classification of ['EXACT', 'FUZZY', 'NEAR_MISS', 'CLEAN']) {
    assert.match(getDemoResultSummary(classification, 'NEAR MISS'), /DINOv2 similarity falls in the near-miss range\.$/);
    for (const band of ['MATCH', 'NEAR MISS', 'CLEAN']) {
      assert.doesNotMatch(getDemoResultSummary(classification, band), /DINOv2 (detected|classified|matched)/);
    }
  }
  assert.equal(getDemoResultSummary('NEAR_MISS', 'MATCH'), 'PDQ returned a near-miss result; DINOv2 similarity falls in the demo match range.');
});

test('PDQ-only and failed results get no invented two-lane summary', () => {
  assert.equal(getDemoResultSummary('EXACT', null), null);
  assert.equal(getDemoResultSummary(undefined, 'MATCH'), null);
  assert.equal(getDemoResultSummary('UNKNOWN', 'CLEAN'), null);
  assert.equal(getDemoResultSummary('CLEAN', 'UNKNOWN'), null);
});

test('presentation reads real result fields without adding classification or thresholds to them', () => {
  const result = Object.freeze({ classification: 'CLEAN', dino: Object.freeze({ cosine_similarity: 0.8734 }) });
  assert.equal(getDinoDemoBand(result.dino.cosine_similarity), 'MATCH');
  assert.equal(getDemoResultSummary(result.classification, getDinoDemoBand(result.dino.cosine_similarity)),
    'PDQ returned no match; DINOv2 similarity falls in the demo match range.');
  assert.deepEqual(result, { classification: 'CLEAN', dino: { cosine_similarity: 0.8734 } });
});
