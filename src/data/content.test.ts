import { describe, expect, it } from 'vitest';
import type { CefrLevel } from '@/types/content';
import { modules, levels } from './curriculum';
import { exercises } from './exercises';
import { grammarTopics } from './grammar';
import { lessons } from './lessons';
import { vocabulary, vocabularyTopics } from './vocabulary';

const lessonsAt = (level: CefrLevel) => lessons.filter((l) => l.levelId === level);
const modulesAt = (level: CefrLevel) => modules.filter((m) => m.levelId === level);
const questionsAt = (level: CefrLevel) => exercises.filter((e) => e.level === level).reduce((n, e) => n + e.questions.length, 0);
const wordsAt = (level: CefrLevel) => vocabulary.filter((v) => v.level === level).length;

/** Initial content targets from the product spec (PART 9). */
describe('content targets', () => {
  it('A1: ≥ 5 modules with ≥ 3 lessons each, ≥ 100 words, ≥ 50 questions', () => {
    expect(modulesAt('A1').length).toBeGreaterThanOrEqual(5);
    for (const m of modulesAt('A1')) expect(lessons.filter((l) => l.moduleId === m.id).length, m.id).toBeGreaterThanOrEqual(3);
    expect(wordsAt('A1')).toBeGreaterThanOrEqual(100);
    expect(questionsAt('A1')).toBeGreaterThanOrEqual(50);
  });

  it('A2: ≥ 3 modules, ≥ 10 lessons, ≥ 50 words, ≥ 30 questions', () => {
    expect(modulesAt('A2').length).toBeGreaterThanOrEqual(3);
    expect(lessonsAt('A2').length).toBeGreaterThanOrEqual(10);
    expect(wordsAt('A2')).toBeGreaterThanOrEqual(50);
    expect(questionsAt('A2')).toBeGreaterThanOrEqual(30);
  });

  it('B1–C2 each have at least one sample module', () => {
    for (const level of ['B1', 'B2', 'C1', 'C2'] as const) expect(modulesAt(level).length, level).toBeGreaterThan(0);
  });
});

describe('content consistency', () => {
  it('every lesson has an objective, Vietnamese title and at least one exercise', () => {
    for (const l of lessons) {
      expect(l.objectives.length, l.id).toBeGreaterThan(0);
      expect(l.titleVi.length, l.id).toBeGreaterThan(0);
      expect(l.exerciseIds.length, l.id).toBeGreaterThan(0);
    }
  });

  it('lesson order is unique within each module', () => {
    for (const m of modules) {
      const orders = lessons.filter((l) => l.moduleId === m.id).map((l) => l.order);
      expect(new Set(orders).size, m.id).toBe(orders.length);
    }
  });

  it('lessons are listed in curriculum order (level → module → lesson)', () => {
    const levelIdx = new Map(levels.map((l) => [l.id, l.order]));
    const moduleIdx = new Map(modules.map((m) => [m.id, m.order]));
    const keys = lessons.map((l) => [levelIdx.get(l.levelId)!, moduleIdx.get(l.moduleId)!, l.order]);
    const sorted = [...keys].sort((a, b) => a[0]! - b[0]! || a[1]! - b[1]! || a[2]! - b[2]!);
    expect(keys).toEqual(sorted);
  });

  it('vocabulary uses known topics and IPA notation', () => {
    const topics = new Set(vocabularyTopics.map((t) => t.id));
    for (const v of vocabulary) {
      expect(topics.has(v.topic), v.id).toBe(true);
      expect(v.ipa, v.id).toMatch(/^\/.+\/$/);
    }
  });

  it('grammar topics point to existing lessons of the same level', () => {
    expect(new Set(grammarTopics.map((g) => g.id)).size).toBe(grammarTopics.length);
    for (const g of grammarTopics) {
      const lesson = lessons.find((l) => l.id === g.lessonId);
      expect(lesson, g.id).toBeDefined();
      expect(lesson?.levelId, g.id).toBe(g.level);
    }
  });
});
