import { describe, expect, it } from 'vitest';
import type { ReviewCard } from '@/types/progress';
import { mergeVocabulary } from './vocabularyMerge';

const card = (wordId: string, updatedAt: string, patch: Partial<ReviewCard> = {}): ReviewCard => ({
  wordId,
  repetitions: 0,
  easeFactor: 2.5,
  intervalDays: 0,
  nextReviewAt: updatedAt,
  lapses: 0,
  favorite: false,
  updatedAt,
  ...patch,
});

const T1 = '2026-11-20T10:00:00.000Z';
const T2 = '2026-11-21T10:00:00.000Z';
const T3 = '2026-11-22T10:00:00.000Z';

describe('mergeVocabulary', () => {
  it('uploads words saved only on this device', () => {
    const local = { a: card('a', T1) };
    const result = mergeVocabulary(local, [], {});
    expect(result.toPush.map((c) => c.wordId)).toEqual(['a']);
    expect(result.cards).toEqual(local);
  });

  it('downloads words saved only on the account', () => {
    const result = mergeVocabulary({}, [card('b', T1)], {});
    expect(result.cards.b?.wordId).toBe('b');
    expect(result.toPush).toEqual([]);
  });

  it('keeps the most recently updated version of a word', () => {
    const newerRemote = mergeVocabulary({ a: card('a', T1, { repetitions: 1 }) }, [card('a', T2, { repetitions: 3 })], {});
    expect(newerRemote.cards.a?.repetitions).toBe(3);
    expect(newerRemote.toPush).toEqual([]);

    const newerLocal = mergeVocabulary({ a: card('a', T3, { favorite: true }) }, [card('a', T2)], {});
    expect(newerLocal.cards.a?.favorite).toBe(true);
    expect(newerLocal.toPush.map((c) => c.wordId)).toEqual(['a']);
  });

  it('does nothing when both sides are identical in time', () => {
    const result = mergeVocabulary({ a: card('a', T1) }, [card('a', T1)], {});
    expect(result.toPush).toEqual([]);
    expect(result.toDelete).toEqual([]);
  });

  it('propagates a local deletion that is newer than the server copy', () => {
    const result = mergeVocabulary({}, [card('a', T1)], { a: T2 });
    expect(result.toDelete).toEqual(['a']);
    expect(result.cards.a).toBeUndefined();
  });

  it('restores a word re-saved on another device after it was deleted here', () => {
    const result = mergeVocabulary({}, [card('a', T3)], { a: T2 });
    expect(result.toDelete).toEqual([]);
    expect(result.cards.a?.updatedAt).toBe(T3);
  });

  it('falls back to lastReviewedAt for cards saved before timestamps existed', () => {
    const legacy: ReviewCard = { ...card('a', T1), updatedAt: undefined, lastReviewedAt: T3 };
    const result = mergeVocabulary({ a: legacy }, [card('a', T2)], {});
    expect(result.toPush.map((c) => c.wordId)).toEqual(['a']);
  });
});
