import { requireSupabase } from '@/services/supabase/client';

/** Thin wrapper over Supabase Auth so UI code never touches the SDK directly. */

const callbackUrl = (next: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

export async function signIn(email: string, password: string) {
  const supabase = await requireSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export interface SignUpResult {
  userId: string | null;
  /** True when the project requires email confirmation before the first sign-in. */
  needsEmailConfirmation: boolean;
}

export async function signUp(input: { email: string; password: string; displayName: string }): Promise<SignUpResult> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { display_name: input.displayName },
      emailRedirectTo: callbackUrl('/dashboard'),
    },
  });
  if (error) throw error;
  // With email confirmation on, Supabase returns no session (and, for an existing address,
  // an obfuscated user) so that the response does not reveal whether the email is registered.
  return { userId: data.session ? (data.user?.id ?? null) : null, needsEmailConfirmation: !data.session };
}

export async function signOut() {
  const supabase = await requireSupabase();
  // 'local' signs out this device only; other devices keep their sessions.
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export async function requestPasswordReset(email: string) {
  const supabase = await requireSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callbackUrl('/reset-password') });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const supabase = await requireSupabase();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

/**
 * Waits for the client to finish initializing — including exchanging a PKCE ?code from an
 * email link — and returns the current session's user, if any.
 */
export async function resolveSessionUser() {
  const supabase = await requireSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.user ?? null;
}

/** Only allow same-origin relative paths as post-auth redirects (prevents open redirects). */
export function safeNextPath(next: string | null | undefined, fallback = '/'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}
