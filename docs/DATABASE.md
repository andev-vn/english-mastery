# Database

Supabase Postgres. Schema: [`supabase/migrations/20261123000000_initial_schema.sql`](../supabase/migrations/20261123000000_initial_schema.sql).
Seed: [`supabase/seed.sql`](../supabase/seed.sql), **generated** from `src/data` with `npm run db:seed:generate`. Don't edit it by hand.

## Conventions

- Published content uses stable text slugs as primary keys (`l-a1-greetings`, `v-deadline`). Question ids are `<exercise_id>:<key>`.
- User data uses `uuid` keys and references `profiles` (→ `auth.users`, `on delete cascade`).
- All timestamps are `timestamptz`. `updated_at` is maintained by triggers.
- Enumerations use `check` constraints, so adding a value is a single migration.

## Tables

| Group | Table | Key | Notes |
| --- | --- | --- | --- |
| Structure | `cefr_levels` | `id` A1…C2 | Rows created in the migration (FK target) |
| | `modules` | slug | `category` general/grammar/vocabulary/developer; `unique(level_id, sort_order)` |
| | `lessons` | slug | Composite FK `(module_id, level_id)` keeps the lesson level equal to its module's level |
| | `lesson_contents` | uuid | `block jsonb` with a validated `type`; `unique(lesson_id, position)` |
| | `grammar_topics` | slug | Optional link to a lesson |
| Vocabulary | `vocabulary_topics`, `vocabulary` | slug | `unique(lower(word), part_of_speech)` |
| | `user_vocabulary` | `(user_id, vocabulary_id)` | SM-2 state: repetitions ≥ 0, 1.3 ≤ ease ≤ 5, interval ≥ 0, lapses, favourite, `next_review_at` |
| Exercises | `exercises`, `questions`, `answer_options` | slug / text / uuid | `questions.type` is one of the 7 engine types; type-specific data lives in `payload jsonb` |
| | `user_answers` | uuid | Raw answer log per attempt |
| Users | `profiles` | `id` = `auth.users.id` | display_name ≤ 40, cefr_level, goal, explanation_language, onboarded |
| | `learning_goals` | `user_id` | `daily_minutes` 1–240 |
| | `learning_streaks` | `user_id` | `best_streak ≥ current_streak ≥ 0` |
| Progress | `user_lessons` | `(user_id, lesson_id)` | status in_progress/completed, 0–100 %, completed ⇒ `completed_at` set and 100 % |
| | `study_sessions` | uuid | duration 0–86400 s, xp ≥ 0, score 0–100, **`client_op_id` unique** (idempotent sync) |
| Assessment | `assessments`, `assessment_questions`, `assessment_results` | | Estimated level + per-skill scores |
| Gamification | `achievements`, `user_achievements` | | `metric` + `goal` mirror `src/data/achievements.ts` |
| AI | `ai_conversations`, `ai_messages` | uuid | Composite FK `(conversation_id, user_id)` so a message always belongs to its owner's conversation |

A new row in `auth.users` fires `handle_new_user()` (security definer), which creates the `profiles`,
`learning_goals` and `learning_streaks` rows. The display name comes from sign-up metadata.

## Indexes

Every FK column used in lookups is indexed, plus `user_vocabulary(user_id, next_review_at)` for due cards,
`user_lessons(user_id, completed_at)`, `study_sessions(user_id, created_at)`, `user_answers(user_id, created_at)`,
`assessment_results(user_id, created_at)` and `ai_messages(conversation_id, created_at)`.

## Row Level Security

RLS is enabled on **every** table.

| Data | anon | authenticated |
| --- | --- | --- |
| Published content (levels, modules, lessons, blocks, vocabulary, exercises, questions, options, assessments, achievements) | read | read |
| Unpublished content | – | – |
| `profiles`, `learning_goals` | – | read/update **own** row (created by trigger) |
| `user_lessons`, `user_vocabulary` | – | full CRUD on **own** rows |
| `user_answers` | – | read/insert own |
| `study_sessions`, `learning_streaks`, `user_achievements`, `assessment_results` | – | **read own only**. Writes come from validated security-definer functions (Phase 4), so clients cannot grant themselves XP |
| `ai_conversations` | – | CRUD own |
| `ai_messages` | – | read own; insert own **`role = 'user'`** only (assistant replies come from the Edge Function) |

Content writes have no policy at all. They happen only through migrations and the seed, run by the project owner.
The service-role key is never shipped to the browser, and `src/lib/env.ts` refuses to start with one.

## Tests

`supabase/tests/database.test.ts` runs the real migration and seed in an in-process Postgres (PGlite) with a
small Supabase shim (`supabase/tests/supabase-shim.sql`: roles, `auth.users`, `auth.uid()`, default grants).
No Docker is needed. It covers:

- seed completeness and idempotency
- the new-user trigger
- RLS for guests and for two users (own data only; no client writes to XP, streaks or achievements; AI role restriction)
- constraints (CEFR values, percentages, SRS bounds, statuses, durations, question types, lesson/module level match)
- `client_op_id` idempotency and cascading account deletion

Run them with `npm test`.

## Workflow

```bash
npm run db:seed:generate   # after changing src/data
npx supabase login         # once per machine (opens the browser)
npm run db:link            # once: choose the project
npm run db:push            # apply new migrations + seed to the linked project
npm run db:types           # optional: regenerate src/services/supabase/database.types.ts
```
