'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { DemoError, readBatch, readCatalogue, readInput, readReference, readResult, readSession } from '../lib/demo-contract.mjs';
import { canExecute, demoReducer, initialDemoState } from '../lib/demo-state.mjs';

export default function useDemo(adapter, { autoOpen = false } = {}) {
  const [state, dispatch] = useReducer(demoReducer, { ...initialDemoState, stage: autoOpen ? 'checking' : 'entry' });
  const running = useRef(null);
  const sequence = useRef(0);
  const attempt = useRef(null);
  const [inputs, setInputs] = useState({});
  const inputCache = useRef({});
  const sessionIdentity = useRef('');
  const getInput = useCallback(async (context, signal, force = false) => {
    const cacheKey = JSON.stringify([sessionIdentity.current, context]);
    const cached = inputCache.current[cacheKey];
    if (!force && cached?.expires_at * 1000 > Date.now() + 10000) return cached;
    const data = readInput((await adapter.getInput({ ...context, signal })).input, context);
    inputCache.current[cacheKey] = data;
    setInputs((current) => ({ ...current, [context.asset_id]: data }));
    return data;
  }, [adapter]);

  const perform = useCallback(async (operation, context = {}, silent = false) => {
    if (running.current) return;
    const id = ++sequence.current;
    const controller = new AbortController();
    running.current = { id, controller };
    dispatch({ type: 'BEGIN', id, operation, silent });
    const timeout = setTimeout(() => controller.abort(new DemoError('demo_unavailable')),
      (['session', 'start', 'end'].includes(operation) ? 12000 : 60000)
        + (adapter.startupWaitSupported ? 180000 : 0));
    try {
      let operationKey;
      if (['report', 'check', 'reset'].includes(operation)) {
        const intent = JSON.stringify({ operation, ...context });
        if (attempt.current?.intent !== intent) attempt.current = { intent, key: crypto.randomUUID() };
        operationKey = attempt.current.key;
      }
      const options = { ...context, ...(operationKey ? { operation_key: operationKey } : {}), signal: controller.signal };
      if (['report', 'check'].includes(operation) && adapter.getInput) {
        const ids = context.asset_ids || [context.asset_id];
        const receipts = await Promise.all(ids.map((asset_id) => getInput({ asset_id, mode: context.mode,
          manifest_version: context.manifest_version }, controller.signal)));
        options.input_tokens = Object.fromEntries(receipts.map((item) => [item.asset_id, item.input_token]));
      }
      let data;
      if (operation === 'session') data = await adapter.getSession(options);
      if (operation === 'start') data = await adapter.startSession(options);
      if (operation === 'end') data = await adapter.endSession(options);
      if (['session', 'start'].includes(operation)) {
        if (data) data = readSession(data);
        const identity = data?.expires_at || '';
        if (sessionIdentity.current !== identity) { inputCache.current = {}; setInputs({}); }
        sessionIdentity.current = identity;
      }
      if (operation === 'assets') data = readCatalogue(await adapter.listAssets(options));
      if (operation === 'report') {
        const response = await adapter.reportReference(options);
        data = { reference: readReference(response.reference, context), session: readSession(response.session) };
        if (!data.session) throw new DemoError('demo_session_invalid');
      }
      if (operation === 'check') {
        const response = await adapter.checkUpload(options);
        data = { ...(context.asset_ids ? { results: readBatch(response, context) }
          : { result: readResult(response.result, context) }), session: readSession(response.session) };
        if (!data.session) throw new DemoError('demo_session_invalid');
      }
      if (operation === 'reset') {
        const response = await adapter.resetReference(options);
        if (response.status !== 'reset' || !Number.isInteger(response.cycle_revision)
            || response.cycle_revision <= context.cycle_revision) throw new DemoError('demo_invalid_response');
        data = { session: readSession(response.session) };
        if (!data.session) throw new DemoError('demo_session_invalid');
      }
      if (running.current?.id === id) {
        if (operationKey) attempt.current = null;
        if (['end', 'reset'].includes(operation)) { inputCache.current = {}; setInputs({}); }
        dispatch({ type: 'DONE', id, data });
        return true;
      }
    } catch (error) {
      if (running.current?.id === id) dispatch({ type: 'FAIL', id, error: error.code || 'demo_unavailable' });
      return false;
    } finally { clearTimeout(timeout); if (running.current?.id === id) running.current = null; }
  }, [adapter, getInput]);

  useEffect(() => () => { running.current?.controller.abort(); running.current = null; }, []);

  useEffect(() => {
    let cancelled = false;
    if (autoOpen) queueMicrotask(() => { if (!cancelled) perform('session'); });
    return () => { cancelled = true; };
  }, [autoOpen, perform]);

  useEffect(() => {
    if (!state.session) return;
    const expire = () => {
      running.current?.controller.abort(); running.current = null;
      attempt.current = null;
      dispatch({ type: 'SESSION_EXPIRED' });
    };
    const timer = setTimeout(expire, Math.max(0, Date.parse(state.session.expires_at) - Date.now()));
    const interval = setInterval(() => perform('session', {}, true), 30000);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [state.session, perform]);

  const retrySession = useCallback(() => perform('session'), [perform]);

  useEffect(() => {
    let cancelled = false;
    if (state.reference && state.library === 'idle' && !state.pending) queueMicrotask(() => {
      if (!cancelled) perform('assets', { mode: state.mode });
    });
    return () => { cancelled = true; };
  }, [state.reference, state.library, state.pending, state.mode, perform]);

  return { state, inputs,
    viewInput: async (asset) => getInput({ asset_id: asset.id, mode: state.mode,
      manifest_version: state.manifest_version }, undefined, true),
    open: () => { dispatch({ type: 'OPEN' }); perform('session'); },
    close: () => dispatch({ type: 'CLOSE' }),
    start: (token) => perform('start', { token }),
    end: () => perform('end'),
    retrySession,
    chooseMode: (mode) => {
      if (state.reference || state.pending) return;
      dispatch({ type: 'MODE', mode }); perform('assets', { mode });
    },
    changeMode: () => dispatch({ type: 'CHANGE_MODE' }),
    select: (id) => dispatch({ type: 'SELECT', id }),
    retryAssets: () => perform('assets', { mode: state.mode }),
    report: () => {
      if (!canExecute(state) || state.reference || state.stage !== 'reference') return;
      perform('report', { asset_id: state.selection.id, mode: state.mode, manifest_version: state.manifest_version });
    },
    check: () => {
      if (!canExecute(state) || !state.reference || state.stage !== 'upload') return;
      perform('check', { asset_ids: state.selections.map((asset) => asset.id), mode: state.reference.mode,
        reference_id: state.reference.reference_id, cycle_revision: state.reference.cycle_revision,
        manifest_version: state.reference.manifest_version });
    },
    anotherUpload: () => dispatch({ type: 'TRY_UPLOAD' }),
    reset: () => {
      if (state.reference) perform('reset', { reference_id: state.reference.reference_id, cycle_revision: state.reference.cycle_revision });
    },
  };
}
