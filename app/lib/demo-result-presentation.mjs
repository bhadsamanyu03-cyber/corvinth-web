// Demo UI only. These bands are not a qualified DINO matching policy and must
// never be added to the backend result or used to authorize matching actions.
export function getDinoDemoBand(cosineSimilarity) {
  if (!Number.isFinite(cosineSimilarity)) return null;
  if (cosineSimilarity >= 0.85) return 'MATCH';
  if (cosineSimilarity >= 0.75) return 'NEAR MISS';
  return 'CLEAN';
}

export function getDemoResultSummary(pdqClassification, dinoBand) {
  const pdq = {
    EXACT: 'PDQ matched',
    FUZZY: 'PDQ matched',
    NEAR_MISS: 'PDQ returned a near-miss result',
    CLEAN: 'PDQ returned no match',
  }[pdqClassification];
  const range = {
    MATCH: 'demo match',
    'NEAR MISS': 'near-miss',
    CLEAN: 'clean',
  }[dinoBand];
  if (!pdq || !range) return null;
  const also = dinoBand === 'MATCH' && ['EXACT', 'FUZZY'].includes(pdqClassification) ? ' also' : '';
  return `${pdq}; DINOv2 similarity${also} falls in the ${range} range.`;
}
