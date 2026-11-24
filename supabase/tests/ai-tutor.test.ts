// @vitest-environment node
/**
 * The ai-tutor Edge Function's request handling (provider and storage are faked; no AI is called).
 */
import { describe, expect, it, vi } from 'vitest';
import { handle, type Deps, type TutorStore } from '../functions/ai-tutor/core';
import { AIRefusalError, type AIProvider, type ChatTurn } from '../functions/ai-tutor/provider';

const USER = 'user-1';
const CONV = '00000000-0000-4000-8000-0000000000e1';
const usage = { model: 'test-model', inputTokens: 10, outputTokens: 5 };

function fakeStore(overrides: Partial<TutorStore> = {}) {
  const conversations = new Map<string, { userId: string; messages: ChatTurn[] }>();
  const store: TutorStore & { usage: string[]; conversations: typeof conversations } = {
    usage: [],
    conversations,
    countUsageSince: vi.fn(async () => 0),
    recordUsage: vi.fn(async (_u, action) => void store.usage.push(action)),
    loadConversation: vi.fn(async (userId, id) => {
      const c = conversations.get(id);
      return c && c.userId === userId ? c.messages : null;
    }),
    createConversation: vi.fn(async (userId) => {
      conversations.set(CONV, { userId, messages: [] });
      return CONV;
    }),
    appendMessages: vi.fn(async (_u, id, messages) => void conversations.get(id)!.messages.push(...messages)),
    ...overrides,
  };
  return store;
}

function fakeProvider(): AIProvider {
  return {
    name: 'fake',
    generateResponse: vi.fn(async ({ messages }) => ({ value: `echo: ${messages.at(-1)!.content} (${messages.length})`, usage })),
    correctWriting: vi.fn(async () => ({ value: { correctedText: 'I agree.', issues: [], overallVi: 'Tốt' }, usage })),
    evaluateAnswer: vi.fn(async () => ({ value: { verdict: 'good' as const, feedbackVi: 'Tốt', improvedAnswer: 'Yes.' }, usage })),
  };
}

const deps = (patch: Partial<Deps> = {}): Deps => ({ provider: fakeProvider(), store: fakeStore(), userId: USER, ...patch });

describe('ai-tutor core', () => {
  it('reports availability without a session, and unavailability without a provider key', async () => {
    expect((await handle({ action: 'status' }, deps({ userId: null }))).body).toMatchObject({ available: true });
    expect((await handle({ action: 'status' }, deps({ provider: null }))).body).toMatchObject({ available: false });
    const r = await handle({ action: 'chat', message: 'Hi' }, deps({ provider: null }));
    expect(r).toMatchObject({ status: 503, body: { code: 'ai_unavailable' } });
  });

  it('requires a signed-in user and a valid body', async () => {
    expect((await handle({ action: 'chat', message: 'Hi' }, deps({ userId: null }))).status).toBe(401);
    expect((await handle({ action: 'chat', message: '' }, deps())).status).toBe(400);
    expect((await handle({ action: 'chat', message: 'x'.repeat(2001) }, deps())).status).toBe(400);
    expect((await handle({ action: 'nope' }, deps())).status).toBe(400);
    expect((await handle(null, deps())).status).toBe(400);
  });

  it('keeps a conversation: stores both turns and sends the history next time', async () => {
    const store = fakeStore();
    const provider = fakeProvider();
    const first = await handle({ action: 'chat', level: 'A1', message: 'Hello' }, deps({ store, provider }));
    expect(first).toMatchObject({ status: 200, body: { conversationId: CONV, reply: 'echo: Hello (1)' } });
    const second = await handle({ action: 'chat', level: 'A1', conversationId: CONV, message: 'How are you?' }, deps({ store, provider }));
    expect(second.body.reply).toBe('echo: How are you? (3)');
    expect(store.conversations.get(CONV)!.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user', 'assistant']);
    expect(vi.mocked(provider.generateResponse).mock.calls[1]![0].level).toBe('A1');
    expect(store.usage).toEqual(['chat', 'chat']);
  });

  it('does not continue another user’s conversation', async () => {
    const store = fakeStore();
    await handle({ action: 'chat', message: 'Hello' }, deps({ store }));
    const r = await handle({ action: 'chat', conversationId: CONV, message: 'Hi' }, deps({ store, userId: 'someone-else' }));
    expect(r.status).toBe(404);
  });

  it('enforces per-day and per-minute limits before calling the provider', async () => {
    const provider = fakeProvider();
    const daily = fakeStore({ countUsageSince: vi.fn(async () => 30) });
    expect((await handle({ action: 'correct_writing', text: 'I am agree.' }, deps({ provider, store: daily }))).body.code).toBe('rate_limited_day');
    const now = new Date('2026-11-25T08:00:00Z');
    const burst = fakeStore({ countUsageSince: vi.fn(async (_u, since: Date) => (now.getTime() - since.getTime() <= 60_000 ? 5 : 6)) });
    expect((await handle({ action: 'correct_writing', text: 'I am agree.' }, deps({ provider, store: burst, now: () => now }))).body.code).toBe('rate_limited_minute');
    expect(provider.correctWriting).not.toHaveBeenCalled();
  });

  it('returns writing feedback and answer evaluations', async () => {
    const r1 = await handle({ action: 'correct_writing', level: 'B1', text: 'I am agree.' }, deps());
    expect(r1).toMatchObject({ status: 200, body: { feedback: { correctedText: 'I agree.' } } });
    const r2 = await handle({ action: 'evaluate_answer', question: 'Do you like coffee?', answer: 'yes i like' }, deps());
    expect(r2).toMatchObject({ status: 200, body: { evaluation: { verdict: 'good' } } });
  });

  it('maps refusals and provider failures to friendly errors without recording usage', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = fakeStore();
    const provider = fakeProvider();
    vi.mocked(provider.correctWriting).mockRejectedValueOnce(new AIRefusalError()).mockRejectedValueOnce(new Error('overloaded'));
    expect((await handle({ action: 'correct_writing', text: 'x' }, deps({ store, provider }))).status).toBe(422);
    expect((await handle({ action: 'correct_writing', text: 'x' }, deps({ store, provider }))).status).toBe(502);
    expect(store.usage).toEqual([]);
  });
});
