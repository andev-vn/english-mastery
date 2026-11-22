import { achievements, type AchievementDefinition } from '@/data/achievements';
import { CEFR_LEVELS, type CefrLevel, type Lesson } from '@/types/content';
import type { LessonStatus, ProgressSnapshot } from '@/types/progress';
import type { ProgressState } from '@/stores/progressStore';
import { computeStreaks, lastDays, toDayKey } from './date';
import { isDue, isLearned } from './srs';

type Data = Pick<ProgressState, 'lessons' | 'attempts' | 'cards' | 'studyDays' | 'totalXp' | 'profile'>;

export function snapshot(state: Data, today: Date = new Date()): ProgressSnapshot {
  const streaks = computeStreaks(Object.keys(state.studyDays), today);
  const cards = Object.values(state.cards);
  return {
    totalXp: state.totalXp,
    completedLessons: Object.values(state.lessons).filter((l) => l.status === 'completed').length,
    currentStreak: streaks.current,
    bestStreak: streaks.best,
    perfectExercises: new Set(state.attempts.filter((a) => a.total > 0 && a.correct === a.total).map((a) => a.exerciseId)).size,
    wordsLearned: cards.filter(isLearned).length,
    totalMinutes: Object.values(state.studyDays).reduce((sum, m) => sum + m, 0),
  };
}

export function dueCardCount(state: Pick<ProgressState, 'cards'>, now: Date = new Date()): number {
  return Object.values(state.cards).filter((c) => isDue(c, now)).length;
}

export function weeklyMinutes(state: Pick<ProgressState, 'studyDays'>, today: Date = new Date()) {
  return lastDays(7, today).map((day) => ({ day, minutes: state.studyDays[day] ?? 0 }));
}

export function todayMinutes(state: Pick<ProgressState, 'studyDays'>, today: Date = new Date()): number {
  return state.studyDays[toDayKey(today)] ?? 0;
}

export function levelIndex(level: CefrLevel): number {
  return CEFR_LEVELS.indexOf(level);
}

/**
 * Lesson availability:
 * - Lessons at or below the learner's level are always open (free review & exploration).
 * - Lessons at the next level are open too, so learners can stretch themselves.
 * - Higher levels unlock sequentially inside each module: lesson n opens after lesson n-1 is completed.
 */
export function lessonStatus(lesson: Lesson, moduleLessons: Lesson[], state: Pick<ProgressState, 'lessons' | 'profile'>): LessonStatus {
  const progress = state.lessons[lesson.id];
  if (progress) return progress.status;
  if (levelIndex(lesson.levelId) <= levelIndex(state.profile.level) + 1) return 'available';
  const ordered = [...moduleLessons].sort((a, b) => a.order - b.order);
  const index = ordered.findIndex((l) => l.id === lesson.id);
  if (index <= 0) return 'available';
  const previous = ordered[index - 1];
  return previous && state.lessons[previous.id]?.status === 'completed' ? 'available' : 'locked';
}

export interface AchievementStatus {
  definition: AchievementDefinition;
  value: number;
  unlocked: boolean;
}

export function achievementStatuses(snap: ProgressSnapshot): AchievementStatus[] {
  return achievements.map((definition) => {
    const value = definition.measure(snap);
    return { definition, value: Math.min(value, definition.goal), unlocked: value >= definition.goal };
  });
}

/** Picks the next lessons to recommend: in-progress first, then the first unfinished lessons at the learner's level. */
export function recommendLessons(all: Lesson[], state: Pick<ProgressState, 'lessons' | 'profile'>, limit = 3): Lesson[] {
  const inProgress = all.filter((l) => state.lessons[l.id]?.status === 'in_progress');
  const target = levelIndex(state.profile.level);
  // `all` is in curriculum order; keep that order among lessons equally close to the learner's level.
  const position = new Map(all.map((l, i) => [l.id, i]));
  const distance = (l: Lesson) => {
    const d = levelIndex(l.levelId) - target;
    return d < 0 ? -d + 0.5 : d;
  };
  const fresh = all
    .filter((l) => !state.lessons[l.id])
    .sort((a, b) => distance(a) - distance(b) || position.get(a.id)! - position.get(b.id)!);
  return [...inProgress, ...fresh].slice(0, limit);
}
