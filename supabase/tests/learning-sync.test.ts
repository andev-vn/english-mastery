// @vitest-environment node
/**
 * The client's row mapping for user_vocabulary and user_answers must fit the real schema,
 * constraints and RLS — inserted as a signed-in user, read back unchanged.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cardToRow, rowToCard } from '../../src/services/learningSync';
import { createCard, scheduleReview } from '../../src/lib/srs';
import type { Tables } from '../../src/services/supabase/database.types';
import { buildSeedSql } from '../../scripts/seed-sql';

const dir = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const read = (p: string) => readFileSync(dir(p), 'utf8');
const USER = '00000000-0000-4000-8000-0000000000c1';

let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(read('./supabase-shim.sql'));
  for (const file of readdirSync(dir('../migrations')).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(read(`../migrations/${file}`));
  }
  await db.exec(buildSeedSql());
  await db.exec(`insert into auth.users (id, email) values ('${USER}', 'c@example.test');`);
  await db.exec(`select set_config('request.jwt.claim.sub', '${USER}', false); set role authenticated;`);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

/** Inserts a mapped row the way PostgREST would (column names from the object keys). */
async function insert(table: string, row: Record<string, unknown>, onConflict?: string) {
  const cols = Object.keys(row);
  const params = cols.map((_, i) => `$${i + 1}`);
  const upsert = onConflict ? ` on conflict (${onConflict}) do update set ${cols.map((c) => `${c} = excluded.${c}`).join(', ')}` : '';
  await db.query(
    `insert into public.${table} (${cols.join(', ')}) values (${params.join(', ')})${upsert}`,
    cols.map((c) => {
      const v = row[c];
      return v !== null && typeof v === 'object' ? JSON.stringify(v) : v;
    }),
  );
}

describe('user_vocabulary mapping', () => {
  it('round-trips a reviewed card through the database', async () => {
    const now = new Date('2026-11-23T08:00:00.000Z');
    const card = { ...scheduleReview(scheduleReview(createCard('v-hello', now), 'good', now), 'hard', now), favorite: true, updatedAt: now.toISOString() };
    await insert('user_vocabulary', cardToRow(USER, card), 'user_id, vocabulary_id');

    const { rows } = await db.query<Tables<'user_vocabulary'>>(`select * from public.user_vocabulary where vocabulary_id = 'v-hello'`);
    // PGlite returns Date/number objects where PostgREST returns ISO strings / JSON numbers.
    const row = rows[0]!;
    const asApi = {
      ...row,
      ease_factor: Number(row.ease_factor),
      next_review_at: new Date(row.next_review_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
      created_at: new Date(row.created_at).toISOString(),
      last_reviewed_at: row.last_reviewed_at ? new Date(row.last_reviewed_at).toISOString() : null,
    };
    expect(rowToCard(asApi)).toEqual(card);
  });

  it('upserts on (user, word) instead of duplicating', async () => {
    const card = { ...createCard('v-name'), updatedAt: new Date().toISOString() };
    await insert('user_vocabulary', cardToRow(USER, card), 'user_id, vocabulary_id');
    await insert('user_vocabulary', cardToRow(USER, { ...card, favorite: true }), 'user_id, vocabulary_id');
    const { rows } = await db.query<{ n: number }>(`select count(*)::int as n from public.user_vocabulary where vocabulary_id = 'v-name'`);
    expect(rows[0]!.n).toBe(1);
  });
});

describe('user_answers mapping', () => {
  it('accepts the answer payload for a seeded question', async () => {
    await insert('user_answers', {
      user_id: USER,
      question_id: 'ex-a1-to-be:q1',
      attempt_id: '00000000-0000-4000-8000-0000000000a1',
      answer: { type: 'multiple_choice', optionId: 'c' },
      is_correct: true,
    });
    const { rows } = await db.query<{ answer: unknown }>(`select answer from public.user_answers`);
    expect(rows[0]!.answer).toEqual({ type: 'multiple_choice', optionId: 'c' });
  });

  it('rejects answers for questions that do not exist', async () => {
    await expect(
      insert('user_answers', { user_id: USER, question_id: 'nope:q1', attempt_id: '00000000-0000-4000-8000-0000000000a2', answer: {}, is_correct: false }),
    ).rejects.toThrow();
  });
});
