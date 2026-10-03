export const initialDemoState = {
  stage: 'entry', session: null, mode: '', reference: null, selection: null, upload: null,
  result: null, assets: [], manifest_version: null, library: 'idle', pending: null, error: null, notice: '',
};

function clearCycle(state) {
  return { ...state, mode: '', reference: null, selection: null, upload: null, result: null };
}

export function demoReducer(state, event) {
  if (event.type === 'SESSION_EXPIRED') return { ...initialDemoState, stage: 'gate', error: 'demo_session_invalid' };
  if (event.type === 'OPEN') return { ...state, stage: 'gate', error: null, notice: '' };
  if (event.type === 'CLOSE' && !state.session && !state.pending) return { ...initialDemoState };
  if (event.type === 'BEGIN') {
    if (state.pending) return state;
    return { ...state, pending: { id: event.id, operation: event.operation, silent: event.silent }, error: null };
  }
  if (event.type === 'MODE' && !state.pending && state.session && !state.reference
      && ['mode', 'reference'].includes(state.stage) && ['managed', 'customer'].includes(event.mode)) {
    return { ...clearCycle(state), mode: event.mode, stage: 'reference', error: null,
      assets: [], manifest_version: null, library: 'loading' };
  }
  if (event.type === 'CHANGE_MODE' && !state.pending && !state.reference && state.session) {
    return { ...clearCycle(state), stage: 'mode', error: null };
  }
  if (event.type === 'SELECT' && !state.pending && state.library === 'ready'
      && ['reference', 'upload'].includes(state.stage)) {
    const asset = state.assets.find((item) => item.id === event.id);
    if (!asset || !(state.stage === 'reference' ? asset.can_reference : asset.can_upload)) return state;
    return { ...state, selection: asset, error: null };
  }
  if (event.type === 'TRY_UPLOAD' && !state.pending && state.reference && state.stage === 'result') {
    return { ...state, stage: 'upload', selection: null, upload: null, result: null, error: null };
  }
  if (!state.pending || event.id !== state.pending.id) return state;
  const operation = state.pending.operation;
  if (event.type === 'FAIL') {
    if (event.error === 'demo_session_invalid') return { ...initialDemoState, stage: 'gate', error: event.error };
    if (operation === 'session' && state.session) return { ...initialDemoState, stage: 'gate', error: event.error };
    return { ...state, pending: null, error: event.error,
      ...(operation === 'assets' ? { library: 'error' } : {}) };
  }
  if (event.type !== 'DONE') return state;
  const next = { ...state, pending: null, error: null };
  if (['report', 'check', 'reset'].includes(operation) && state.session && event.data?.session
      && (event.data.session.max_runs !== state.session.max_runs
        || event.data.session.expires_at !== state.session.expires_at
        || event.data.session.runs_used < state.session.runs_used)) {
    return { ...next, error: 'demo_invalid_response' };
  }
  if (['session', 'start'].includes(operation)) {
    if (!event.data) return { ...initialDemoState, stage: 'gate', error: state.session ? 'demo_session_invalid' : null };
    if (state.session && (event.data.expires_at !== state.session.expires_at || event.data.max_runs !== state.session.max_runs)) {
      return { ...initialDemoState, session: event.data, stage: 'mode' };
    }
    if (state.session && event.data.runs_used < state.session.runs_used) return { ...initialDemoState, stage: 'gate', error: 'demo_invalid_response' };
    return { ...next, session: event.data, stage: state.session ? state.stage : 'mode' };
  }
  if (operation === 'end') return { ...initialDemoState, stage: 'gate', notice: 'Your demo session has ended.' };
  if (operation === 'assets') return { ...next, assets: event.data.assets, manifest_version: event.data.manifest_version,
    library: event.data.available ? 'ready' : 'unavailable' };
  if (operation === 'report' && state.selection && !state.reference) {
    return { ...next, reference: { ...event.data.reference, asset: state.selection },
      session: event.data.session, stage: 'upload', selection: null };
  }
  if (operation === 'check' && state.reference && state.selection) {
    return { ...next, result: event.data.result, upload: state.selection, session: event.data.session, stage: 'result' };
  }
  if (operation === 'reset') return { ...clearCycle(next), session: event.data.session, stage: 'mode' };
  return state;
}

export function canExecute(state) {
  return Boolean(state.session?.execution_available && state.session.runs_remaining > 0
    && state.library === 'ready' && state.selection && !state.pending);
}
