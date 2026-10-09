'use client';

import { useCallback, useEffect, useState } from 'react';

export async function consoleRequest(path, { method = 'GET', body, signal } = {}) {
  const response = await fetch(`/api/console/${path}`, {
    method, signal, cache: 'no-store', credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && path !== 'session') window.dispatchEvent(new Event('corvinth-console-expired'));
    const error = new Error(data.message || 'This request could not be completed. Please try again.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export function useConsoleData(path, pollMs = 0) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ path, loading: true, data: null, error: null });
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    let alive = true;
    let timer;
    async function load() {
      try {
        const data = await consoleRequest(path, { signal: controller.signal });
        if (alive) setState({ path, data, loading: false, error: null });
      } catch (error) {
        if (alive) setState({ path, data: null, loading: false, error });
      } finally {
        if (alive && pollMs) timer = setTimeout(tick, pollMs);
      }
    }
    function tick() {
      if (document.visibilityState === 'visible') load();
      else timer = setTimeout(tick, pollMs);
    }
    load();
    return () => { alive = false; clearTimeout(timer); controller.abort(); };
  }, [path, revision, pollMs]);
  const reload = useCallback(() => { setState({ path, loading: true, data: null, error: null }); setRevision(n => n + 1); }, [path]);
  return { ...(state.path === path ? state : { data: null, loading: true, error: null }), reload };
}

export const date = value => value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Not available';
export const label = value => value ? String(value).replaceAll('_', ' ') : 'Not available';
export const query = values => new URLSearchParams(Object.entries(values).filter(([, value]) => value !== undefined && value !== null)).toString();
