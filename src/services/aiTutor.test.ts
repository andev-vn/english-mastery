import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { getSupabase, type AppSupabaseClient } from './supabase/client';
import { AITutorError, getTutorAvailability, sendTutorMessage, tutorErrorMessage } from './aiTutor';

vi.mock('./supabase/client', () => ({ getSupabase: vi.fn() }));

const client = (invoke: (name: string, opts: { body: unknown }) => unknown) =>
  vi.mocked(getSupabase).mockResolvedValue({ functions: { invoke: vi.fn(async (n: string, o: { body: unknown }) => invoke(n, o)) } } as unknown as AppSupabaseClient);

const httpError = (status: number, body: unknown) => ({
  data: null,
  error: new FunctionsHttpError(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })),
});

describe('aiTutor client', () => {
  beforeEach(() => vi.mocked(getSupabase).mockReset());

  it('is unavailable without a backend, without a provider, or when the function cannot be reached', async () => {
    vi.mocked(getSupabase).mockResolvedValue(null);
    expect(await getTutorAvailability()).toEqual({ available: false, reason: 'no-backend' });

    client(() => ({ data: { available: false }, error: null }));
    expect(await getTutorAvailability()).toEqual({ available: false, reason: 'not-configured' });

    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    client(() => httpError(404, { message: 'Function not found' }));
    expect(await getTutorAvailability()).toEqual({ available: false, reason: 'unreachable' });

    client(() => ({ data: { available: true, limits: { perDay: 30, perMinute: 5 } }, error: null }));
    expect(await getTutorAvailability()).toEqual({ available: true, limits: { perDay: 30, perMinute: 5 } });
  });

  it('sends chat messages and maps server error codes to Vietnamese messages', async () => {
    const calls: unknown[] = [];
    client((_n, { body }) => {
      calls.push(body);
      return { data: { conversationId: 'c1', reply: 'Hi!' }, error: null };
    });
    expect(await sendTutorMessage({ level: 'A2', message: 'Hello' })).toEqual({ conversationId: 'c1', reply: 'Hi!' });
    expect(calls[0]).toEqual({ action: 'chat', level: 'A2', message: 'Hello' });

    client(() => httpError(429, { code: 'rate_limited_day', message: 'limit' }));
    const error = await sendTutorMessage({ level: 'A2', message: 'Hello' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AITutorError);
    expect((error as AITutorError).code).toBe('rate_limited_day');
    expect(tutorErrorMessage(error)).toMatch(/hết lượt AI hôm nay/);
    expect(tutorErrorMessage(new Error('x'))).toMatch(/thử lại/);
  });
});
