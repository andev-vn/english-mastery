import { describe, expect, it } from 'vitest';
import { exercises } from '@/data/exercises';
import { lessons } from '@/data/lessons';
import { modules } from '@/data/curriculum';
import { vocabulary } from '@/data/vocabulary';
import type { Lesson } from '@/types/content';
import type { LearnerProfile, LessonProgress } from '@/types/progress';
import { computeStreaks } from './date';
import { lessonStatus, recommendLessons } from './progress';
import { exerciseXp, xpLevel } from './xp';

const profile = (level: LearnerProfile['level']): LearnerProfile => ({ displayName: 'An', level, goal: 'daily', onboarded: true });
const lesson = (id: string, levelId: Lesson['levelId'], order: number): Lesson => ({
  id, levelId, order, moduleId: 'm', title: id, titleVi: id, description: '', objectives: [], blocks: [], vocabularyIds: [], exerciseIds: [], estimatedMinutes: 5,
});

describe('computeStreaks', () => {
  const today = new Date('2026-05-10T12:00:00');
  it('counts consecutive days ending today or yesterday', () => {
    expect(computeStreaks(['2026-05-08', '2026-05-09', '2026-05-10'], today)).toEqual({ current: 3, best: 3 });
    expect(computeStreaks(['2026-05-08', '2026-05-09'], today).current).toBe(2);
  });
  it('breaks after a missed day and keeps the best streak', () => {
    expect(computeStreaks(['2026-05-01', '2026-05-02', '2026-05-03', '2026-05-07'], today)).toEqual({ current: 0, best: 3 });
  });
  it('handles no activity', () => {
    expect(computeStreaks([], today)).toEqual({ current: 0, best: 0 });
  });
});

describe('exerciseXp', () => {
  it('awards XP only for improvement over the previous best', () => {
    expect(exerciseXp(3, 5, 0)).toBe(15);
    expect(exerciseXp(3, 5, 3)).toBe(0);
    expect(exerciseXp(5, 5, 3)).toBe(10 + 10);
    expect(exerciseXp(5, 5, 5)).toBe(0);
  });
  it('xpLevel progresses with thresholds', () => {
    expect(xpLevel(0)).toEqual({ level: 1, current: 0, next: 100 });
    expect(xpLevel(130)).toEqual({ level: 2, current: 30, next: 125 });
  });
});

describe('lessonStatus', () => {
  const c1 = [lesson('c1-a', 'C1', 1), lesson('c1-b', 'C1', 2)];
  it('opens lessons up to one level above the learner', () => {
    expect(lessonStatus(lesson('a', 'A1', 3), [], { lessons: {}, profile: profile('A1') })).toBe('available');
    expect(lessonStatus(lesson('b', 'A2', 3), [], { lessons: {}, profile: profile('A1') })).toBe('available');
  });
  it('unlocks higher levels sequentially within a module', () => {
    const state = { lessons: {}, profile: profile('A1') };
    expect(lessonStatus(c1[0]!, c1, state)).toBe('available');
    expect(lessonStatus(c1[1]!, c1, state)).toBe('locked');
    const done: Record<string, LessonProgress> = { 'c1-a': { lessonId: 'c1-a', status: 'completed', progressPercent: 100, updatedAt: '' } };
    expect(lessonStatus(c1[1]!, c1, { lessons: done, profile: profile('A1') })).toBe('available');
  });
  it('reflects saved progress', () => {
    const p: Record<string, LessonProgress> = { 'c1-b': { lessonId: 'c1-b', status: 'in_progress', progressPercent: 0, updatedAt: '' } };
    expect(lessonStatus(c1[1]!, c1, { lessons: p, profile: profile('A1') })).toBe('in_progress');
  });
});

describe('recommendLessons', () => {
  it('starts A1 learners at the first A1 lesson in curriculum order', () => {
    const rec = recommendLessons(lessons, { lessons: {}, profile: profile('A1') }, 3);
    expect(rec[0]?.id).toBe('l-a1-greetings');
    expect(rec.every((l) => l.levelId === 'A1')).toBe(true);
  });
  it('prioritises in-progress lessons and lessons at the learner level', () => {
    const p: Record<string, LessonProgress> = { 'l-c2-cleft': { lessonId: 'l-c2-cleft', status: 'in_progress', progressPercent: 0, updatedAt: '' } };
    const rec = recommendLessons(lessons, { lessons: p, profile: profile('B1') }, 2);
    expect(rec[0]?.id).toBe('l-c2-cleft');
    expect(rec[1]?.levelId).toBe('B1');
  });
});

describe('seed content references', () => {
  const vocabIds = new Set(vocabulary.map((v) => v.id));
  const exerciseIds = new Set(exercises.map((e) => e.id));
  const moduleIds = new Set(modules.map((m) => m.id));

  it('lessons point to existing modules, words and exercises', () => {
    for (const l of lessons) {
      expect(moduleIds.has(l.moduleId), l.id).toBe(true);
      expect(modules.find((m) => m.id === l.moduleId)?.levelId, l.id).toBe(l.levelId);
      for (const id of l.vocabularyIds) expect(vocabIds.has(id), `${l.id} → ${id}`).toBe(true);
      for (const id of l.exerciseIds) expect(exerciseIds.has(id), `${l.id} → ${id}`).toBe(true);
      for (const b of l.blocks) {
        if (b.type === 'vocabulary') for (const id of b.wordIds) expect(vocabIds.has(id), `${l.id} → ${id}`).toBe(true);
        if (b.type === 'exercise') expect(exerciseIds.has(b.exerciseId), `${l.id} → ${b.exerciseId}`).toBe(true);
      }
    }
  });

  it('ids are unique', () => {
    expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length);
    expect(vocabIds.size).toBe(vocabulary.length);
    expect(new Set(vocabulary.map((v) => v.word.toLowerCase())).size).toBe(vocabulary.length);
  });

  it('every module has at least one lesson', () => {
    for (const m of modules) expect(lessons.some((l) => l.moduleId === m.id), m.id).toBe(true);
  });
});
