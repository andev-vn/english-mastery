import Dexie, { type EntityTable } from 'dexie';

/**
 * The on-device database (IndexedDB via Dexie). It holds:
 * - kv:      persisted store snapshots (learning progress) — see idbStorage.ts
 * - queue:   server operations waiting to be sent (see services/sync/syncQueue.ts)
 * - content: the latest published content downloaded from Supabase, for offline use
 * Settings stay in localStorage because index.html reads the theme synchronously before React starts.
 */

export interface KvRow {
  key: string;
  value: string;
}

export type QueueKind = 'complete_lesson' | 'submit_exercise' | 'record_reviews' | 'submit_assessment' | 'sync_vocabulary';

export interface QueueRow {
  /** Also the RPC's idempotency key, so a replayed operation is applied once. */
  opId: string;
  /** Operations are only ever sent for the account that created them. */
  userId: string;
  kind: QueueKind;
  payload: unknown;
  createdAt: string;
  attempts: number;
  /** Epoch ms; the item is not retried before this time. */
  nextAttemptAt: number;
  lastError?: string;
}

export interface ContentRow {
  id: string;
  value: unknown;
  savedAt: string;
}

export class AppDatabase extends Dexie {
  kv!: EntityTable<KvRow, 'key'>;
  queue!: EntityTable<QueueRow, 'opId'>;
  content!: EntityTable<ContentRow, 'id'>;

  constructor(name = 'english-mastery') {
    super(name);
    this.version(1).stores({
      kv: 'key',
      queue: 'opId, userId, createdAt',
      content: 'id',
    });
  }
}

let instance: AppDatabase | null | undefined;

/** The device database, or null where IndexedDB does not exist (old browsers, some test environments). */
export function getDb(): AppDatabase | null {
  if (instance === undefined) instance = typeof indexedDB === 'undefined' ? null : new AppDatabase();
  return instance;
}

/** Tests only: start from a fresh database. */
export async function resetDbForTests(): Promise<void> {
  if (instance) {
    instance.close();
    await Dexie.delete(instance.name);
  }
  instance = undefined;
}
