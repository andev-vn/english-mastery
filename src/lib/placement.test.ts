import { describe, expect, it } from 'vitest';
import { placementTest } from '@/data/assessments';
import { gradeAnswer } from '@/lib/grading';
import { CEFR_LEVELS, type AnswerValue, type CefrLevel, type Question } from '@/types/content';
import { scorePlacement } from './placement';

const qs = placementTest.questions;
/** Marks questions correct by level: e.g. { A1: 4, A2: 3 } → first n questions of each level correct. */
function answers(correctPerLevel: Partial<Record<CefrLevel, number>>) {
  const seen: Partial<Record<CefrLevel, number>> = {};
  return qs.map((q) => {
    seen[q.level] = (seen[q.level] ?? 0) + 1;
    return { questionId: q.id, correct: seen[q.level]! <= (correctPerLevel[q.level] ?? 0) };
  });
}

describe('placement test content', () => {
  it('has 4 questions per level, unique ids and covers all five skills', () => {
    for (const level of CEFR_LEVELS) expect(qs.filter((q) => q.level === level).length, level).toBe(4);
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
    expect(new Set(qs.map((q) => q.skill))).toEqual(new Set(['vocabulary', 'grammar', 'reading', 'listening', 'writing']));
  });

  it('every question is answerable by its own key', () => {
    const key = (q: Question): AnswerValue => {
      switch (q.type) {
        case 'multiple_choice':
          return { type: q.type, optionId: q.correctOptionId };
        case 'true_false':
          return { type: q.type, value: q.answer };
        case 'matching':
          return { type: q.type, pairs: Object.fromEntries(q.pairs.map((p) => [p.left, p.right])) };
        case 'ordering':
          return { type: q.type, tokens: q.tokens };
        default:
          return { type: q.type, text: q.acceptedAnswers[0]! };
      }
    };
    for (const q of qs) expect(gradeAnswer(q, key(q)), q.id).toBe(true);
  });

  it('listening questions carry audio text', () => {
    for (const q of qs.filter((x) => x.skill === 'listening')) expect(q.audioText, q.id).toBeTruthy();
  });
});

describe('scorePlacement', () => {
  it('places a learner who knows nothing at A1', () => {
    const s = scorePlacement(qs, answers({}));
    expect(s.masteredLevel).toBeNull();
    expect(s.estimatedLevel).toBe('A1');
    expect(s.score).toBe(0);
  });

  it('recommends the level after the highest consecutive mastered level', () => {
    const s = scorePlacement(qs, answers({ A1: 4, A2: 3, B1: 2 }));
    expect(s.masteredLevel).toBe('A2');
    expect(s.estimatedLevel).toBe('B1');
  });

  it('does not skip a failed level because of lucky answers above it', () => {
    const s = scorePlacement(qs, answers({ A1: 4, A2: 1, B1: 4, B2: 4 }));
    expect(s.masteredLevel).toBe('A1');
    expect(s.estimatedLevel).toBe('A2');
  });

  it('caps at C2 when everything is correct', () => {
    const s = scorePlacement(qs, answers({ A1: 4, A2: 4, B1: 4, B2: 4, C1: 4, C2: 4 }));
    expect(s.masteredLevel).toBe('C2');
    expect(s.estimatedLevel).toBe('C2');
    expect(s.score).toBe(100);
    expect(s.weaknesses).toEqual([]);
  });

  it('reports per-skill strengths and weaknesses', () => {
    const results = qs.map((q) => ({ questionId: q.id, correct: q.skill === 'grammar' || q.skill === 'vocabulary' }));
    const s = scorePlacement(qs, results);
    expect(s.strengths.sort()).toEqual(['grammar', 'vocabulary']);
    expect(s.weaknesses.sort()).toEqual(['listening', 'reading', 'writing']);
    expect(s.skillScores.grammar).toEqual({ correct: 6, total: 6 });
  });

  it('treats unanswered questions as incorrect', () => {
    expect(scorePlacement(qs, []).correct).toBe(0);
  });
});
