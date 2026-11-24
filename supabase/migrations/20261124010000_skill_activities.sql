-- =============================================================================
-- Skill activities (Phase 5): listening, speaking, reading and writing practice.
-- Type-specific content (script lines, paragraphs, conversation turns, writing checklist…)
-- lives in `payload`, validated by the client (src/services/content/assemble.ts) and kept
-- identical to the bundled data by supabase/tests/content-roundtrip.test.ts.
-- =============================================================================

create table public.skill_activities (
  id           text primary key check (id ~ '^[a-z0-9-]+$'),
  skill        text not null check (skill in ('listening', 'speaking', 'reading', 'writing')),
  level_id     text not null references public.cefr_levels (id),
  category     text not null check (category in ('daily', 'work', 'developer', 'interview')),
  title        text not null,
  title_vi     text not null,
  description  text not null default '',
  sort_order   smallint not null default 0 check (sort_order >= 0),
  -- Listening/reading activities point to the exercise holding their comprehension questions.
  exercise_id  text references public.exercises (id) on delete set null,
  payload      jsonb not null check (jsonb_typeof(payload) = 'object'),
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (skill not in ('listening', 'reading') or exercise_id is not null)
);
create index skill_activities_skill_level_idx on public.skill_activities (skill, level_id);
create index skill_activities_exercise_id_idx on public.skill_activities (exercise_id);

create trigger skill_activities_set_updated_at before update on public.skill_activities
  for each row execute function public.set_updated_at();

alter table public.skill_activities enable row level security;
create policy "Content: read published skill activities" on public.skill_activities
  for select to anon, authenticated using (is_published);

grant select on public.skill_activities to anon, authenticated;
grant all on public.skill_activities to service_role;
