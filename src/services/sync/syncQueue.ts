import { create } from 'zustand';
import { getDb, type QueueKind, type QueueRow } from '@/lib/db';
import { uid } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';

/**
 * Durable outbox for server operations (signed-in users only).
 *
 * Every meaningful action is saved on the device first, then queued here with a unique opId that the
 * server RPCs use as an idempotency key — so an operation that is retried after a lost response is
 * applied once. Items are stored in IndexedDB (they survive reloads and offline periods), are tied to
 * the account that created them and are sent in order. Failures:
 *   - network / 5xx / 401 / 408 / 429 → kept and retried with exponential backoff
 *   - other 4xx (the server rejected the data) → dropped, because retrying cannot succeed
 * Guests never enqueue anything: their progress is reconciled when they first sign in.
 */

export class RemoteError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'RemoteError';
  }
}

/** True when retrying the same request can never succeed. */
export function isPermanentError(error: unknown): boolean {
  if (!(error instanceof RemoteError)) return false;
  return error.status >= 400 && error.status < 500 && ![401, 408, 429].includes(error.status);
}

const BASE_DELAY_MS = 5_000;
const MAX_DELAY_MS = 10 * 60_000;
const MAX_ATTEMPTS = 50;
export const backoffDelay = (attempts: number) => Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** Math.max(0, attempts - 1));

export type SyncState = 'idle' | 'syncing' | 'offline' | 'retrying';

export interface SyncStatus {
  /** Operations of the signed-in account still waiting to be sent. */
  pending: number;
  state: SyncState;
  lastSyncedAt?: string;
  lastError?: string;
  /** Operations the server refused this session (not retried). */
  rejected: number;
}

export const useSyncStatus = create<SyncStatus>()(() => ({ pending: 0, state: 'idle', rejected: 0 }));

type Handler = (payload: never, item: QueueRow) => Promise<void>;
const handlers = new Map<QueueKind, Handler>();

/** Registers how a kind of operation is sent. Called by the modules that own each operation. */
export function registerSyncHandler<P>(kind: QueueKind, handler: (payload: P, item: QueueRow) => Promise<void>) {
  handlers.set(kind, handler as Handler);
}

let onRejected: ((item: QueueRow, error: unknown) => void) | undefined;
export function setRejectedListener(listener: typeof onRejected) {
  onRejected = listener;
}

// --- storage (IndexedDB, or memory where IndexedDB is unavailable) -------------------------------

let memory: QueueRow[] = [];

const store = {
  async put(item: QueueRow) {
    const db = getDb();
    if (db) {
      try {
        await db.queue.put(item);
        return;
      } catch {
        // fall through to memory
      }
    }
    memory = [...memory.filter((m) => m.opId !== item.opId), item];
  },
  async remove(opId: string) {
    memory = memory.filter((m) => m.opId !== opId);
    try {
      await getDb()?.queue.delete(opId);
    } catch {
      // ignore
    }
  },
  async forUser(userId: string): Promise<QueueRow[]> {
    let rows: QueueRow[] = [];
    try {
      rows = (await getDb()?.queue.where('userId').equals(userId).toArray()) ?? [];
    } catch {
      rows = [];
    }
    const all = [...rows, ...memory.filter((m) => m.userId === userId && !rows.some((r) => r.opId === m.opId))];
    return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.opId.localeCompare(b.opId));
  },
};

// --- public API ---------------------------------------------------------------------------------

const currentUserId = () => {
  const { status, user } = useAuthStore.getState();
  return status === 'signed_in' && user ? user.id : null;
};

const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

/** Pending operations of the signed-in account. */
export async function pendingItems(): Promise<QueueRow[]> {
  const userId = currentUserId();
  return userId ? store.forUser(userId) : [];
}

async function refreshStatus(patch: Partial<SyncStatus> = {}) {
  const pending = (await pendingItems()).length;
  const base = { ...useSyncStatus.getState(), ...patch, pending };
  if (base.state !== 'syncing') {
    base.state = pending === 0 ? 'idle' : isOffline() ? 'offline' : base.lastError ? 'retrying' : 'idle';
  }
  useSyncStatus.setState(base);
}

/**
 * Queues an operation for the signed-in account and tries to send it right away.
 * Returns false (and does nothing) for guests.
 */
