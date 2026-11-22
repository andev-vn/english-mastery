import type { CefrLevel } from './content';

export type LessonStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface LessonProgress {
  lessonId: string;
  status: Exclude<LessonStatus, 'locked'>;
  progressPercent: number;
  completedAt?: string;
  updatedAt: string;
}

export interface ExerciseAttempt {
  id: string;
  exerciseId: string;
  score: number;
  correct: number;
  total: number;
  durationSeconds: number;
  completedAt: string;
}

/** Spaced-repetition state for a single word (SM-2 inspired). */
export interface ReviewCard {
  wordId: string;
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  lastReviewedAt?: string;
  nextReviewAt: string;
  lapses: number;
  favorite: boolean;
}

export type ActivityKind = 'lesson' | 'exercise' | 'review';

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  refId: string;
  title: string;
  xp: number;
  minutes: number;
  at: string;
}

/** Aggregates used by achievements and the dashboard. */
export interface ProgressSnapshot {
  totalXp: number;
  completedLessons: number;
  currentStreak: number;
  bestStreak: number;
  perfectExercises: number;
  wordsLearned: number;
  totalMinutes: number;
}

export type LearningGoal = 'work' | 'travel' | 'study' | 'interview' | 'daily';

export interface LearnerProfile {
  displayName: string;
  level: CefrLevel;
  goal: LearningGoal;
  onboarded: boolean;
}
