import type { ReviewCard } from '@/types/progress';

const time = (iso: string | undefined) => (iso ? Date.parse(iso) : 0);

/** Last-modified time of a card; older cards without updatedAt fall back to their last review. */
export const cardUpdatedAt = (card: ReviewCard) => Math.max(time(card.updatedAt), time(card.lastReviewedAt));

export interface VocabularyMergeResult {
  /** The merged card set to keep on this device. */
  cards: Record<string, ReviewCard>;
  /** Cards the server is missing or has an older version of. */
  toPush: ReviewCard[];
  /** Words removed on this device after the server's copy was last changed. */
  toDelete: string[];
}

/**
 * Reconciles saved words between this device and the account, per word:
 * - only on one side → keep it (and upload if local), unless it was deleted locally later;
 * - on both sides → the most recently updated version wins;
 * - a local deletion (tombstone) newer than the server copy deletes it on the server.
 * Never replaces newer data with older data.
 */
export function mergeVocabulary(
  local: Record<string, ReviewCard>,
  remote: ReviewCard[],
  removed: Record<string, string>,
): VocabularyMergeResult {
  const cards: Record<string, ReviewCard> = { ...local };
  const toPush: ReviewCard[] = [];
  const toDelete: string[] = [];
  const remoteIds = new Set<string>();

  for (const r of remote) {
    remoteIds.add(r.wordId);
    const l = local[r.wordId];
    const removedAt = time(removed[r.wordId]);
    if (!l) {
      if (removedAt > cardUpdatedAt(r)) toDelete.push(r.wordId);
      else cards[r.wordId] = r;
      continue;
    }
    const lt = cardUpdatedAt(l);
    const rt = cardUpdatedAt(r);
    if (rt > lt) cards[r.wordId] = r;
    else if (lt > rt) toPush.push(l);
  }

  for (const [wordId, card] of Object.entries(local)) {
    if (!remoteIds.has(wordId)) toPush.push(card);
  }

  return { cards, toPush, toDelete };
}
