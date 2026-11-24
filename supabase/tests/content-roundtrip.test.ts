// @vitest-environment node
/**
 * Round-trip: bundled content → generated seed → Postgres → assembleDataset() must equal the
 * bundled content. Guarantees that switching the app to database content changes nothing.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assembleDataset, type ContentRows } from '../../src/services/content/assemble';
import { loadBundledDataset, type ContentDataset } from '../../src/services/content/dataset';
import { buildSeedSql } from '../../scripts/seed-sql';

const dir = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const read = (p: string) => readFileSync(dir(p), 'utf8');

let db: PGlite;
let fromDb: ContentDataset;
let bundled: ContentDataset;

async function rows<T>(table: string): Promise<T[]> {
  return (await db.query<T>(`select * from public.${table}`)).rows;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(read('./supabase-shim.sql'));
  for (const file of readdirSync(dir('../migrations')).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(read(`../migrations/${file}`));
  }
  await db.exec(buildSeedSql());
  // Read as a guest, exactly like the app's publishable key does.
  await db.exec(`set role anon;`);
  const contentRows: ContentRows = {
    levels: await rows('cefr_levels'),
    modules: await rows('modules'),
    lessons: await rows('lessons'),
    lessonContents: await rows('lesson_contents'),
    vocabularyTopics: await rows('vocabulary_topics'),
    vocabulary: await rows('vocabulary'),
    exercises: await rows('exercises'),
    questions: await rows('questions'),
    answerOptions: await rows('answer_options'),
    grammarTopics: await rows('grammar_topics'),
    assessments: await rows('assessments'),
    assessmentQuestions: await rows('assessment_questions'),
    activities: await rows('skill_activities'),
  };
  fromDb = assembleDataset(contentRows);
  bundled = await loadBundledDataset();
}, 60_000);

afterAll(async () => {
  await db?.close();
});

const byId = <T extends { id: string }>(items: T[]) => [...items].sort((a, b) => a.id.localeCompare(b.id));

describe('content round-trip through Postgres', () => {
  it('levels and modules', () => {
    expect(fromDb.levels).toEqual(bundled.levels);
    expect(fromDb.modules).toEqual(bundled.modules);
  });

  it('lessons, including every content block, in curriculum order', () => {
    expect(fromDb.lessons).toEqual(bundled.lessons);
  });

  it('vocabulary and topics', () => {
    expect(fromDb.vocabulary).toEqual(bundled.vocabulary);
    expect(byId(fromDb.vocabularyTopics)).toEqual(byId(bundled.vocabularyTopics));
  });

  it('exercises with all 7 question types', () => {
    expect(byId(fromDb.exercises)).toEqual(byId(bundled.exercises));
    const types = new Set(fromDb.exercises.flatMap((e) => e.questions.map((q) => q.type)));
    expect(types.size).toBe(7);
  });

  it('grammar topics', () => {
    expect(fromDb.grammarTopics).toEqual(bundled.grammarTopics);
  });

  it('skill activities (listening, speaking, reading, writing)', () => {
    expect(fromDb.activities).toEqual(bundled.activities);
    expect(new Set(fromDb.activities.map((a) => a.skill)).size).toBe(4);
  });

  it('assessments, including listening audio text', () => {
    expect(fromDb.assessments).toEqual(bundled.assessments);
    expect(fromDb.assessments[0]?.questions.some((q) => q.audioText)).toBe(true);
  });
});

describe('assembleDataset validation', () => {
  it('rejects values outside the expected enums', () => {
    expect(() =>
      assembleDataset({
        levels: [{ id: 'Z9', name: 'x', name_vi: 'x', description: '', sort_order: 1 }],
        modules: [],
        lessons: [],
        lessonContents: [],
        vocabularyTopics: [],
        vocabulary: [],
        exercises: [],
        questions: [],
        answerOptions: [],
        grammarTopics: [],
        assessments: [],
        assessmentQuestions: [],
        activities: [],
      }),
    ).toThrow(/Unexpected CEFR level/);
  });
});
