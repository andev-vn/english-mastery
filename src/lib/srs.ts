import type { ReviewCard } from '@/types/progress';
import { addDays } from './date';

/**
 * Review grades shown to the learner, mapped onto SM-2 quality scores:
 * again = 1, hard = 3, good = 4, easy = 5.
 */
export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

const QUALITY: Record<ReviewGrade, number> = { again: 1, hard: 3, good: 4, easy: 5 };
export const MIN_EASE = 1.3;
export const DEFAULT_EASE = 2.5;

export function createCard(wordId: string, now: Date = new Date()): ReviewCard {
  return {
    wordId,
    repetitions: 0,
    easeFactor: DEFAULT_EASE,
    intervalDays: 0,
    nextReviewAt: now.toISOString(),
    lapses: 0,
    favorite: false,
  };
}

/**
 * SM-2 inspired scheduling.
 * - Failed recall (quality < 3) resets repetitions and schedules the card for tomorrow.
 * - Successful recall grows the interval: 1 day, 6 days (3 if hard), then interval × ease.
 * - "Hard" grows the interval slowly (× 1.2); "easy" adds a 30% bonus.
 */
export function scheduleReview(card: ReviewCard, grade: ReviewGrade, now: Date = new Date()): ReviewCard {
  const q = QUALITY[grade];
  const easeFactor = Math.max(MIN_EASE, card.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  let repetitions: number;
  let intervalDays: number;
  let lapses = card.lapses;

  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
    lapses += 1;
  } else {
    repetitions = card.repetitions + 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = grade === 'hard' ? 3 : 6;
    else intervalDays = Math.max(1, Math.round(card.intervalDays * (grade === 'hard' ? 1.2 : easeFactor)));
    if (grade === 'easy') intervalDays = Math.max(1, Math.round(intervalDays * 1.3));
  }

  return {
    ...card,
    repetitions,
    easeFactor: Number(easeFactor.toFixed(2)),
    intervalDays,
    lapses,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: addDays(now, intervalDays).toISOString(),
  };
}

export function isDue(card: ReviewCard, now: Date = new Date()): boolean {
  return new Date(card.nextReviewAt).getTime() <= now.getTime();
}

/** A word is "difficult" if it lapsed at least twice or its ease dropped well below the default (one lapse alone is not enough). */
export function isDifficult(card: ReviewCard): boolean {
  return card.lapses >= 2 || card.easeFactor < 1.9;
}

/** A word counts as learned once it has been recalled successfully at least twice in a row. */
export function isLearned(card: ReviewCard): boolean {
  return card.repetitions >= 2;
}
