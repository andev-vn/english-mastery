/**
 * Centralized, validated environment configuration.
 * Every variable is optional: without Supabase the app runs in local guest mode.
 * (Validated by hand rather than with Zod so the validator stays out of the initial bundle.)
 */

export interface AppEnv {
  supabaseUrl: string | null;
  supabaseKey: string | null;
  /** Explains why Supabase is disabled when it is (shown in dev tools, never to end users). */
  supabaseIssue: string | null;
}

export function parseEnv(raw: Record<string, unknown>): AppEnv {
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const url = str(raw.VITE_SUPABASE_URL);
  const key = str(raw.VITE_SUPABASE_PUBLISHABLE_KEY);
  if (url && !isHttpUrl(url)) return { supabaseUrl: null, supabaseKey: null, supabaseIssue: 'VITE_SUPABASE_URL must be an http(s) URL.' };
  if (!url && !key) return { supabaseUrl: null, supabaseKey: null, supabaseIssue: 'Supabase not configured (guest mode only).' };
  if (!url || !key) return { supabaseUrl: null, supabaseKey: null, supabaseIssue: 'Both VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required.' };
  // A secret key in a browser bundle would bypass Row Level Security — refuse to use it.
  if (key.startsWith('sb_secret_') || /service_role/.test(decodeJwtRole(key) ?? '')) {
    return { supabaseUrl: null, supabaseKey: null, supabaseIssue: 'Refusing to use a secret/service-role key in the browser. Use the publishable key.' };
  }
  return { supabaseUrl: url.replace(/\/+$/, ''), supabaseKey: key, supabaseIssue: null };
}

function isHttpUrl(value: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** Legacy anon/service keys are JWTs; read the role claim without verifying. */
function decodeJwtRole(key: string): string | null {
  const payload = key.split('.')[1];
  if (!payload) return null;
  try {
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { role?: unknown };
    return typeof json.role === 'string' ? json.role : null;
  } catch {
    return null;
  }
}

export const env: AppEnv = parseEnv(import.meta.env);

export const isSupabaseConfigured = env.supabaseUrl !== null;

if (import.meta.env.DEV && env.supabaseIssue) console.info(`[env] ${env.supabaseIssue}`);
