import { beforeEach, describe, expect, it } from 'vitest';
import { useProgressStore } from './progressStore';

const store = () => useProgressStore.getState();

describe('progressStore', () => {
  beforeEach(() => store().resetProgress());

  it('awards lesson XP only once', () => {
    const lesson = { id: 'l1', title: 'Lesson', estimatedMinutes: 8 };
    expect(store().completeLesson(lesson)).toBe(20);
    expect(store().completeLesson(lesson)).toBe(0);
    expect(store().totalXp).toBe(20);
    expect(store().lessons.l1?.status).toBe('completed');
    expect(store().activity).toHaveLength(1);
  });

  it('records exercise attempts and only rewards improvement', () => {
    const input = { exerciseId: 'e1', title: 'Ex', correct: 3, total: 5, durationSeconds: 120 };
    expect(store().recordExercise(input).xp).toBe(15);
    expect(store().recordExercise(input).xp).toBe(0);
    expect(store().recordExercise({ ...input, correct: 5 }).xp).toBe(20);
    expect(store().attempts).toHaveLength(3);
    expect(store().attempts[0]?.score).toBe(100);
  });

  it('saves, favourites and removes words', () => {
    store().saveWord('w1');
    store().toggleFavorite('w1');
    expect(store().cards.w1?.favorite).toBe(true);
    store().removeWord('w1');
    expect(store().cards.w1).toBeUndefined();
  });

  it('grants review XP for due cards only', () => {
    store().saveWord('w1');
    expect(store().reviewWord('w1', 'good')).toBe(2);
    // The card is now scheduled for tomorrow; reviewing again early earns nothing.
    expect(store().reviewWord('w1', 'good')).toBe(0);
    expect(store().cards.w1?.repetitions).toBe(2);
  });

  it('does not log empty review sessions', () => {
    store().finishReviewSession({ reviewed: 0, xp: 0, durationSeconds: 10 });
    expect(store().activity).toHaveLength(0);
    store().finishReviewSession({ reviewed: 3, xp: 6, durationSeconds: 90 });
    expect(store().activity[0]?.title).toContain('3');
    expect(store().totalXp).toBe(0); // XP is granted per card, not again for the session.
  });

  it('adopts newer account copies of words but keeps newer local changes', () => {
    const card = (wordId: string, updatedAt: string, favorite = false) => ({
      wordId, repetitions: 0, easeFactor: 2.5, intervalDays: 0, lapses: 0, favorite, nextReviewAt: updatedAt, updatedAt,
    });
    useProgressStore.setState({
      cards: { a: card('a', '2026-11-24T08:00:00.000Z'), b: card('b', '2026-11-24T10:00:00.000Z') },
      removedWords: { c: '2026-11-24T08:00:00.000Z', d: '2026-11-24T12:00:00.000Z', e: '2026-11-24T08:00:00.000Z' },
    });
    store().applyServerCards(
      [
        card('a', '2026-11-24T09:00:00+00:00', true), // newer on the server → adopted (offset format from Postgres)
        card('b', '2026-11-24T09:00:00+00:00', true), // older → local edit stays
        card('c', '2026-11-24T09:00:00+00:00', true), // deletion refused: changed elsewhere afterwards → restored
        card('d', '2026-11-24T09:00:00+00:00', true), // a newer deletion is still pending here → stays deleted
      ],
      ['c', 'e'],
    );
    const s = store();
    expect(s.cards.a?.favorite).toBe(true);
    expect(s.cards.b?.favorite).toBe(false);
    expect(s.cards.c?.favorite).toBe(true);
    expect(s.cards.d).toBeUndefined();
    expect(Object.keys(s.removedWords).sort()).toEqual(['d']);
  });
});
