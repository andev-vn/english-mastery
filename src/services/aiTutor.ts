import { getSupabase } from '@/services/supabase/client';
import type { CefrLevel } from '@/types/content';

/**
 * Client for the optional AI tutor (supabase/functions/ai-tutor). The provider key lives only in the
 * Edge Function's secrets; the browser sends the learner's session and gets the reply. Every call can
 * fail with an AITutorError whose `code` the UI turns into a Vietnamese message — nothing is faked.
 */

export type TutorAvailability =
  | { available: true; limits: { perDay: number; perMinute: number } }
  | { available: false; reason: 'no-backend' | 'not-configured' | 'unreachable' | 'offline' };

export type AITutorErrorCode =
  | 'ai_unavailable'
  | 'not_signed_in'
  | 'rate_limited_day'
  | 'rate_limited_minute'
  | 'ai_refused'
  | 'ai_failed'
  | 'conversation_not_found'
  | 'invalid_request'
  | 'network';

export class AITutorError extends Error {
  constructor(
    readonly code: AITutorErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AITutorError';
  }
}

export interface AIWritingFeedback {
  correctedText: string;
  issues: { original: string; suggestion: string; explanationVi: string }[];
  overallVi: string;
}

export interface AIAnswerEvaluation {
  verdict: 'good' | 'acceptable' | 'needs_work';
  feedbackVi: string;
  improvedAnswer: string;
}

const KNOWN: readonly string[] = [
  'ai_unavailable',
  'not_signed_in',
  'rate_limited_day',
  'rate_limited_minute',
  'ai_refused',
  'ai_failed',
  'conversation_not_found',
  'invalid_request',
];

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const supabase = await getSupabase();
  if (!supabase) throw new AITutorError('ai_unavailable', 'Supabase is not configured');
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new AITutorError('network', 'Offline');
  const { data, error } = await supabase.functions.invoke<T>('ai-tutor', { body });
  if (!error) {
    if (data === null) throw new AITutorError('ai_failed', 'Empty response');
    return data;
  }
  // FunctionsHttpError carries the Response; our function always answers JSON { code, message }.
  const context = (error as { context?: unknown }).context;
  if (context instanceof Response) {
    const payload = (await context.json().catch(() => null)) as { code?: string; message?: string } | null;
    const code = payload?.code && KNOWN.includes(payload.code) ? (payload.code as AITutorErrorCode) : 'ai_failed';
    throw new AITutorError(code, payload?.message ?? `HTTP ${context.status}`);
  }
  throw new AITutorError('network', error.message);
}

/** Whether the AI tutor can be used right now (does not need a session). */
export async function getTutorAvailability(): Promise<TutorAvailability> {
  const supabase = await getSupabase();
  if (!supabase) return { available: false, reason: 'no-backend' };
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { available: false, reason: 'offline' };
  try {
    const status = await call<{ available: boolean; limits?: { perDay: number; perMinute: number } }>({ action: 'status' });
    return status.available ? { available: true, limits: status.limits ?? { perDay: 0, perMinute: 0 } } : { available: false, reason: 'not-configured' };
  } catch (error) {
    // Not deployed, paused project or network failure.
    if (import.meta.env.DEV) console.warn('[ai tutor] status', error);
    return { available: false, reason: 'unreachable' };
  }
}

export function sendTutorMessage(input: { level: CefrLevel; message: string; conversationId?: string }) {
  return call<{ conversationId: string; reply: string }>({ action: 'chat', ...input });
}

export async function correctWritingWithAI(input: { level: CefrLevel; text: string; taskVi?: string }): Promise<AIWritingFeedback> {
  return (await call<{ feedback: AIWritingFeedback }>({ action: 'correct_writing', ...input })).feedback;
}

export async function evaluateAnswerWithAI(input: { level: CefrLevel; question: string; answer: string }): Promise<AIAnswerEvaluation> {
  return (await call<{ evaluation: AIAnswerEvaluation }>({ action: 'evaluate_answer', ...input })).evaluation;
}

export function tutorErrorMessage(error: unknown): string {
  const code = error instanceof AITutorError ? error.code : 'ai_failed';
  switch (code) {
    case 'ai_unavailable':
      return 'Gia sư AI chưa được bật trên máy chủ này.';
    case 'not_signed_in':
      return 'Hãy đăng nhập để dùng gia sư AI.';
    case 'rate_limited_day':
      return 'Bạn đã dùng hết lượt AI hôm nay. Hãy quay lại vào ngày mai nhé.';
    case 'rate_limited_minute':
      return 'Bạn gửi hơi nhanh — hãy đợi một phút rồi thử lại.';
    case 'ai_refused':
      return 'AI không thể hỗ trợ yêu cầu này. Hãy thử diễn đạt khác.';
    case 'conversation_not_found':
      return 'Không tìm thấy cuộc trò chuyện. Hãy bắt đầu cuộc trò chuyện mới.';
    case 'network':
      return 'Không có kết nối mạng. Gia sư AI cần Internet.';
    case 'invalid_request':
      return 'Nội dung gửi đi không hợp lệ (có thể quá dài).';
    default:
      return 'AI chưa trả lời được. Hãy thử lại sau.';
  }
}

/** Saved conversations of the signed-in user (RLS: own rows only), newest first. */
export async function listConversations(): Promise<{ id: string; title: string; updatedAt: string }[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from('ai_conversations').select('id, title, updated_at').order('updated_at', { ascending: false }).limit(20);
  if (error) throw error;
  return data.map((c) => ({ id: c.id, title: c.title, updatedAt: c.updated_at }));
}

export async function loadConversationMessages(conversationId: string): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('ai_messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw error;
  return data.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const supabase = await getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from('ai_conversations').delete().eq('id', conversationId);
  if (error) throw error;
}
