-- =============================================================================
-- English Mastery — initial schema
-- Tables, constraints, indexes, Row Level Security and the new-user trigger.
--
-- Conventions
--   * Published content uses stable text slugs as primary keys (e.g. 'l-a1-greetings')
--     so seed data, offline caches and client references stay stable.
--   * User data uses uuid keys and references public.profiles (→ auth.users).
--   * All timestamps are timestamptz.
--   * RLS is enabled on every table. Tables that hold XP, streaks or achievements have
--     NO client write policies: they will only be written by validated security-definer
--     functions (Phase 4), so clients cannot grant themselves progress.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Learning structure (published content)
-- -----------------------------------------------------------------------------
create table public.cefr_levels (
  id          text primary key check (id in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  name        text not null,
  name_vi     text not null,
  description text not null default '',
  sort_order  smallint not null unique check (sort_order between 1 and 6)
);

-- Reference data required by foreign keys (e.g. profiles.cefr_level default 'A1').
insert into public.cefr_levels (id, name, name_vi, description, sort_order) values
  ('A1', 'Beginner', 'Mới bắt đầu', '', 1),
  ('A2', 'Elementary', 'Sơ cấp', '', 2),
  ('B1', 'Intermediate', 'Trung cấp', '', 3),
  ('B2', 'Upper Intermediate', 'Trung cao cấp', '', 4),
  ('C1', 'Advanced', 'Cao cấp', '', 5),
  ('C2', 'Proficiency', 'Thành thạo', '', 6);

create table public.modules (
  id           text primary key check (id ~ '^[a-z0-9-]+$'),
  level_id     text not null references public.cefr_levels (id),
  title        text not null check (char_length(title) between 1 and 120),
  title_vi     text not null check (char_length(title_vi) between 1 and 120),
  description  text not null default '',
  category     text not null default 'general' check (category in ('general', 'grammar', 'vocabulary', 'developer')),
  sort_order   smallint not null check (sort_order >= 0),
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (level_id, sort_order),
  unique (id, level_id) -- target of the composite FK from lessons
);
create index modules_level_id_idx on public.modules (level_id);

create table public.lessons (
  id                text primary key check (id ~ '^[a-z0-9-]+$'),
  module_id         text not null,
  level_id          text not null references public.cefr_levels (id),
  title             text not null check (char_length(title) between 1 and 160),
  title_vi          text not null check (char_length(title_vi) between 1 and 160),
  description       text not null default '',
  objectives        text[] not null default '{}',
  estimated_minutes smallint not null check (estimated_minutes between 1 and 180),
  sort_order        smallint not null check (sort_order >= 0),
  is_published      boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (module_id, sort_order),
  -- A lesson's level must match its module's level.
  foreign key (module_id, level_id) references public.modules (id, level_id) on delete cascade on update cascade
);
create index lessons_module_id_idx on public.lessons (module_id);
create index lessons_level_id_idx on public.lessons (level_id);

create table public.lesson_contents (
  id        uuid primary key default gen_random_uuid(),
  lesson_id text not null references public.lessons (id) on delete cascade,
  position  smallint not null check (position >= 0),
  block     jsonb not null check (
    jsonb_typeof(block) = 'object'
    and block ->> 'type' in ('heading', 'text', 'grammar', 'example', 'mistake', 'tip', 'vocabulary', 'exercise', 'image', 'audio')
  ),
  unique (lesson_id, position)
);

create table public.grammar_topics (
  id         text primary key check (id ~ '^[a-z0-9-]+$'),
  level_id   text not null references public.cefr_levels (id),
  title      text not null,
  title_vi   text not null,
  lesson_id  text references public.lessons (id) on delete set null,
  sort_order smallint not null default 0
);
create index grammar_topics_level_id_idx on public.grammar_topics (level_id);
create index grammar_topics_lesson_id_idx on public.grammar_topics (lesson_id);

-- -----------------------------------------------------------------------------
-- Vocabulary
-- -----------------------------------------------------------------------------
create table public.vocabulary_topics (
  id      text primary key check (id ~ '^[a-z0-9-]+$'),
  name    text not null,
  name_vi text not null
);

create table public.vocabulary (
  id             text primary key check (id ~ '^[a-z0-9-]+$'),
  word           text not null check (char_length(word) between 1 and 80),
  ipa            text not null default '',
  part_of_speech text not null check (part_of_speech in ('noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'phrase')),
  level_id       text not null references public.cefr_levels (id),
  topic_id       text not null references public.vocabulary_topics (id),
  definition     text not null,
  meaning_vi     text not null,
  example        text not null,
  example_vi     text not null,
  synonyms       text[] not null default '{}',
  antonyms       text[] not null default '{}',
  collocations   text[] not null default '{}',
  audio_path     text,
  is_published   boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index vocabulary_word_pos_key on public.vocabulary (lower(word), part_of_speech);
create index vocabulary_level_id_idx on public.vocabulary (level_id);
create index vocabulary_topic_id_idx on public.vocabulary (topic_id);

-- -----------------------------------------------------------------------------
-- Exercises
-- -----------------------------------------------------------------------------
create table public.exercises (
  id                text primary key check (id ~ '^[a-z0-9-]+$'),
  level_id          text not null references public.cefr_levels (id),
  skill             text not null check (skill in ('grammar', 'vocabulary', 'reading', 'listening', 'writing', 'developer')),
  title             text not null,
  title_vi          text not null,
  description       text not null default '',
  estimated_minutes smallint not null check (estimated_minutes between 1 and 120),
  is_published      boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index exercises_level_id_idx on public.exercises (level_id);

create table public.questions (
  id             text primary key, -- '<exercise_id>:<question key>'
  exercise_id    text not null references public.exercises (id) on delete cascade,
  position       smallint not null check (position >= 0),
  type           text not null check (type in ('multiple_choice', 'true_false', 'fill_blank', 'matching', 'ordering', 'error_correction', 'translation')),
  prompt         text not null,
  context        text,
  -- Type-specific data (statement/answer, sentence/acceptedAnswers, pairs, tokens, ...).
  payload        jsonb not null default '{}' check (jsonb_typeof(payload) = 'object'),
  explanation_vi text not null,
  unique (exercise_id, position)
);

create table public.answer_options (
  id          uuid primary key default gen_random_uuid(),
  question_id text not null references public.questions (id) on delete cascade,
  option_key  text not null,
  text        text not null,
  is_correct  boolean not null default false,
  position    smallint not null check (position >= 0),
  unique (question_id, option_key)
);
create index answer_options_question_id_idx on public.answer_options (question_id);

-- -----------------------------------------------------------------------------
-- Users
-- -----------------------------------------------------------------------------
create table public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  display_name         text not null default '' check (char_length(display_name) <= 40),
  cefr_level           text not null default 'A1' references public.cefr_levels (id),
  goal                 text not null default 'daily' check (goal in ('work', 'travel', 'study', 'interview', 'daily')),
  explanation_language text not null default 'vi' check (explanation_language in ('vi', 'en')),
  onboarded            boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table public.learning_goals (
  user_id       uuid primary key references public.profiles (id) on delete cascade,
  daily_minutes smallint not null default 15 check (daily_minutes between 1 and 240),
  updated_at    timestamptz not null default now()
);

create table public.learning_streaks (
  user_id          uuid primary key references public.profiles (id) on delete cascade,
  current_streak   integer not null default 0 check (current_streak >= 0),
  best_streak      integer not null default 0 check (best_streak >= 0),
  last_active_date date,
  updated_at       timestamptz not null default now(),
  check (best_streak >= current_streak)
);

-- -----------------------------------------------------------------------------
-- Learning progress
-- -----------------------------------------------------------------------------
create table public.user_lessons (
  user_id          uuid not null references public.profiles (id) on delete cascade,
  lesson_id        text not null references public.lessons (id) on delete cascade,
  status           text not null check (status in ('in_progress', 'completed')),
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  updated_at       timestamptz not null default now(),
  primary key (user_id, lesson_id),
  check (status <> 'completed' or (completed_at is not null and progress_percent = 100))
);
create index user_lessons_lesson_id_idx on public.user_lessons (lesson_id);
create index user_lessons_user_completed_idx on public.user_lessons (user_id, completed_at);

create table public.user_vocabulary (
  user_id          uuid not null references public.profiles (id) on delete cascade,
  vocabulary_id    text not null references public.vocabulary (id) on delete cascade,
  repetitions      integer not null default 0 check (repetitions >= 0),
  ease_factor      numeric(4, 2) not null default 2.5 check (ease_factor >= 1.3 and ease_factor <= 5),
  interval_days    integer not null default 0 check (interval_days >= 0),
  lapses           integer not null default 0 check (lapses >= 0),
  is_favorite      boolean not null default false,
  last_reviewed_at timestamptz,
  next_review_at   timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (user_id, vocabulary_id)
);
create index user_vocabulary_due_idx on public.user_vocabulary (user_id, next_review_at);
create index user_vocabulary_vocabulary_id_idx on public.user_vocabulary (vocabulary_id);

create table public.user_answers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  question_id text not null references public.questions (id) on delete cascade,
  attempt_id  uuid not null,
  answer      jsonb not null,
  is_correct  boolean not null,
  created_at  timestamptz not null default now()
);
create index user_answers_user_created_idx on public.user_answers (user_id, created_at);
create index user_answers_question_id_idx on public.user_answers (question_id);
create index user_answers_attempt_id_idx on public.user_answers (attempt_id);

create table public.study_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  kind             text not null check (kind in ('lesson', 'exercise', 'review', 'assessment', 'other')),
  ref_id           text,
  duration_seconds integer not null default 0 check (duration_seconds between 0 and 86400),
  xp               integer not null default 0 check (xp >= 0),
  score            smallint check (score between 0 and 100),
  -- Client-generated operation id: makes offline sync idempotent.
  client_op_id     uuid not null unique,
  created_at       timestamptz not null default now()
);
create index study_sessions_user_created_idx on public.study_sessions (user_id, created_at);

-- -----------------------------------------------------------------------------
-- Assessment
-- -----------------------------------------------------------------------------
create table public.assessments (
  id           text primary key check (id ~ '^[a-z0-9-]+$'),
  title        text not null,
  title_vi     text not null,
  description  text not null default '',
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create table public.assessment_questions (
  id             text primary key,
  assessment_id  text not null references public.assessments (id) on delete cascade,
  position       smallint not null check (position >= 0),
  skill          text not null check (skill in ('grammar', 'vocabulary', 'reading', 'listening', 'writing', 'speaking')),
  level_id       text not null references public.cefr_levels (id),
  type           text not null check (type in ('multiple_choice', 'true_false', 'fill_blank', 'matching', 'ordering', 'error_correction', 'translation')),
  prompt         text not null,
  payload        jsonb not null default '{}' check (jsonb_typeof(payload) = 'object'),
  explanation_vi text not null default '',
  unique (assessment_id, position)
);

create table public.assessment_results (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  assessment_id   text not null references public.assessments (id) on delete cascade,
  estimated_level text not null references public.cefr_levels (id),
  score           smallint not null check (score between 0 and 100),
  skill_scores    jsonb not null default '{}' check (jsonb_typeof(skill_scores) = 'object'),
  created_at      timestamptz not null default now()
);
create index assessment_results_user_created_idx on public.assessment_results (user_id, created_at);

-- -----------------------------------------------------------------------------
-- Gamification
-- -----------------------------------------------------------------------------
create table public.achievements (
  id          text primary key check (id ~ '^[a-z0-9-]+$'),
  title       text not null,
  description text not null,
  metric      text not null,
  goal        integer not null check (goal > 0)
);

create table public.user_achievements (
  user_id        uuid not null references public.profiles (id) on delete cascade,
  achievement_id text not null references public.achievements (id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  primary key (user_id, achievement_id)
);
create index user_achievements_achievement_id_idx on public.user_achievements (achievement_id);

-- -----------------------------------------------------------------------------
-- AI tutor (optional feature)
-- -----------------------------------------------------------------------------
create table public.ai_conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null default '' check (char_length(title) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id) -- target of the composite FK from ai_messages
);
create index ai_conversations_user_created_idx on public.ai_conversations (user_id, created_at);

create table public.ai_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  user_id         uuid not null,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null check (char_length(content) between 1 and 20000),
  created_at      timestamptz not null default now(),
  -- A message always belongs to a conversation owned by the same user.
  foreign key (conversation_id, user_id) references public.ai_conversations (id, user_id) on delete cascade
);
create index ai_messages_conversation_created_idx on public.ai_messages (conversation_id, created_at);
create index ai_messages_user_id_idx on public.ai_messages (user_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
create trigger modules_set_updated_at before update on public.modules for each row execute function public.set_updated_at();
create trigger lessons_set_updated_at before update on public.lessons for each row execute function public.set_updated_at();
create trigger vocabulary_set_updated_at before update on public.vocabulary for each row execute function public.set_updated_at();
create trigger exercises_set_updated_at before update on public.exercises for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger learning_goals_set_updated_at before update on public.learning_goals for each row execute function public.set_updated_at();
create trigger learning_streaks_set_updated_at before update on public.learning_streaks for each row execute function public.set_updated_at();
create trigger user_lessons_set_updated_at before update on public.user_lessons for each row execute function public.set_updated_at();
create trigger user_vocabulary_set_updated_at before update on public.user_vocabulary for each row execute function public.set_updated_at();
create trigger ai_conversations_set_updated_at before update on public.ai_conversations for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- New user → profile, goal and streak rows
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(trim(new.raw_user_meta_data ->> 'display_name'), ''), 40));
  insert into public.learning_goals (user_id) values (new.id);
  insert into public.learning_streaks (user_id) values (new.id);
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.cefr_levels          enable row level security;
alter table public.modules              enable row level security;
alter table public.lessons              enable row level security;
alter table public.lesson_contents      enable row level security;
alter table public.grammar_topics       enable row level security;
alter table public.vocabulary_topics    enable row level security;
alter table public.vocabulary           enable row level security;
alter table public.exercises            enable row level security;
alter table public.questions            enable row level security;
alter table public.answer_options       enable row level security;
alter table public.profiles             enable row level security;
alter table public.learning_goals       enable row level security;
alter table public.learning_streaks     enable row level security;
alter table public.user_lessons         enable row level security;
alter table public.user_vocabulary      enable row level security;
alter table public.user_answers         enable row level security;
alter table public.study_sessions       enable row level security;
alter table public.assessments          enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_results   enable row level security;
alter table public.achievements         enable row level security;
alter table public.user_achievements    enable row level security;
alter table public.ai_conversations     enable row level security;
alter table public.ai_messages          enable row level security;

-- Published content: readable by guests and signed-in users. No write policies:
-- content is managed through migrations / seed run with the service role.
create policy "Content: read levels" on public.cefr_levels for select to anon, authenticated using (true);
create policy "Content: read published modules" on public.modules for select to anon, authenticated using (is_published);
create policy "Content: read published lessons" on public.lessons for select to anon, authenticated using (is_published);
create policy "Content: read blocks of published lessons" on public.lesson_contents for select to anon, authenticated
  using (exists (select 1 from public.lessons l where l.id = lesson_id and l.is_published));
create policy "Content: read grammar topics" on public.grammar_topics for select to anon, authenticated using (true);
create policy "Content: read vocabulary topics" on public.vocabulary_topics for select to anon, authenticated using (true);
create policy "Content: read published vocabulary" on public.vocabulary for select to anon, authenticated using (is_published);
create policy "Content: read published exercises" on public.exercises for select to anon, authenticated using (is_published);
create policy "Content: read questions of published exercises" on public.questions for select to anon, authenticated
  using (exists (select 1 from public.exercises e where e.id = exercise_id and e.is_published));
create policy "Content: read options of published exercises" on public.answer_options for select to anon, authenticated
  using (exists (
    select 1 from public.questions q join public.exercises e on e.id = q.exercise_id
    where q.id = question_id and e.is_published
  ));
create policy "Content: read published assessments" on public.assessments for select to anon, authenticated using (is_published);
create policy "Content: read questions of published assessments" on public.assessment_questions for select to anon, authenticated
  using (exists (select 1 from public.assessments a where a.id = assessment_id and a.is_published));
create policy "Content: read achievements" on public.achievements for select to anon, authenticated using (true);

-- Profiles: created by trigger; users read and update only their own row.
create policy "Profiles: read own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "Profiles: update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Goals: users manage their own goal.
create policy "Goals: read own" on public.learning_goals for select to authenticated using (user_id = (select auth.uid()));
create policy "Goals: update own" on public.learning_goals for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Progress rows owned by the user (no XP is stored here).
create policy "Lessons progress: read own" on public.user_lessons for select to authenticated using (user_id = (select auth.uid()));
create policy "Lessons progress: insert own" on public.user_lessons for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Lessons progress: update own" on public.user_lessons for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Lessons progress: delete own" on public.user_lessons for delete to authenticated using (user_id = (select auth.uid()));

create policy "Vocabulary progress: read own" on public.user_vocabulary for select to authenticated using (user_id = (select auth.uid()));
create policy "Vocabulary progress: insert own" on public.user_vocabulary for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Vocabulary progress: update own" on public.user_vocabulary for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Vocabulary progress: delete own" on public.user_vocabulary for delete to authenticated using (user_id = (select auth.uid()));

create policy "Answers: read own" on public.user_answers for select to authenticated using (user_id = (select auth.uid()));
create policy "Answers: insert own" on public.user_answers for insert to authenticated with check (user_id = (select auth.uid()));

-- XP, streaks, achievements, sessions and assessment results: read-only for clients.
-- Writes happen in validated security-definer functions (Phase 4).
create policy "Sessions: read own" on public.study_sessions for select to authenticated using (user_id = (select auth.uid()));
create policy "Streaks: read own" on public.learning_streaks for select to authenticated using (user_id = (select auth.uid()));
create policy "Achievements: read own" on public.user_achievements for select to authenticated using (user_id = (select auth.uid()));
create policy "Assessment results: read own" on public.assessment_results for select to authenticated using (user_id = (select auth.uid()));

-- AI: users manage their conversations; they may only add their own *user* messages.
-- Assistant messages are inserted by the AI Edge Function with the service role.
create policy "AI conversations: read own" on public.ai_conversations for select to authenticated using (user_id = (select auth.uid()));
create policy "AI conversations: insert own" on public.ai_conversations for insert to authenticated with check (user_id = (select auth.uid()));
create policy "AI conversations: update own" on public.ai_conversations for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "AI conversations: delete own" on public.ai_conversations for delete to authenticated using (user_id = (select auth.uid()));
create policy "AI messages: read own" on public.ai_messages for select to authenticated using (user_id = (select auth.uid()));
create policy "AI messages: insert own user messages" on public.ai_messages for insert to authenticated
  with check (user_id = (select auth.uid()) and role = 'user');
