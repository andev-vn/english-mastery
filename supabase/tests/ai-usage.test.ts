// @vitest-environment node
/** ai_usage_events: written only by the Edge Function (service role); learners can read their own rows. */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const dir = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const read = (p: string) => readFileSync(dir(p), 'utf8');
const A = '00000000-0000-4000-8000-0000000000f1';
const B = '00000000-0000-4000-8000-0000000000f2';
let db: PGlite;

const as = (user: string) => db.exec(`reset role; select set_config('request.jwt.claim.sub', '${user}', false); set role authenticated;`);

beforeAll(async () => {
  db = new PGlite();
  await db.exec(read('./supabase-shim.sql'));
  for (const file of readdirSync(dir('../migrations')).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(read(`../migrations/${file}`));
  }
  await db.exec(`insert into auth.users (id, email) values ('${A}', 'a@example.test'), ('${B}', 'b@example.test');`);
  await db.exec(`set role service_role; insert into public.ai_usage_events (user_id, action, model) values ('${A}', 'chat', 'm'), ('${B}', 'correct_writing', 'm'); reset role;`);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe('ai_usage_events', () => {
  it('lets a learner read only their own usage', async () => {
    await as(A);
    const { rows } = await db.query<{ action: string }>('select action from public.ai_usage_events');
    expect(rows).toEqual([{ action: 'chat' }]);
  });

  it('does not let learners write usage (so they cannot reset their limit)', async () => {
    await as(A);
    await expect(db.exec(`insert into public.ai_usage_events (user_id, action) values ('${A}', 'chat')`)).rejects.toThrow();
    await expect(db.exec('delete from public.ai_usage_events')).rejects.toThrow();
    await db.exec('reset role');
    const { rows } = await db.query<{ n: number }>('select count(*)::int as n from public.ai_usage_events');
    expect(rows[0]!.n).toBe(2);
  });

  it('rejects unknown actions', async () => {
    await db.exec('reset role; set role service_role;');
    await expect(db.exec(`insert into public.ai_usage_events (user_id, action) values ('${A}', 'hack')`)).rejects.toThrow();
    await db.exec('reset role');
  });
});
