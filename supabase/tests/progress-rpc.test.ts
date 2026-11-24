// @vitest-environment node
/**
 * Server-validated progress RPCs: grading parity with src/lib/grading.ts, XP rules (src/lib/xp.ts),
 * idempotency, streaks, achievements, placement scoring parity (src/lib/placement.ts) and privileges.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { placementTest } from '../../src/data/assessments';
import { exercises } from '../../src/data/exercises';
import { gradeAnswer, normalizeAnswer } from '../../src/lib/grading';
import { scorePlacement } from '../../src/lib/placement';
import { exerciseXp } from '../../src/lib/xp';
import type { AnswerValue, Question } from '../../src/types/content';
import { buildSeedSql } from '../../scripts/seed-sql';

const dir = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const read = (p: string) => readFileSync(dir(p), 'utf8');

const USER = '00000000-0000-4000-8000-0000000000d1';
const OTHER = '00000000-0000-4000-8000-0000000000d2';
let db: PGlite;
let opSeq = 0;
const op = () => `00000000-0000-4000-9000-${String(++opSeq).padStart(12, '0')}`;

async function as(role: 'anon' | 'authenticated', sub: string | null) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${sub ?? ''}', false); set role ${role};`);
}
const asAdmin = () => db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);

type Json = Record<string, unknown>;
async function rpc(fn: string, args: unknown[]): Promise<Json> {
  const params = args.map((_, i) => `$${i + 1}`).join(', ');
  const values = args.map((a) => (a !== null && typeof a === 'object' ? JSON.stringify(a) : a));
  const { rows } = await db.query<{ r: Json }>(`select public.${fn}(${params}) as r`, values);
  return rows[0]!.r;
}

/** The correct answer for a question, in the client's AnswerValue shape. */
function keyFor(q: Question): AnswerValue {
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
}

