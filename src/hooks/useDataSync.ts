'use client';
/**
 * useDataSync — persists projects + shoots to:
 *   1. localStorage (instant, local)
 *   2. Cloudflare KV via /api/sync (async, cross-device)
 *
 * On mount: loads from localStorage immediately, then hydrates from KV.
 * On change: saves to localStorage immediately, debounces KV write by 1.5s.
 */

import { useEffect, useRef, useCallback, useState } from 'react';

const LS_KEY = 'dopamine-state-v1';
const KV_DEBOUNCE_MS = 1500;

export interface AppState {
  projects: unknown[];
  shoots: unknown[];
}

function loadFromLocalStorage(): AppState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

function saveToLocalStorage(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — ignore
  }
}

async function loadFromKV(): Promise<AppState | null> {
  try {
    const res = await fetch('/api/sync', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data as AppState | null;
  } catch {
    return null;
  }
}

async function saveToKV(state: AppState): Promise<void> {
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
  } catch {
    // Silently fail — localStorage already has the data
  }
}

/**
 * Hook that returns a `syncState` function. Call it whenever projects/shoots change.
 * Also exposes `kvState` which is the state hydrated from KV (null while loading).
 */
export function useDataSync() {
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [kvState, setKvState] = useState<AppState | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  // On mount: hydrate from KV in the background
  useEffect(() => {
    loadFromKV().then((state) => {
      if (state) {
        setKvState(state);
      }
    });
  }, []);

  const syncState = useCallback((state: AppState) => {
    // 1. Save to localStorage immediately
    saveToLocalStorage(state);

    // 2. Debounce KV write
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setSyncStatus('syncing');
    debounceTimer.current = setTimeout(async () => {
      try {
        await saveToKV(state);
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch {
        setSyncStatus('error');
      }
    }, KV_DEBOUNCE_MS);
  }, []);

  return { kvState, syncState, syncStatus };
}

/**
 * Utility: revive Date objects from JSON-serialised state.
 * JSON.stringify turns Dates into strings; this converts them back.
 */
export function reviveDates<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    // ISO 8601 date string pattern
    if (/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/.test(obj)) {
      const d = new Date(obj);
      if (!isNaN(d.getTime())) return d as unknown as T;
    }
    return obj;
  }
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return (obj as unknown[]).map(reviveDates) as unknown as T;
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = reviveDates(val);
    }
    return result as T;
  }
  return obj;
}
