import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import type { Database } from './database.types';

export type AppSupabaseClient = SupabaseClient<Database>;

let clientPromise: Promise<AppSupabaseClient | null> | null = null;

/**
 * Lazily creates the Supabase client. The SDK is loaded as a separate chunk so guest users
 * never download it, and it returns null when Supabase is not configured.
 */
export function getSupabase(): Promise<AppSupabaseClient | null> {
  if (!env.supabaseUrl || !env.supabaseKey) return Promise.resolve(null);
  const { supabaseUrl, supabaseKey } = env;
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        // PKCE: email links return a one-time ?code that is exchanged in this browser.
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'em-auth',
      },
    }),
  );
  return clientPromise;
}

/** Same as getSupabase() but for code paths that require a configured backend. */
export async function requireSupabase(): Promise<AppSupabaseClient> {
  const client = await getSupabase();
  if (!client) throw new BackendUnavailableError();
  return client;
}

export class BackendUnavailableError extends Error {
  constructor() {
    super('Supabase is not configured');
    this.name = 'BackendUnavailableError';
  }
}
