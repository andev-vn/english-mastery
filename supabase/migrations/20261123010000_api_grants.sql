-- =============================================================================
-- Explicit Data API privileges.
--
-- Supabase projects no longer grant table privileges to the API roles automatically, so each
-- table is exposed deliberately here. Privileges are least-privilege and mirror the RLS policies
-- in the initial schema: a role only gets a verb that some policy can allow. RLS still decides
-- WHICH rows; these grants decide which operations are possible at all.
-- =============================================================================

grant usage on schema public to anon, authenticated;

-- Published content: read-only for guests and signed-in users.
grant select on
  public.cefr_levels,
  public.modules,
  public.lessons,
  public.lesson_contents,
  public.grammar_topics,
  public.vocabulary_topics,
  public.vocabulary,
  public.exercises,
  public.questions,
  public.answer_options,
  public.assessments,
  public.assessment_questions,
  public.achievements
to anon, authenticated;

-- Own profile and goal: read + update (rows are created by the signup trigger).
grant select, update on public.profiles, public.learning_goals to authenticated;

-- Own learning progress rows.
grant select, insert, update, delete on public.user_lessons, public.user_vocabulary to authenticated;
grant select, insert on public.user_answers to authenticated;

-- XP, streaks, achievements, sessions, assessment results: read-only for clients.
grant select on
  public.study_sessions,
  public.learning_streaks,
  public.user_achievements,
  public.assessment_results
to authenticated;

-- AI tutor.
grant select, insert, update, delete on public.ai_conversations to authenticated;
grant select, insert on public.ai_messages to authenticated;

-- Server-side code (Edge Functions, admin scripts) uses the service role, which bypasses RLS.
grant all on all tables in schema public to service_role;