export async function enqueue(kind: QueueKind, payload: unknown, opId: string = uid()): Promise<boolean> {
  const userId = currentUserId();
  if (!userId) return false;
  await store.put({ opId, userId, kind, payload, createdAt: new Date().toISOString(), attempts: 0, nextAttemptAt: 0 });
  await refreshStatus();
  void processQueue();
  return true;
}

let running: Promise<void> | null = null;
let again: { force: boolean } | null = null;

/**
 * Sends due operations of the signed-in account, oldest first. Stops at the first failure that can be
 * retried (later items would most likely fail the same way, and order is preserved).
 * `force` ignores the backoff ("Sync now"). A call made while a pass is running schedules one more
 * pass, so operations queued meanwhile are not left waiting for the next trigger.
 */
export function processQueue(options: { force?: boolean } = {}): Promise<void> {
  const force = options.force ?? false;
  if (running) {
    again = { force: force || (again?.force ?? false) };
    return running;
  }
  running = (async () => {
    let next: { force: boolean } | null = { force };
    while (next) {
      again = null;
      await withTabLock(() => drain(next!.force));
      next = again;
    }
  })().finally(() => {
    running = null;
    again = null;
  });
  return running;
}

/** Only one tab sends at a time (the server would de-duplicate anyway, but this avoids wasted calls). */
async function withTabLock(fn: () => Promise<void>) {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (!locks) return fn();
  await locks.request('em-sync-queue', { ifAvailable: true }, async (lock) => {
    if (lock) await fn();
  });
}

async function drain(force: boolean) {
  const userId = currentUserId();
  if (!userId) return;
  if (isOffline()) {
    await refreshStatus();
    return;
  }
  const items = await store.forUser(userId);
  if (items.length === 0) {
    await refreshStatus({ lastError: undefined });
    return;
  }
  useSyncStatus.setState({ state: 'syncing' });
  // Kept while the failed item is waiting for its retry.
  let lastError = useSyncStatus.getState().lastError;
  for (const item of items) {
    // Stop if the account changed while sending.
    if (currentUserId() !== item.userId) break;
    // Not due yet: wait, so operations keep their order.
    if (!force && item.nextAttemptAt > Date.now()) break;
    const handler = handlers.get(item.kind);
    if (!handler) continue; // its module has not loaded yet; keep it
    try {
      await handler(item.payload as never, item);
      await store.remove(item.opId);
      lastError = undefined;
      useSyncStatus.setState({ lastSyncedAt: new Date().toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isPermanentError(error) || item.attempts + 1 >= MAX_ATTEMPTS) {
        await store.remove(item.opId);
        useSyncStatus.setState((s) => ({ rejected: s.rejected + 1 }));
        if (import.meta.env.DEV) console.warn('[sync] dropped', item.kind, error);
        onRejected?.(item, error);
        continue;
      }
      const attempts = item.attempts + 1;
      await store.put({ ...item, attempts, nextAttemptAt: Date.now() + backoffDelay(attempts), lastError: message });
      lastError = message;
      break;
    }
  }
  useSyncStatus.setState({ state: 'idle' });
  await refreshStatus({ lastError });
}

/**
 * Sends the queue whenever it may succeed: now, when the device comes back online, when the app
 * returns to the foreground and every 30 s (only items whose backoff has passed are sent).
 */
export function startSyncQueue(): () => void {
  const kick = () => void processQueue();
  const onVisible = () => {
    if (document.visibilityState === 'visible') kick();
  };
  const onOffline = () => void refreshStatus();
  window.addEventListener('online', kick);
  window.addEventListener('offline', onOffline);
  document.addEventListener('visibilitychange', onVisible);
  const timer = window.setInterval(kick, 30_000);
  kick();
  return () => {
    window.removeEventListener('online', kick);
    window.removeEventListener('offline', onOffline);
    document.removeEventListener('visibilitychange', onVisible);
    window.clearInterval(timer);
    useSyncStatus.setState({ pending: 0, state: 'idle', lastError: undefined });
  };
}

/** Tests only. */
export function resetSyncQueueForTests() {
  memory = [];
  running = null;
  again = null;
  useSyncStatus.setState({ pending: 0, state: 'idle', rejected: 0, lastError: undefined, lastSyncedAt: undefined });
}
