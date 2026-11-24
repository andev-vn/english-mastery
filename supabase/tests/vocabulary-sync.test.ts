// @vitest-environment node
/**
 * sync_vocabulary: late (offline) changes must never overwrite newer changes from another device,
 * and RLS must keep every write inside the caller's own rows.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildSeedSql } from '../../scripts/seed-sql';

const dir = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const read = (p: string) => readFileSync(dir(p), 'utf8');
const USER = '00000000-0000-4000-8000-0000000000d1';
const OTHER = '00000000-0000-4000-8000-0000000000d2';

let db: PGlite;

const as = (user: string) => db.exec(`reset role; select set_config('request.jwt.claim.sub', '${user}', false); set role authenticated;`);

const card = (vocabularyId: string, updatedAt: string, extra: Record<string, unknown> = {}) => ({
  vocabulary_id: vocabularyId,
  repetitions: 1,
  ease_factor: 2.5,
  interval_days: 1,
  lapses: 0,
  is_favorite: false,
  last_reviewed_at: null,
  next_review_at: '2026-11-25T00:00:00.000Z',
  updated_at: updatedAt,
  ...extra,
});

async function sync(cards: unknown[], deleted: unknown[] = []) {
  const { rows } = await db.query<{ r: { newer: { vocabulary_id: string; is_favorite: boolean; updated_at: string }[] } }>(
    'select public.sync_vocabulary($1::jsonb, $2::jsonb) as r',
    [JSON.stringify(cards), JSON.stringify(deleted)],
  );
  return rows[0]!.r;
}

const words = async () =>
  (await db.query<{ vocabulary_id: string; is_favorite: boolean; repetitions: number }>(
    'select vocabulary_id, is_favorite, repetitions from public.user_vocabulary order by vocabulary_id',
  )).rows;

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

beforeEach(async () => {
  await db.exec('reset role; delete from public.user_vocabulary;');
  await as(USER);
});

describe('sync_vocabulary', () => {
  it('inserts new words and skips unknown ones without failing the batch', async () => {
    const r = await sync([card('v-hello', '2026-11-24T08:00:00Z'), card('v-does-not-exist', '2026-11-24T08:00:00Z')]);
    expect(r.newer).toEqual([]);
    expect((await words()).map((w) => w.vocabulary_id)).toEqual(['v-hello']);
  });

  it('applies a newer edit but refuses an older one, returning the server copy', async () => {
    await sync([card('v-hello', '2026-11-24T08:00:00Z', { is_favorite: true })]);
    await sync([card('v-hello', '2026-11-24T09:00:00Z', { is_favorite: false, repetitions: 2 })]);
    expect((await words())[0]).toMatchObject({ is_favorite: false, repetitions: 2 });

    // A device that was offline sends an edit made at 08:30: the 09:00 edit stays.
    const r = await sync([card('v-hello', '2026-11-24T08:30:00Z', { is_favorite: true, repetitions: 1 })]);
    expect((await words())[0]).toMatchObject({ is_favorite: false, repetitions: 2 });
    expect(r.newer).toHaveLength(1);
    expect(r.newer[0]).toMatchObject({ vocabulary_id: 'v-hello', is_favorite: false });
  });

  it('keeps the device edit time instead of the time of the write', async () => {
    await sync([card('v-hello', '2026-11-24T08:00:00Z')]);
    const { rows } = await db.query<{ updated_at: Date }>('select updated_at from public.user_vocabulary');
    expect(new Date(rows[0]!.updated_at).toISOString()).toBe('2026-11-24T08:00:00.000Z');
  });

  it('clamps device timestamps from the future to now', async () => {
    await sync([card('v-hello', '2999-01-01T00:00:00Z')]);
    const { rows } = await db.query<{ future: boolean }>('select updated_at > now() as future from public.user_vocabulary');
    expect(rows[0]!.future).toBe(false);
  });

  it('deletes only when the server copy is not newer than the deletion', async () => {
    await sync([card('v-hello', '2026-11-24T08:00:00Z'), card('v-name', '2026-11-24T10:00:00Z')]);
    const r = await sync([], [
      { vocabulary_id: 'v-hello', deleted_at: '2026-11-24T09:00:00Z' },
      // Removed on this device at 09:00, but re-saved elsewhere at 10:00: it stays.
      { vocabulary_id: 'v-name', deleted_at: '2026-11-24T09:00:00Z' },
    ]);
    expect((await words()).map((w) => w.vocabulary_id)).toEqual(['v-name']);
    expect(r.newer.map((w) => w.vocabulary_id)).toEqual(['v-name']);
  });

  it('only ever touches the caller’s rows', async () => {
    await sync([card('v-hello', '2026-11-24T08:00:00Z')]);
    await as(OTHER);
    await sync([], [{ vocabulary_id: 'v-hello', deleted_at: '2026-11-24T12:00:00Z' }]);
    await sync([card('v-hello', '2026-11-24T12:00:00Z', { is_favorite: true })]);
    await db.exec('reset role');
    const { rows } = await db.query<{ user_id: string; is_favorite: boolean }>('select user_id, is_favorite from public.user_vocabulary order by user_id');
    expect(rows).toEqual([
      { user_id: USER, is_favorite: false },
      { user_id: OTHER, is_favorite: true },
    ]);
  });

  it('rejects anonymous callers and malformed payloads', async () => {
    await db.exec('reset role; set role anon;');
    await expect(sync([])).rejects.toThrow();
    await as(USER);
    await expect(db.query(`select public.sync_vocabulary('{}'::jsonb, '[]'::jsonb)`)).rejects.toThrow(/arrays/);
  });
});
