import { CEFR_LEVELS, QUESTION_TYPES, type CefrLevel, type ExerciseSkill, type LessonCategory, type PartOfSpeech, type QuestionType } from '@/types/content';
import type { LearningGoal } from '@/types/progress';

/**
 * Runtime narrowing for check-constrained text columns, which generated types expose as `string`.
 * Unknown values throw: the database constraints should make that impossible, so it signals drift
 * between schema and client — and the repository then falls back to bundled content.
 */
function oneOf<T extends string>(allowed: readonly T[], label: string) {
  return (value: string): T => {
    if ((allowed as readonly string[]).includes(value)) return value as T;
    throw new TypeError(`Unexpected ${label}: ${value}`);
  };
}

export const asCefrLevel = oneOf<CefrLevel>(CEFR_LEVELS, 'CEFR level');
export const asLearningGoal = oneOf<LearningGoal>(['work', 'travel', 'study', 'interview', 'daily'], 'learning goal');
export const asLessonCategory = oneOf<LessonCategory>(['general', 'grammar', 'vocabulary', 'developer'], 'module category');
export const asPartOfSpeech = oneOf<PartOfSpeech>(
  ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'phrase'],
  'part of speech',
);
export const asExerciseSkill = oneOf<ExerciseSkill>(['grammar', 'vocabulary', 'reading', 'listening', 'writing', 'developer'], 'exercise skill');
export const asQuestionType = oneOf<QuestionType>(QUESTION_TYPES, 'question type');
