import { describe, expect, it } from 'vitest';
import { exercises } from '@/data/exercises';
import { QUESTION_TYPES, type Question } from '@/types/content';
import { correctAnswerText, gradeAnswer, joinTokens, matchesAny, normalizeAnswer, seededShuffle } from './grading';

describe('normalizeAnswer', () => {
  it('ignores case, extra spaces, curly apostrophes and final punctuation', () => {
    expect(normalizeAnswer('  I’m   Fine.  ')).toBe("i'm fine");
    expect(normalizeAnswer('Are you a teacher ?')).toBe('are you a teacher');
  });
  it('rejects empty input', () => {
    expect(matchesAny('   ', [''])).toBe(false);
  });
});

describe('gradeAnswer', () => {
  const mc: Question = {
    id: 'q', type: 'multiple_choice', prompt: '', explanationVi: '',
    options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctOptionId: 'b',
  };
  it('multiple choice', () => {
    expect(gradeAnswer(mc, { type: 'multiple_choice', optionId: 'b' })).toBe(true);
    expect(gradeAnswer(mc, { type: 'multiple_choice', optionId: 'a' })).toBe(false);
  });

  it('free text accepts listed variants', () => {
    const q: Question = { id: 'q', type: 'translation', prompt: '', explanationVi: '', sourceVi: '', acceptedAnswers: ['We are friends.', "We're friends."] };
    expect(gradeAnswer(q, { type: 'translation', text: "we’re friends" })).toBe(true);
    expect(gradeAnswer(q, { type: 'translation', text: 'We is friends' })).toBe(false);
  });

  it('matching requires every pair to be correct', () => {
    const q: Question = { id: 'q', type: 'matching', prompt: '', explanationVi: '', pairs: [{ left: 'a', right: '1' }, { left: 'b', right: '2' }] };
    expect(gradeAnswer(q, { type: 'matching', pairs: { a: '1', b: '2' } })).toBe(true);
    expect(gradeAnswer(q, { type: 'matching', pairs: { a: '2', b: '1' } })).toBe(false);
    expect(gradeAnswer(q, { type: 'matching', pairs: { a: '1' } })).toBe(false);
  });

  it('ordering compares the exact sequence', () => {
    const q: Question = { id: 'q', type: 'ordering', prompt: '', explanationVi: '', tokens: ['I', 'am', 'here'] };
    expect(gradeAnswer(q, { type: 'ordering', tokens: ['I', 'am', 'here'] })).toBe(true);
    expect(gradeAnswer(q, { type: 'ordering', tokens: ['am', 'I', 'here'] })).toBe(false);
  });

  it('rejects an answer of the wrong type', () => {
    expect(gradeAnswer(mc, { type: 'true_false', value: true })).toBe(false);
  });
});

describe('seededShuffle', () => {
  it('is deterministic and never returns the original order', () => {
    const items = ['a', 'b', 'c', 'd'];
    expect(seededShuffle(items, 'x')).toEqual(seededShuffle(items, 'x'));
    expect(seededShuffle(items, 'x')).not.toEqual(items);
    expect([...seededShuffle(items, 'x')].sort()).toEqual(items);
    expect(seededShuffle(['a', 'b'], 'any')).toEqual(['b', 'a']);
  });
});

describe('joinTokens', () => {
  it('attaches punctuation', () => {
    expect(joinTokens(['Are', 'you', 'ok', '?'])).toBe('Are you ok?');
  });
});

describe('seed exercise data integrity', () => {
  const all = exercises.flatMap((e) => e.questions.map((q) => ({ exercise: e.id, q })));

  it('uses only known question types and unique ids', () => {
    for (const e of exercises) {
      expect(new Set(e.questions.map((q) => q.id)).size).toBe(e.questions.length);
    }
    expect(new Set(exercises.map((e) => e.id)).size).toBe(exercises.length);
    for (const { q } of all) expect(QUESTION_TYPES).toContain(q.type);
  });

  it('every question is answerable by its own correct answer', () => {
    for (const { exercise, q } of all) {
      const answer = (() => {
        switch (q.type) {
          case 'multiple_choice':
            return { type: q.type, optionId: q.correctOptionId } as const;
          case 'true_false':
            return { type: q.type, value: q.answer } as const;
          case 'matching':
            return { type: q.type, pairs: Object.fromEntries(q.pairs.map((p) => [p.left, p.right])) } as const;
          case 'ordering':
            return { type: q.type, tokens: q.tokens } as const;
          default:
            return { type: q.type, text: q.acceptedAnswers[0] ?? '' } as const;
        }
      })();
      expect(gradeAnswer(q, answer), `${exercise}/${q.id}`).toBe(true);
      expect(correctAnswerText(q).length, `${exercise}/${q.id}`).toBeGreaterThan(0);
    }
  });

  it('fill-in-the-blank sentences contain exactly one blank', () => {
    for (const { q } of all) if (q.type === 'fill_blank') expect(q.sentence.split('___').length).toBe(2);
  });

  it('multiple-choice correct option exists', () => {
    for (const { q } of all) if (q.type === 'multiple_choice') expect(q.options.map((o) => o.id)).toContain(q.correctOptionId);
  });
});
