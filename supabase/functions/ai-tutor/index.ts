// Supabase Edge Function (Deno): optional AI tutor.
// Server-side secrets (set with `supabase secrets set`, never in VITE_* variables):
//   ANTHROPIC_API_KEY  — enables the tutor; without it every action returns ai_unavailable
//   AI_MODEL           — optional, defaults to claude-opus-5-5
//   AI_DAILY_LIMIT     — optional, AI requests per user per 24 h (default 30)
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by the platform.
import { createClient } from '@supabase/supabase-js';
import { AnthropicProvider } from './anthropic.ts';
import { DEFAULT_LIMITS, handle, type TutorStore } from './core.ts';

const env = (name: string) => Deno.env.get(name) ?? '';

const apiKey = env('ANTHROPIC_API_KEY');
const provider = apiKey ? new AnthropicProvider(apiKey, env('AI_MODEL') || undefined) : null;
const limits = { ...DEFAULT_LIMITS, perDay: Number(env('AI_DAILY_LIMIT')) || DEFAULT_LIMITS.perDay };

const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const store: TutorStore = {
  async countUsageSince(userId, since) {
    const { count, error } = await admin
      .from('ai_usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since.toISOString());
    if (error) throw error;
    return count ?? 0;
  },
  async recordUsage(userId, action, usage) {
    const { error } = await admin.from('ai_usage_events').insert({
      user_id: userId,
      action,
      model: usage.model,
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
    });
    if (error) throw error;
  },
  async loadConversation(userId, conversationId, limit) {
    const { data: conversation, error } = await admin
      .from('ai_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!conversation) return null;
    const { data, error: messagesError } = await admin
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (messagesError) throw messagesError;
    return (data ?? []).reverse().map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content) }));
  },
  async createConversation(userId, title) {
    const { data, error } = await admin.from('ai_conversations').insert({ user_id: userId, title }).select('id').single();
    if (error) throw error;
    return String(data.id);
  },
  async appendMessages(userId, conversationId, messages) {
    // Explicit timestamps keep the user turn before the reply when both are inserted together.
    const base = Date.now();
    const { error } = await admin.from('ai_messages').insert(
      messages.map((m, i) => ({
        conversation_id: conversationId,
        user_id: userId,
        role: m.role,
        content: m.content,
        created_at: new Date(base + i).toISOString(),
      })),
    );
    if (error) throw error;
    await admin.from('ai_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
  },
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function userIdFrom(req: Request): Promise<string | null> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  return error || !data.user ? null : data.user.id;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const reply = await handle(body, { provider, store, userId: await userIdFrom(req), limits });
  return new Response(JSON.stringify(reply.body), {
    status: reply.status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
