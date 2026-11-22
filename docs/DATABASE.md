# Database (planned — Phase 2)

> Not implemented yet. Phase 1 stores guest progress in the browser. This document is the design the Phase 2
> migrations (`supabase/migrations/*.sql`) will implement. The TypeScript model in `src/types` already mirrors it.

Engine: Supabase Postgres. UUID primary keys (`gen_random_uuid()`) for user data; stable text slugs
(e.g. `l-a1-greetings`) for published content so seed data and offline caches stay referentially stable.
All timestamps are `timestamptz`.

## Tables

### Users
- **profiles** (`id uuid pk → auth.users`, `display_name`, `cefr_level`, `goal`, `daily_goal_minutes`, `explanation_language`, `created_at`, `updated_at`)

### Learning structure (published content)
- **cefr_levels** (`id text pk check in ('A1'…'C2')`, `name`, `name_vi`, `description`, `sort_order`)
- **modules** (`id text pk`, `level_id → cefr_levels`, `title`, `title_vi`, `description`, `category check in ('general','grammar','vocabulary','developer')`, `sort_order`, `is_published`)
- **lessons** (`id text pk`, `module_id → modules`, `level_id`, `title`, `title_vi`, `description`, `objectives text[]`, `estimated_minutes int check > 0`, `sort_order`, `is_published`)
- **lesson_contents** (`id uuid pk`, `lesson_id → lessons`, `position int`, `block jsonb` — validated `type` in heading/text/grammar/example/mistake/tip/vocabulary/exercise/image/audio; unique `(lesson_id, position)`)
- **grammar_topics** (`id text pk`, `level_id`, `title`, `title_vi`, `lesson_id → lessons null`)

### Vocabulary
- **vocabulary_topics** (`id text pk`, `name`, `name_vi`)
- **vocabulary** (`id text pk`, `word`, `ipa`, `part_of_speech`, `level_id`, `topic_id → vocabulary_topics`, `definition`, `meaning_vi`, `example`, `example_vi`, `synonyms text[]`, `antonyms text[]`, `collocations text[]`, `audio_path null`)
- **user_vocabulary** (`user_id → profiles`, `vocabulary_id → vocabulary`, `repetitions int ≥ 0`, `ease_factor numeric ≥ 1.3`, `interval_days int ≥ 0`, `lapses int ≥ 0`, `last_reviewed_at`, `next_review_at`, `is_favorite`, `updated_at`; **unique (user_id, vocabulary_id)**)

### Exercises
- **exercises** (`id text pk`, `level_id`, `skill`, `title`, `title_vi`, `description`, `estimated_minutes`)
- **questions** (`id text pk`, `exercise_id → exercises`, `position`, `type check in (multiple_choice, true_false, fill_blank, matching, ordering, error_correction, translation)`, `prompt`, `context`, `payload jsonb`, `explanation_vi`)
- **answer_options** (`id uuid pk`, `question_id → questions`, `label`, `text`, `is_correct`)
- **user_answers** (`id uuid pk`, `user_id`, `question_id`, `attempt_id`, `answer jsonb`, `is_correct`, `created_at`)

### Progress
- **user_lessons** (`user_id`, `lesson_id`, `status check in ('in_progress','completed')`, `progress_percent int check 0..100`, `completed_at`, `updated_at`; **unique (user_id, lesson_id)**)
- **study_sessions** (`id uuid pk`, `user_id`, `kind`, `ref_id`, `duration_seconds int ≥ 0`, `xp int ≥ 0`, `score int check 0..100 null`, `client_op_id uuid unique` (idempotent sync), `created_at`)
- **learning_goals** (`user_id pk`, `daily_minutes int > 0`, `updated_at`)
- **learning_streaks** (`user_id pk`, `current int ≥ 0`, `best int ≥ 0`, `last_active_date date`)

### Assessment
- **assessments**, **assessment_questions**, **assessment_results** (`user_id`, `assessment_id`, `estimated_level`, `skill_scores jsonb`, `created_at`)

### Gamification
- **achievements** (`id text pk`, `title`, `description`, `metric`, `goal int > 0`)
- **user_achievements** (`user_id`, `achievement_id`, `unlocked_at`; unique pair)

### AI (optional)
- **ai_conversations** (`id uuid pk`, `user_id`, `topic`, `created_at`)
- **ai_messages** (`id uuid pk`, `conversation_id`, `role check in ('user','assistant')`, `content`, `created_at`)

## Indexes

`user_id` on every user table · `user_lessons(lesson_id)`, `user_lessons(completed_at)` ·
`user_vocabulary(user_id, next_review_at)` (due-card queries) · `user_vocabulary(vocabulary_id)` ·
`study_sessions(user_id, created_at)` · `ai_messages(conversation_id, created_at)` · content `sort_order` per parent.

## Row Level Security

- Enabled on **every** table.
- User tables: `using (user_id = auth.uid())` for select/insert/update/delete (profiles: `id = auth.uid()`).
- Published content: `select` for `anon` and `authenticated` where `is_published`; no insert/update/delete policies —
  content changes only via migrations/seed run with the service role (never shipped to the browser).
- XP/streak updates go through a `security definer` RPC that validates the activity (e.g. one completion XP per lesson),
  so clients cannot write arbitrary XP.
- Policies will be tested with SQL tests (`supabase test db`) using two users.
