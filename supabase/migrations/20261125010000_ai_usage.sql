-- =============================================================================
-- AI tutor usage (Phase 6): one row per AI request, written only by the ai-tutor Edge Function
-- (service role). Used for per-user rate limits; learners can read their own usage.
-- =============================================================================

create table public.ai_usage_events (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  action        text not null check (action in ('chat', 'correct_writing', 'evaluate_answer')),
  model         text not null default '',
  input_tokens  integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  created_at    timestamptz not null default now()
);
create index ai_usage_events_user_created_idx on public.ai_usage_events (user_id, created_at);

alter table public.ai_usage_events enable row level security;
create policy "AI usage: read own" on public.ai_usage_events for select to authenticated using (user_id = (select auth.uid()));

grant select on public.ai_usage_events to authenticated;
grant all on public.ai_usage_events to service_role;

