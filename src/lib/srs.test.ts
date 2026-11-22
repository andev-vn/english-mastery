import { describe, expect, it } from 'vitest';
import { createCard, DEFAULT_EASE, isDifficult, isDue, isLearned, MIN_EASE, scheduleReview } from './srs';

const NOW = new Date('2026-03-01T09:00:00');
const daysBetween = (a: string, b: Date) => Math.round((new Date(a).getTime() - b.getTime()) / 86_400_000);

describe('scheduleReview (SM-2 inspired)', () => {
  it('new cards are due immediately', () => {
    const card = createCard('w1', NOW);
    expect(card.easeFactor).toBe(DEFAULT_EASE);
    expect(isDue(card, NOW)).toBe(true);
  });

  it('grows intervals 1 → 6 → interval × ease on "good"', () => {
    let card = createCard('w1', NOW);
    card = scheduleReview(card, 'good', NOW);
    expect(card.repetitions).toBe(1);
    expect(card.intervalDays).toBe(1);
    expect(daysBetween(card.nextReviewAt, NOW)).toBe(1);

    card = scheduleReview(card, 'good', NOW);
    expect(card.intervalDays).toBe(6);

    card = scheduleReview(card, 'good', NOW);
    expect(card.intervalDays).toBe(Math.round(6 * card.easeFactor));
    expect(isLearned(card)).toBe(true);
  });

  it('"again" resets repetitions, schedules tomorrow, counts a lapse and lowers ease', () => {
    let card = createCard('w1', NOW);
    card = scheduleReview(card, 'good', NOW);
    card = scheduleReview(card, 'good', NOW);
    const before = card.easeFactor;
    card = scheduleReview(card, 'again', NOW);
    expect(card.repetitions).toBe(0);
    expect(card.intervalDays).toBe(1);
    expect(card.lapses).toBe(1);
    expect(card.easeFactor).toBeLessThan(before);
  });

  it('never drops ease below the minimum', () => {
    let card = createCard('w1', NOW);
    for (let i = 0; i < 20; i++) card = scheduleReview(card, 'again', NOW);
    expect(card.easeFactor).toBe(MIN_EASE);
    expect(isDifficult(card)).toBe(true);
  });

  it('"easy" schedules further out than "good"', () => {
    const base = scheduleReview(scheduleReview(createCard('w1', NOW), 'good', NOW), 'good', NOW);
    expect(scheduleReview(base, 'easy', NOW).intervalDays).toBeGreaterThan(scheduleReview(base, 'good', NOW).intervalDays);
  });

  it('a scheduled card is not due before its review time', () => {
    const card = scheduleReview(createCard('w1', NOW), 'good', NOW);
    expect(isDue(card, NOW)).toBe(false);
    expect(isDue(card, new Date('2026-03-02T09:00:00'))).toBe(true);
  });
});
