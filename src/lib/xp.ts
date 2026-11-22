/**
 * XP rules. XP is only awarded for meaningful learning:
 * - Completing a lesson awards XP once per lesson (reviewing it later awards nothing).
 * - An exercise awards XP per correct answer, only when it beats the learner's previous best.
 * - Each due flashcard review awards XP; reviewing cards that are not due awards nothing.
 */
export const XP_LESSON_COMPLETE = 20;
export const XP_PER_CORRECT_ANSWER = 5;
export const XP_PERFECT_BONUS = 10;
export const XP_PER_DUE_REVIEW = 2;

export function exerciseXp(correct: number, total: number, previousBestCorrect: number): number {
  const gained = Math.max(0, correct - previousBestCorrect) * XP_PER_CORRECT_ANSWER;
  const perfectBonus = correct === total && previousBestCorrect < total ? XP_PERFECT_BONUS : 0;
  return gained + perfectBonus;
}

/** XP-based learner level shown on the profile (distinct from CEFR level). */
export function xpLevel(totalXp: number): { level: number; current: number; next: number } {
  let level = 1;
  let threshold = 100;
  let remaining = totalXp;
  while (remaining >= threshold) {
    remaining -= threshold;
    level++;
    threshold = Math.round(threshold * 1.25);
  }
  return { level, current: remaining, next: threshold };
}
