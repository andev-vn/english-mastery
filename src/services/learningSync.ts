import { mergeVocabulary } from '@/lib/vocabularyMerge';
import { requireSupabase } from '@/services/supabase/client';
import type { Json, Tables, TablesInsert } from '@/services/supabase/database.types';
import { unwrap } from '@/services/progressSync';
import { enqueue, registerSyncHandler } from '@/services/sync/syncQueue';
import { useProgressStore } from '@/stores/progressStore';
import type { ReviewCard } from '@/types/progress';

/**
 * Server-side persistence of learning data for signed-in users:
 * - saved words + spaced-repetition state → user_vocabulary (merged per word on sign-in, then every
 *   change is queued and sent through the conflict-safe sync_vocabulary RPC)
 * (Exercise answers are recorded by the submit_exercise RPC — see progressSync.ts.)
 */

type VocabularyRow = Tables<'user_vocabulary'>;

export function cardToRow(userId: string, card: ReviewCard): TablesInsert<'user_vocabulary'> {
  return {
    user_id: userId,
    vocabulary_id: card.wordId,
    repetitions: card.repetitions,
    ease_factor: card.easeFactor,
    interval_days: card.intervalDays,
    lapses: card.lapses,
    is_favorite: card.favorite,
    last_reviewed_at: card.lastReviewedAt ?? null,
    next_review_at: card.nextReviewAt,
    updated_at: card.updatedAt ?? new Date().toISOString(),
  };
}

export function rowToCard(row: VocabularyRow): ReviewCard {
  return {
    wordId: row.vocabulary_id,
    repetitions: row.repetitions,
    easeFactor: Number(row.ease_factor),
    intervalDays: row.interval_days,
    lapses: row.lapses,
    favorite: row.is_favorite,
    nextReviewAt: row.next_review_at,
    updatedAt: row.updated_at,
    ...(row.last_reviewed_at ? { lastReviewedAt: row.last_reviewed_at } : {}),
  };
}

export interface VocabularySyncPayload {
  cards: TablesInsert<'user_vocabulary'>[];
  deleted: { vocabulary_id: string; deleted_at: string }[];
}

/** The parts of a row the RPC reads (user_id comes from the session, never from the device). */
const rpcCard = ({ user_id: _user, ...row }: TablesInsert<'user_vocabulary'>) => row;

const isRow = (v: unknown): v is VocabularyRow =>
  typeof v === 'object' && v !== null && typeof (v as VocabularyRow).vocabulary_id === 'string' && typeof (v as VocabularyRow).updated_at === 'string';

/**
 * Sends card changes and deletions through sync_vocabulary, which applies each one only if it is newer
 * than the account's copy, then adopts the account's copies that turned out newer.
 */
export async function sendVocabularyChanges(payload: VocabularySyncPayload): Promise<void> {
  if (payload.cards.length === 0 && payload.deleted.length === 0) return;
  const supabase = await requireSupabase();
  const data = unwrap(
    await supabase.rpc('sync_vocabulary', { p_cards: payload.cards.map(rpcCard) as unknown as Json, p_deleted: payload.deleted as unknown as Json }),
  );
  const newer = data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.newer) ? data.newer.filter(isRow) : [];
  useProgressStore.getState().applyServerCards(
    newer.map(rowToCard),
    payload.deleted.map((d) => d.vocabulary_id),
  );
}

registerSyncHandler<VocabularySyncPayload>('sync_vocabulary', (payload) => sendVocabularyChanges(payload));

/** Merges saved words between this device and the account (see mergeVocabulary for the rules). */
export async function syncVocabularyOnSignIn(userId: string): Promise<void> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase.from('user_vocabulary').select('*').eq('user_id', userId);
  if (error) throw error;
  const { cards, removedWords } = useProgressStore.getState();
  const merged = mergeVocabulary(cards, data.map(rowToCard), removedWords);
  // Tombstones are resolved once the server no longer has those words.
  const remoteIds = new Set(data.map((r) => r.vocabulary_id));
  const resolved = Object.keys(removedWords).filter((id) => !remoteIds.has(id) || merged.toDelete.includes(id));
  useProgressStore.getState().applyMergedCards(merged.cards, resolved);
  await sendVocabularyChanges({
    cards: merged.toPush.map((c) => cardToRow(userId, c)),
    deleted: merged.toDelete.map((id) => ({ vocabulary_id: id, deleted_at: removedWords[id] ?? new Date().toISOString() })),
  });
}

/**
 * While signed in, queues card changes for the account (debounced, batched). The queue keeps them
 * across reloads and offline periods.
 */
export function watchVocabularyChanges(userId: string): () => void {
  let previous = useProgressStore.getState().cards;
  let timer: number | undefined;
  const dirty = new Set<string>();
  const removed = new Set<string>();

  const flush = () => {
    const { cards, removedWords } = useProgressStore.getState();
    const payload: VocabularySyncPayload = {
      cards: [...dirty].map((id) => cards[id]).filter((c): c is ReviewCard => Boolean(c)).map((c) => cardToRow(userId, c)),
      deleted: [...removed].map((id) => ({ vocabulary_id: id, deleted_at: removedWords[id] ?? new Date().toISOString() })),
    };
    dirty.clear();
    removed.clear();
    if (payload.cards.length || payload.deleted.length) void enqueue('sync_vocabulary', payload);
  };

  const unsubscribe = useProgressStore.subscribe((state) => {
    if (state.cards === previous) return;
    for (const [id, card] of Object.entries(state.cards)) {
      if (previous[id] !== card) {
        dirty.add(id);
        removed.delete(id);
      }
    }
    for (const id of Object.keys(previous)) {
      if (!state.cards[id]) {
        removed.add(id);
        dirty.delete(id);
      }
    }
    previous = state.cards;
    window.clearTimeout(timer);
    timer = window.setTimeout(flush, 1000);
  });

  return () => {
    window.clearTimeout(timer);
    if (dirty.size || removed.size) flush();
    unsubscribe();
  };
}
