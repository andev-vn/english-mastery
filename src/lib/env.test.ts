import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

const URL = 'https://abcdefghijklmnop.supabase.co';

/** Builds an unsigned JWT-shaped string with the given role claim (legacy Supabase key format). */
const fakeJwt = (role: string) => `x.${btoa(JSON.stringify({ role })).replace(/=+$/, '')}.y`;

describe('parseEnv', () => {
  it('runs in guest mode when nothing is configured', () => {
    expect(parseEnv({})).toMatchObject({ supabaseUrl: null, supabaseKey: null });
  });

  it('accepts a URL with a publishable key and trims a trailing slash', () => {
    expect(parseEnv({ VITE_SUPABASE_URL: `${URL}/`, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc' })).toEqual({
      supabaseUrl: URL,
      supabaseKey: 'sb_publishable_abc',
      supabaseIssue: null,
    });
  });

  it('accepts a legacy anon JWT', () => {
    expect(parseEnv({ VITE_SUPABASE_URL: URL, VITE_SUPABASE_PUBLISHABLE_KEY: fakeJwt('anon') }).supabaseKey).not.toBeNull();
  });

  it('refuses secret and service-role keys', () => {
    expect(parseEnv({ VITE_SUPABASE_URL: URL, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_xyz' }).supabaseKey).toBeNull();
    expect(parseEnv({ VITE_SUPABASE_URL: URL, VITE_SUPABASE_PUBLISHABLE_KEY: fakeJwt('service_role') }).supabaseKey).toBeNull();
  });

  it('requires both values and a valid URL', () => {
    expect(parseEnv({ VITE_SUPABASE_URL: URL }).supabaseUrl).toBeNull();
    expect(parseEnv({ VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc' }).supabaseUrl).toBeNull();
    expect(parseEnv({ VITE_SUPABASE_URL: 'not a url', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc' }).supabaseUrl).toBeNull();
    expect(parseEnv({ VITE_SUPABASE_URL: 'ftp://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc' }).supabaseUrl).toBeNull();
  });
});
