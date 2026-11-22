// @vitest-environment node
/**
 * Schema, constraint and Row Level Security tests.
 * Runs the real migrations + generated seed in an in-process Postgres (PGlite) with a Supabase shim.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { exercises } from '../../src/data/exercises';
import { lessons } from '../../src/data/lessons';
import { vocabulary } from '../../src/data/vocabulary';
import { buildSeedSql } from '../../scripts/seed-sql';

const dir = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const read = (p: string) => readFileSync(dir(p), 'utf8');

const ALICE = '00000000-0000-4000-8000-00000000000a';
const BOB = '00000000-0000-4000-8000-00000000000b';

let db: PGlite;

async function asRole(role: 'anon' | 'authenticated', sub: string | null) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${sub ?? ''}', false); set role ${role};`);
}
const asAnon = () => asRole('anon', null);
const asUser = (id: string) => asRole('authenticated', id);
const asAdmin = () => db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
/** Writes may be refused by missing privileges (grants) or by RLS — both are a denial. */
const DENIED = /row-level security|permission denied/;
const count = async (sql: string) => Number((await db.query<{ n: number }>(`select count(*)::int as n from (${sql}) t`)).rows[0]!.n);

beforeAll(async () => {
  db = new PGlite();
  await db.exec(read('./supabase-shim.sql'));
  const migrations = readdirSync(dir('../migrations')).filter((f) => f.endsWith('.sql')).sort();
  for (const file of migrations) await db.exec(read(`../migrations/${file}`));
  await db.exec(buildSeedSql());
  // Sign-ups happen in auth.users; the trigger must create the profile rows.
  await db.exec(`
    insert into auth.users (id, email, raw_user_meta_data) values
      ('${ALICE}', 'alice@example.test', '{"display_name": "Alice"}'),
      ('${BOB}', 'bob@example.test', '{}');
  `);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

beforeEach(asAdmin);

describe('seed', () => {
  it('loads all published content', async () => {
    expect(await count('select * from public.lessons')).toBe(lessons.length);
    expect(await count('select * from public.vocabulary')).toBe(vocabulary.length);
    expect(await count('select * from public.questions')).toBe(exercises.reduce((n, e) => n + e.questions.length, 0));
    expect(await count('select * from public.lesson_contents')).toBe(lessons.reduce((n, l) => n + l.blocks.length, 0));
  });

  it('is idempotent', async () => {
    await db.exec(buildSeedSql());
    expect(await count('select * from public.lessons')).toBe(lessons.length);
  });
});

describe('new user trigger', () => {
  it('creates profile, goal and streak rows', async () => {
    const { rows } = await db.query<{ display_name: string; cefr_level: string; onboarded: boolean }>(
      `select display_name, cefr_level, onboarded from public.profiles where id = '${ALICE}'`,
    );
    expect(rows[0]).toEqual({ display_name: 'Alice', cefr_level: 'A1', onboarded: false });
    expect(await count(`select * from public.learning_goals where user_id = '${BOB}'`)).toBe(1);
    expect(await count(`select * from public.learning_streaks where user_id = '${BOB}'`)).toBe(1);
  });
});

describe('RLS: published content', () => {
  it('guests can read content but not write it', async () => {
    await asAnon();
    expect(await count('select * from public.lessons')).toBe(lessons.length);
    expect(await count('select * from public.answer_options')).toBeGreaterThan(0);
    await expect(db.exec(`insert into public.vocabulary_topics (id, name, name_vi) values ('hack', 'x', 'x')`)).rejects.toThrow(DENIED);
    await expect(db.exec(`update public.lessons set title = 'hacked'`)).rejects.toThrow(DENIED);
    await asAdmin();
    expect(await count(`select * from public.lessons where title = 'hacked'`)).toBe(0);
  });

  it('unpublished content is hidden', async () => {
    await db.exec(`update public.lessons set is_published = false where id = 'l-c2-cleft'`);
    await asAnon();
    expect(await count(`select * from public.lessons where id = 'l-c2-cleft'`)).toBe(0);
    expect(await count(`select * from public.lesson_contents where lesson_id = 'l-c2-cleft'`)).toBe(0);
    await asAdmin();
    await db.exec(`update public.lessons set is_published = true where id = 'l-c2-cleft'`);
  });
});

describe('RLS: profiles', () => {
  it('guests cannot read profiles at all', async () => {
    await asAnon();
    await expect(db.query('select * from public.profiles')).rejects.toThrow(DENIED);
  });

  it('users see and update only their own profile', async () => {
    await asUser(ALICE);
    expect(await count('select * from public.profiles')).toBe(1);
    await db.exec(`update public.profiles set display_name = 'Alice B', cefr_level = 'B1' where id = '${ALICE}'`);
    await db.exec(`update public.profiles set display_name = 'pwned' where id = '${BOB}'`);
    await expect(db.exec(`update public.profiles set id = '${BOB}' where id = '${ALICE}'`)).rejects.toThrow();
    await asAdmin();
    const { rows } = await db.query<{ id: string; display_name: string }>('select id, display_name from public.profiles order by id');
    expect(rows).toEqual([
      { id: ALICE, display_name: 'Alice B' },
      { id: BOB, display_name: '' },
    ]);
  });

  it('users cannot create profiles directly', async () => {
    await asUser(ALICE);
    await expect(db.exec(`insert into public.profiles (id) values (gen_random_uuid())`)).rejects.toThrow(DENIED);
  });
});

describe('RLS: learning progress', () => {
  it('users manage only their own vocabulary and lesson progress', async () => {
    await asUser(ALICE);
    await db.exec(`insert into public.user_vocabulary (user_id, vocabulary_id) values ('${ALICE}', 'v-hello')`);
    await db.exec(`insert into public.user_lessons (user_id, lesson_id, status) values ('${ALICE}', 'l-a1-greetings', 'in_progress')`);
    await expect(db.exec(`insert into public.user_vocabulary (user_id, vocabulary_id) values ('${BOB}', 'v-hello')`)).rejects.toThrow(DENIED);
    await asUser(BOB);
    expect(await count('select * from public.user_vocabulary')).toBe(0);
    expect(await count('select * from public.user_lessons')).toBe(0);
    await db.exec(`delete from public.user_vocabulary`);
    await asAdmin();
    expect(await count('select * from public.user_vocabulary')).toBe(1);
  });

  it('XP, streaks and achievements cannot be written by clients', async () => {
    await asUser(ALICE);
    await expect(
      db.exec(`insert into public.study_sessions (user_id, kind, xp, client_op_id) values ('${ALICE}', 'lesson', 99999, gen_random_uuid())`),
    ).rejects.toThrow(DENIED);
    await expect(db.exec(`insert into public.user_achievements (user_id, achievement_id) values ('${ALICE}', 'xp-500')`)).rejects.toThrow(DENIED);
    await expect(db.exec(`update public.learning_streaks set current_streak = 365, best_streak = 365`)).rejects.toThrow(DENIED);
    await asAdmin();
    expect(await count('select * from public.learning_streaks where best_streak > 0')).toBe(0);
  });

  it('users can read and update their own daily goal only', async () => {
    await asUser(ALICE);
    await db.exec(`update public.learning_goals set daily_minutes = 30`);
    await asAdmin();
    const { rows } = await db.query<{ user_id: string; daily_minutes: number }>('select user_id, daily_minutes from public.learning_goals order by user_id');
    expect(rows.map((r) => r.daily_minutes)).toEqual([30, 15]);
  });
});

describe('RLS: AI conversations', () => {
  it('users may add only their own user messages', async () => {
    await asUser(ALICE);
    const { rows } = await db.query<{ id: string }>(`insert into public.ai_conversations (user_id, title) values ('${ALICE}', 'Practice') returning id`);
    const conv = rows[0]!.id;
    await db.exec(`insert into public.ai_messages (conversation_id, user_id, role, content) values ('${conv}', '${ALICE}', 'user', 'Hello')`);
    await expect(
      db.exec(`insert into public.ai_messages (conversation_id, user_id, role, content) values ('${conv}', '${ALICE}', 'assistant', 'fake')`),
    ).rejects.toThrow(DENIED);
    await asUser(BOB);
    expect(await count('select * from public.ai_messages')).toBe(0);
    await expect(
      db.exec(`insert into public.ai_messages (conversation_id, user_id, role, content) values ('${conv}', '${BOB}', 'user', 'hi')`),
    ).rejects.toThrow();
  });
});

describe('constraints', () => {
  const rejects = (sql: string) => expect(db.exec(sql)).rejects.toThrow();

  it('enforces valid values', async () => {
    await rejects(`update public.profiles set cefr_level = 'D1' where id = '${ALICE}'`);
    await rejects(`insert into public.user_lessons (user_id, lesson_id, status, progress_percent) values ('${BOB}', 'l-a1-to-be', 'in_progress', 101)`);
    await rejects(`insert into public.user_lessons (user_id, lesson_id, status) values ('${BOB}', 'l-a1-to-be', 'completed')`);
    await rejects(`insert into public.user_lessons (user_id, lesson_id, status) values ('${BOB}', 'l-a1-to-be', 'done')`);
    await rejects(`insert into public.user_vocabulary (user_id, vocabulary_id, ease_factor) values ('${BOB}', 'v-name', 1.0)`);
    await rejects(`insert into public.study_sessions (user_id, kind, duration_seconds, client_op_id) values ('${BOB}', 'lesson', -5, gen_random_uuid())`);
    await rejects(`insert into public.questions (id, exercise_id, position, type, prompt, explanation_vi) values ('x', 'ex-a1-to-be', 99, 'essay', 'p', 'e')`);
  });

  it('keeps one progress row per user and lesson / word', async () => {
    await db.exec(`insert into public.user_vocabulary (user_id, vocabulary_id) values ('${BOB}', 'v-water')`);
    await rejects(`insert into public.user_vocabulary (user_id, vocabulary_id) values ('${BOB}', 'v-water')`);
  });

  it('requires a lesson to match its module level', async () => {
    await rejects(
      `insert into public.lessons (id, module_id, level_id, title, title_vi, estimated_minutes, sort_order) values ('l-bad', 'a1-hello', 'C2', 't', 't', 5, 99)`,
    );
  });

  it('makes sync operations idempotent via client_op_id', async () => {
    const op = 'f0000000-0000-4000-8000-000000000001';
    await db.exec(`insert into public.study_sessions (user_id, kind, client_op_id) values ('${BOB}', 'lesson', '${op}')`);
    await rejects(`insert into public.study_sessions (user_id, kind, client_op_id) values ('${BOB}', 'lesson', '${op}')`);
  });

  it('deleting an auth user cascades to all of their data', async () => {
    await db.exec(`delete from auth.users where id = '${BOB}'`);
    expect(await count(`select * from public.profiles where id = '${BOB}'`)).toBe(0);
    expect(await count(`select * from public.user_vocabulary where user_id = '${BOB}'`)).toBe(0);
    expect(await count(`select * from public.study_sessions where user_id = '${BOB}'`)).toBe(0);
  });
});
