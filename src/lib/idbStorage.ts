import type { StateStorage } from 'zustand/middleware';
import { getDb } from './db';

/**
 * A zustand StateStorage backed by IndexedDB, with localStorage as the fallback.
 *
 * Migration: data saved by earlier versions lives in localStorage. A localStorage value is always
 * at least as new as the IndexedDB one (it is either the pre-IndexedDB copy, or was written because
 * IndexedDB failed), so when present it wins, is copied into IndexedDB and then removed.
 * If IndexedDB fails (private mode, quota, blocked), the rest of the session uses localStorage.
 */

let idbBroken = false;

const local = {
  get: (name: string) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  set: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Storage full or blocked: the in-memory state still works for this session.
    }
  },
  remove: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

function usableDb() {
  return idbBroken ? null : getDb();
}

function markBroken(error: unknown) {
  idbBroken = true;
  if (import.meta.env.DEV) console.warn('[storage] IndexedDB unavailable, using localStorage', error);
}

export const idbStorage: StateStorage = {
  getItem: async (name) => {
    const db = usableDb();
    const legacy = local.get(name);
    if (!db) return legacy;
    try {
      if (legacy !== null) {
        await db.kv.put({ key: name, value: legacy });
        local.remove(name);
        return legacy;
      }
      return (await db.kv.get(name))?.value ?? null;
    } catch (error) {
      markBroken(error);
      return legacy;
    }
  },
  setItem: async (name, value) => {
    const db = usableDb();
    if (db) {
      try {
        await db.kv.put({ key: name, value });
        return;
      } catch (error) {
        markBroken(error);
      }
    }
    local.set(name, value);
  },
  removeItem: async (name) => {
    local.remove(name);
    const db = usableDb();
    if (!db) return;
    try {
      await db.kv.delete(name);
    } catch (error) {
      markBroken(error);
    }
  },
};

/** Which storage is in use, for the offline-data settings. */
export const storageBackend = (): 'indexeddb' | 'localstorage' => (usableDb() ? 'indexeddb' : 'localstorage');

/** Tests only. */
export function resetIdbStorageForTests() {
  idbBroken = false;
}
