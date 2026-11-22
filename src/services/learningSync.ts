import { mergeVocabulary } from '@/lib/vocabularyMerge';
import { requireSupabase } from '@/services/supabase/client';
import type { Tables, TablesInsert } from '@/services/supabase/database.types';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';
import type { AnswerResult } from '@/types/content';
import type { ReviewCard } from '@/types/progress';

/**
 * Server-side persistence of learning data for signed-in users:
 * - saved words + spaced-repetition state  → user_vocabulary (merged per word on sign-in, then written through)
 * - exercise answers                       → user_answers (append-only history)
 * Writes made while offline stay on the device and are reconciled at the next sign-in;
 * the durable offline queue arrives with Phase 6.
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

async function upsertCards(userId: string, cards: ReviewCard[]) {
  if (cards.length === 0) return;
  const supabase = await requireSupabase();
  const { error } = await supabase.from('user_vocabulary').upsert(cards.map((c) => cardToRow(userId, c)), { onConflict: 'user_id,vocabulary_id' });
  if (error) throw error;
}

async function deleteCards(userId: string, wordIds: string[]) {
  if (wordIds.length === 0) return;
  const supabase = await requireSupabase();
  const { error } = await supabase.from('user_vocabulary').delete().eq('user_id', userId).in('vocabulary_id', wordIds);
  if (error) throw error;
}

/** Merges saved words between this device and the account (see mergeVocabulary for the rules). */
export async function syncVocabularyOnSignIn(userId: string): Promise<void> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase.from('user_vocabulary').select('*').eq('user_id', userId);
  if (error) throw error;
  const { cards, removedWords } = useProgressStore.getState();
  const merged = mergeVocabulary(cards, data.map(rowToCard), removedWords);
  await upsertCards(userId, merged.toPush);
  await deleteCards(userId, merged.toDelete);
  // Tombstones are resolved once the server no longer has those words.
  const remoteIds = new Set(data.map((r) => r.vocabulary_id));
  const resolved = Object.keys(removedWords).filter((id) => !remoteIds.has(id) || merged.toDelete.includes(id));
  useProgressStore.getState().applyMergedCards(merged.cards, resolved);
}

/** While signed in, writes card changes through to the account (debounced, batched). */
export function watchVocabularyChanges(userId: string, onError: (error: unknown) => void): () => void {
  let previous = useProgressStore.getState().cards;
  let timer: number | undefined;
  const dirty = new Set<string>();
  const removed = new Set<string>();

  const flush = () => {
    const { cards } = useProgressStore.getState();
    const toUpsert = [...dirty].map((id) => cards[id]).filter((c): c is ReviewCard => Boolean(c));
    const toDelete = [...removed];
    dirty.clear();
    removed.clear();
    void Promise.all([upsertCards(userId, toUpsert), deleteCards(userId, toDelete)])
      .then(() => useProgressStore.getState().applyMergedCards(useProgressStore.getState().cards, toDelete))
      .catch(onError);
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

/** Records the answers of a finished exercise for the signed-in user (no-op for guests). */
export async function recordAnswers(input: { exerciseId: string; attemptId: string; results: AnswerResult[] }): Promise<void> {
  const { status, user } = useAuthStore.getState();
  if (status !== 'signed_in' || !user || input.results.length === 0) return;
  const supabase = await requireSupabase();
  const { error } = await supabase.from('user_answers').insert(
    input.results.map((r) => ({
      user_id: user.id,
      question_id: `${input.exerciseId}:${r.questionId}`,
      attempt_id: input.attemptId,
      answer: r.answer,
      is_correct: r.correct,
    })),
  );
  if (error) throw error;
}
