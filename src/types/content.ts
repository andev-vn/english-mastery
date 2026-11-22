/** Domain model for learning content. Mirrors the planned Supabase schema (docs/DATABASE.md). */

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export type LessonCategory = 'general' | 'grammar' | 'vocabulary' | 'developer';

export interface LevelInfo {
  id: CefrLevel;
  name: string;
  nameVi: string;
  description: string;
  order: number;
}

export interface Module {
  id: string;
  levelId: CefrLevel;
  title: string;
  titleVi: string;
  description: string;
  order: number;
  category: LessonCategory;
}

export type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'text'; text: string }
  | { type: 'grammar'; title: string; structure: string; explanationVi: string }
  | { type: 'example'; en: string; vi: string; note?: string }
  | { type: 'mistake'; wrong: string; right: string; explanationVi: string }
  | { type: 'tip'; text: string }
  | { type: 'vocabulary'; wordIds: string[] }
  | { type: 'exercise'; exerciseId: string };

export interface Lesson {
  id: string;
  moduleId: string;
  levelId: CefrLevel;
  title: string;
  titleVi: string;
  description: string;
  objectives: string[];
  blocks: ContentBlock[];
  vocabularyIds: string[];
  exerciseIds: string[];
  estimatedMinutes: number;
  order: number;
}

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'phrase';

export interface VocabularyEntry {
  id: string;
  word: string;
  ipa: string;
  partOfSpeech: PartOfSpeech;
  level: CefrLevel;
  topic: string;
  definition: string;
  meaningVi: string;
  example: string;
  exampleVi: string;
  synonyms: string[];
  antonyms: string[];
  collocations: string[];
}

export interface VocabularyTopic {
  id: string;
  name: string;
  nameVi: string;
}

/* ---------- Exercises ---------- */

export const QUESTION_TYPES = [
  'multiple_choice',
  'true_false',
  'fill_blank',
  'matching',
  'ordering',
  'error_correction',
  'translation',
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

interface QuestionBase {
  id: string;
  prompt: string;
  /** Optional passage / transcript shown above the question (reading & listening). */
  context?: string;
  explanationVi: string;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: 'multiple_choice';
  options: { id: string; text: string }[];
  correctOptionId: string;
}

export interface TrueFalseQuestion extends QuestionBase {
  type: 'true_false';
  statement: string;
  answer: boolean;
}

export interface FillBlankQuestion extends QuestionBase {
  type: 'fill_blank';
  /** Sentence with a single `___` placeholder. */
  sentence: string;
  acceptedAnswers: string[];
}

export interface MatchingQuestion extends QuestionBase {
  type: 'matching';
  pairs: { left: string; right: string }[];
}

export interface OrderingQuestion extends QuestionBase {
  type: 'ordering';
  /** Correct order of tokens. Displayed shuffled. */
  tokens: string[];
}

export interface ErrorCorrectionQuestion extends QuestionBase {
  type: 'error_correction';
  sentence: string;
  acceptedAnswers: string[];
}

export interface TranslationQuestion extends QuestionBase {
  type: 'translation';
  sourceVi: string;
  acceptedAnswers: string[];
}

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | FillBlankQuestion
  | MatchingQuestion
  | OrderingQuestion
  | ErrorCorrectionQuestion
  | TranslationQuestion;

export type ExerciseSkill = 'grammar' | 'vocabulary' | 'reading' | 'listening' | 'writing' | 'developer';

export interface Exercise {
  id: string;
  title: string;
  titleVi: string;
  level: CefrLevel;
  skill: ExerciseSkill;
  description: string;
  estimatedMinutes: number;
  questions: Question[];
}

/** Answer value shape per question type. */
export type AnswerValue =
  | { type: 'multiple_choice'; optionId: string }
  | { type: 'true_false'; value: boolean }
  | { type: 'fill_blank' | 'error_correction' | 'translation'; text: string }
  | { type: 'matching'; pairs: Record<string, string> }
  | { type: 'ordering'; tokens: string[] };

export interface AnswerResult {
  questionId: string;
  correct: boolean;
  answer: AnswerValue;
}