/** A plausible wrong answer for a question. */
function wrongFor(q: Question): AnswerValue {
  switch (q.type) {
    case 'multiple_choice':
      return { type: q.type, optionId: q.options.find((o) => o.id !== q.correctOptionId)!.id };
    case 'true_false':
      return { type: q.type, value: !q.answer };
    case 'matching':
      return { type: q.type, pairs: Object.fromEntries(q.pairs.map((p, i) => [p.left, q.pairs[(i + 1) % q.pairs.length]!.right])) };
    case 'ordering':
      return { type: q.type, tokens: [...q.tokens].reverse() };
    default:
      return { type: q.type, text: 'definitely wrong' };
  }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(read('./supabase-shim.sql'));
  for (const file of readdirSync(dir('../migrations')).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(read(`../migrations/${file}`));
  }
  await db.exec(buildSeedSql());
  await db.exec(`insert into auth.users (id, email) values ('${USER}', 'd1@example.test'), ('${OTHER}', 'd2@example.test');`);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

beforeEach(() => as('authenticated', USER));

describe('privileges', () => {
  it('guests cannot call progress RPCs', async () => {
    await as('anon', null);
    await expect(rpc('complete_lesson', ['l-a1-greetings', op(), 'UTC'])).rejects.toThrow(/permission denied/);
    await expect(rpc('get_progress_summary', ['UTC'])).rejects.toThrow(/permission denied/);
  });

  it('internal helpers are not callable by users', async () => {
    await expect(db.query(`select public.grade_answer('true_false', '{}', null, '{}')`)).rejects.toThrow(/permission denied/);
    await expect(db.query(`select public._unlock_achievements('${USER}')`)).rejects.toThrow(/permission denied/);
  });

  it('users still cannot write the XP ledger directly', async () => {
    await expect(
      db.exec(`insert into public.study_sessions (user_id, kind, xp, client_op_id) values ('${USER}', 'lesson', 999, gen_random_uuid())`),
    ).rejects.toThrow(/permission denied|row-level security/);
  });
});

describe('normalize_answer parity', () => {
  it.each([
    '  I’m   Fine.  ',
    'Are you a teacher ?',
    'WE ARE FRIENDS!!!',
    '“Quoted”   text…',
    "Nam's",
    '',
    'Hello,  world ,how are you ?',
  ])('matches normalizeAnswer(%j)', async (input) => {
    await asAdmin();
    const { rows } = await db.query<{ v: string }>('select public.normalize_answer($1) as v', [input]);
    expect(rows[0]!.v).toBe(normalizeAnswer(input));
  });
});

describe('grading parity: SQL grader vs TypeScript grader for every exercise question', () => {
  const all = exercises.flatMap((e) => e.questions.map((q) => ({ exercise: e.id, q })));

  it(`agrees on correct, wrong and messy answers for all ${all.length} questions`, async () => {
    await asAdmin();
    const variants = (q: Question): AnswerValue[] => {
      const key = keyFor(q);
      const extra: AnswerValue[] = [key, wrongFor(q), { type: 'multiple_choice', optionId: 'zzz' }];
      if ('text' in key) extra.push({ ...key, text: `  ${key.text.replace(/'/g, '’').toUpperCase()}  ` });
      return extra;
    };
    for (const { exercise, q } of all) {
      const { rows: qrow } = await db.query<{ type: string; payload: unknown; opt: string | null }>(
        `select type, payload, (select option_key from public.answer_options o where o.question_id = q.id and o.is_correct) as opt
         from public.questions q where id = $1`,
        [`${exercise}:${q.id}`],
      );
      const row = qrow[0]!;
      for (const answer of variants(q)) {
        const { rows } = await db.query<{ ok: boolean }>('select public.grade_answer($1, $2, $3, $4) as ok', [
          row.type,
          JSON.stringify(row.payload),
          row.opt,
          JSON.stringify(answer),
        ]);
        expect(rows[0]!.ok, `${exercise}:${q.id} ${JSON.stringify(answer)}`).toBe(gradeAnswer(q, answer));
      }
    }
  });
});

describe('complete_lesson', () => {
  it('awards 20 XP the first time only and is idempotent per operation', async () => {
    const first = op();
    const a = await rpc('complete_lesson', ['l-a1-greetings', first, 'Asia/Ho_Chi_Minh']);
    expect(a).toMatchObject({ xp: 20, duplicate: false, totalXp: 20, currentStreak: 1 });
    expect(a.completedLessonIds).toContain('l-a1-greetings');
    expect(a.newAchievements).toEqual(['first-lesson']);

    expect(await rpc('complete_lesson', ['l-a1-greetings', first, 'Asia/Ho_Chi_Minh'])).toMatchObject({ xp: 20, duplicate: true, totalXp: 20 });
    expect(await rpc('complete_lesson', ['l-a1-greetings', op(), 'Asia/Ho_Chi_Minh'])).toMatchObject({ xp: 0, totalXp: 20 });
  });

  it('cannot be farmed by deleting the (client-editable) lesson progress row', async () => {
    await db.exec(`delete from public.user_lessons where lesson_id = 'l-a1-greetings'`);
    expect(await rpc('complete_lesson', ['l-a1-greetings', op(), 'UTC'])).toMatchObject({ xp: 0, totalXp: 20 });
  });

  it('rejects unknown lessons and tolerates unknown time zones', async () => {
    await expect(rpc('complete_lesson', ['l-does-not-exist', op(), 'UTC'])).rejects.toThrow(/Unknown lesson/);
    expect(await rpc('complete_lesson', ['l-a1-to-be', op(), 'Mars/Olympus'])).toMatchObject({ xp: 20 });
  });
});

describe('submit_exercise', () => {
  const ex = exercises.find((e) => e.id === 'ex-a1-to-be')!;
  const answersWith = (correctCount: number) =>
    Object.fromEntries(ex.questions.map((q, i) => [q.id, i < correctCount ? keyFor(q) : wrongFor(q)]));

  it('grades on the server and applies the same XP rules as the client', async () => {
    let best = 0;
    for (const correct of [3, 3, ex.questions.length, ex.questions.length]) {
      const r = await rpc('submit_exercise', [ex.id, answersWith(correct), 120, op(), 'UTC']);
      expect(r.correct).toBe(correct);
      expect(r.total).toBe(ex.questions.length);
      expect(r.xp).toBe(exerciseXp(correct, ex.questions.length, best));
      best = Math.max(best, correct);
    }
  });

  it('ignores client claims: answers are re-graded, missing answers count as wrong', async () => {
    const r = await rpc('submit_exercise', ['ex-a1-greetings', { q1: { type: 'multiple_choice', optionId: 'a' } }, 30, op(), 'UTC']);
    expect(r).toMatchObject({ correct: 1, total: 5, score: 20 });
  });

  it('records answers and replays idempotently', async () => {
    const id = op();
    const first = await rpc('submit_exercise', ['ex-a1-articles', answersWith(0), 60, id, 'UTC']);
    const again = await rpc('submit_exercise', ['ex-a1-articles', answersWith(0), 60, id, 'UTC']);
    expect(again).toMatchObject({ duplicate: true, xp: first.xp });
    const { rows } = await db.query<{ n: number }>(`select count(*)::int as n from public.user_answers where attempt_id = $1`, [id]);
    expect(rows[0]!.n).toBeGreaterThan(0);
  });

  it('unlocks the perfect-score achievement', async () => {
    const { rows } = await db.query<{ achievement_id: string }>(`select achievement_id from public.user_achievements order by 1`);
    expect(rows.map((r) => r.achievement_id)).toContain('perfect-score');
  });
});

describe('record_reviews', () => {
  it('awards 2 XP per recalled card with a daily cap', async () => {
    await as('authenticated', OTHER);
    expect(await rpc('record_reviews', [10, 8, 120, op(), 'UTC'])).toMatchObject({ xp: 16 });
    expect(await rpc('record_reviews', [100, 100, 600, op(), 'UTC'])).toMatchObject({ xp: 104 }); // cap: 120 per day
    expect(await rpc('record_reviews', [5, 5, 60, op(), 'UTC'])).toMatchObject({ xp: 0 });
    await expect(rpc('record_reviews', [0, 0, 0, op(), 'UTC'])).rejects.toThrow(/Nothing reviewed/);
  });
});

describe('streaks', () => {
  it('extends on consecutive days, restarts after a gap and ignores past days', async () => {
    await asAdmin();
    const U = '00000000-0000-4000-8000-0000000000d3';
    await db.exec(`insert into auth.users (id) values ('${U}')`);
    const touch = (d: string) => db.exec(`select public._touch_streak('${U}', '${d}')`);
    const streak = async () =>
      (await db.query<{ c: number; b: number }>(`select current_streak c, best_streak b from public.learning_streaks where user_id = '${U}'`)).rows[0];
    await touch('2026-03-01');
    await touch('2026-03-02');
    await touch('2026-03-02');
    expect(await streak()).toEqual({ c: 2, b: 2 });
    await touch('2026-03-05');
    expect(await streak()).toEqual({ c: 1, b: 2 });
    await touch('2026-03-01');
    expect(await streak()).toEqual({ c: 1, b: 2 });
  });
});

describe('submit_assessment', () => {
  const qs = placementTest.questions;
  const patterns: Record<string, (i: number, level: string) => boolean> = {
    none: () => false,
    all: () => true,
    'A1+A2 only': (_i, level) => level === 'A1' || level === 'A2',
    'gap at A2': (_i, level) => level !== 'A2',
    'alternating': (i) => i % 2 === 0,
  };

  it.each(Object.keys(patterns))('matches scorePlacement for pattern "%s"', async (name) => {
    const pick = patterns[name]!;
    const answers = Object.fromEntries(qs.map((q, i) => [q.id, pick(i, q.level) ? keyFor(q) : wrongFor(q)]));
    const server = await rpc('submit_assessment', [placementTest.id, answers, 300, op(), 'UTC']);
    const client = scorePlacement(qs, qs.map((q, i) => ({ questionId: q.id, correct: pick(i, q.level) })));
    expect(server).toMatchObject({
      estimatedLevel: client.estimatedLevel,
      masteredLevel: client.masteredLevel,
      score: client.score,
      correct: client.correct,
    });
    for (const [skill, tally] of Object.entries(client.skillScores)) {
      expect((server.skillScores as Record<string, number>)[skill], skill).toBe(Math.round((tally.correct / tally.total) * 100));
    }
  });

  it('stores results that the user (and only the user) can read', async () => {
    const { rows } = await db.query<{ n: number }>(`select count(*)::int as n from public.assessment_results`);
    expect(rows[0]!.n).toBe(Object.keys(patterns).length);
    await as('authenticated', OTHER);
    const other = await db.query<{ n: number }>(`select count(*)::int as n from public.assessment_results`);
    expect(other.rows[0]!.n).toBe(0);
  });
});

describe('get_progress_summary', () => {
  it('returns totals, completed lessons, achievements and recent days', async () => {
    const s = await rpc('get_progress_summary', ['Asia/Ho_Chi_Minh']);
    expect(s.totalXp).toBeGreaterThan(0);
    expect(s.completedLessonIds).toEqual(expect.arrayContaining(['l-a1-greetings', 'l-a1-to-be']));
    expect(s.achievementIds).toEqual(expect.arrayContaining(['first-lesson', 'perfect-score']));
    expect(Array.isArray(s.days) && (s.days as unknown[]).length).toBeGreaterThan(0);
    expect(s.currentStreak).toBe(1);
  });
});
