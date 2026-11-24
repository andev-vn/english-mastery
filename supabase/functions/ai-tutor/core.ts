import { z } from 'zod';
import { AIRefusalError, CEFR, type AIProvider, type ChatTurn, type Usage } from './provider.ts';

/**
 * Request handling for the ai-tutor Edge Function, free of Deno and Supabase specifics so it can be
 * unit-tested (supabase/tests/ai-tutor.test.ts). index.ts wires in the real provider and storage.
 */

export type Action = 'chat' | 'correct_writing' | 'evaluate_answer';

export interface Limits {
  perDay: number;
  perMinute: number;
}

export const DEFAULT_LIMITS: Limits = { perDay: 30, perMinute: 5 };

/** Storage the core needs; implemented with the service-role client in index.ts. */
export interface TutorStore {
  countUsageSince(userId: string, since: Date): Promise<number>;
  recordUsage(userId: string, action: Action, usage: Usage): Promise<void>;
  /** Returns the conversation's last messages (oldest first), or null if it is not the user's. */
  loadConversation(userId: string, conversationId: string, limit: number): Promise<ChatTurn[] | null>;
  createConversation(userId: string, title: string): Promise<string>;
  appendMessages(userId: string, conversationId: string, messages: ChatTurn[]): Promise<void>;
}

export interface Deps {
  provider: AIProvider | null;
  store: TutorStore;
  /** null when the request has no valid session. */
  userId: string | null;
  limits?: Limits;
  now?: () => Date;
}

export interface Reply {
  status: number;
  body: Record<string, unknown>;
}

const level = z.enum(CEFR).default('A2');

const requestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('status') }),
  z.object({
    action: z.literal('chat'),
    level,
    conversationId: z.uuid().optional(),
    message: z.string().trim().min(1).max(2000),
  }),
  z.object({
    action: z.literal('correct_writing'),
    level,
    text: z.string().trim().min(1).max(4000),
    taskVi: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal('evaluate_answer'),
    level,
    question: z.string().trim().min(1).max(500),
    answer: z.string().trim().min(1).max(2000),
  }),
]);

const HISTORY_TURNS = 20;

const error = (status: number, code: string, message: string): Reply => ({ status, body: { code, message } });

export async function handle(rawBody: unknown, deps: Deps): Promise<Reply> {
  const parsed = requestSchema.safeParse(rawBody);
  if (!parsed.success) return error(400, 'invalid_request', 'The request is not valid.');
  const req = parsed.data;

  if (req.action === 'status') {
    return { status: 200, body: { available: deps.provider !== null, provider: deps.provider?.name ?? null, limits: deps.limits ?? DEFAULT_LIMITS } };
  }
  if (!deps.provider) return error(503, 'ai_unavailable', 'The AI tutor is not configured on this server.');
  if (!deps.userId) return error(401, 'not_signed_in', 'Sign in to use the AI tutor.');

  const { provider, store, userId } = deps;
  const limits = deps.limits ?? DEFAULT_LIMITS;
  const now = (deps.now ?? (() => new Date()))();
  const [lastMinute, lastDay] = await Promise.all([
    store.countUsageSince(userId, new Date(now.getTime() - 60_000)),
    store.countUsageSince(userId, new Date(now.getTime() - 24 * 3_600_000)),
  ]);
  if (lastDay >= limits.perDay) return error(429, 'rate_limited_day', `Daily limit of ${limits.perDay} AI requests reached.`);
  if (lastMinute >= limits.perMinute) return error(429, 'rate_limited_minute', 'Too many AI requests; wait a minute.');

  try {
    if (req.action === 'chat') {
      let conversationId = req.conversationId;
      let history: ChatTurn[] = [];
      if (conversationId) {
        const loaded = await store.loadConversation(userId, conversationId, HISTORY_TURNS);
        if (!loaded) return error(404, 'conversation_not_found', 'Conversation not found.');
        history = loaded;
      }
      // The API expects the conversation to start with the learner.
      while (history[0]?.role === 'assistant') history = history.slice(1);
      const userTurn: ChatTurn = { role: 'user', content: req.message };
      const result = await provider.generateResponse({ level: req.level, messages: [...history, userTurn] });
      conversationId ??= await store.createConversation(userId, req.message.slice(0, 80));
      await store.appendMessages(userId, conversationId, [userTurn, { role: 'assistant', content: result.value }]);
      await store.recordUsage(userId, 'chat', result.usage);
      return { status: 200, body: { conversationId, reply: result.value } };
    }
    if (req.action === 'correct_writing') {
      const result = await provider.correctWriting({ level: req.level, text: req.text, taskVi: req.taskVi });
      await store.recordUsage(userId, 'correct_writing', result.usage);
      return { status: 200, body: { feedback: result.value } };
    }
    const result = await provider.evaluateAnswer({ level: req.level, question: req.question, answer: req.answer });
    await store.recordUsage(userId, 'evaluate_answer', result.usage);
    return { status: 200, body: { evaluation: result.value } };
  } catch (e) {
    if (e instanceof AIRefusalError) return error(422, 'ai_refused', 'The AI could not help with this request.');
    console.error('[ai-tutor] provider error', e instanceof Error ? e.message : e);
    return error(502, 'ai_failed', 'The AI service did not answer. Try again later.');
  }
}
