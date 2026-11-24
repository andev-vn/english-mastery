-- =============================================================================
-- Server-validated progress (Phase 4)
--
-- Clients cannot write XP, streaks, achievements, study sessions or assessment results directly
-- (no RLS write policies). Instead they call these security-definer RPCs, which:
--   * grade answers on the server (mirrors src/lib/grading.ts),
--   * apply the XP rules (mirrors src/lib/xp.ts),
--   * are idempotent per client operation id (safe to retry / replay from an offline queue),
--   * update the streak in the learner's own time zone and unlock achievements.
-- Parity with the TypeScript rules is covered by supabase/tests/progress-rpc.test.ts.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Schema additions
-- -----------------------------------------------------------------------------
alter table public.assessments
  add column estimated_minutes smallint not null default 10 check (estimated_minutes between 1 and 120);

alter table public.assessment_results
  add column mastered_level text references public.cefr_levels (id),
  add column level_scores   jsonb not null default '{}' check (jsonb_typeof(level_scores) = 'object'),
  add column client_op_id   uuid unique;

-- -----------------------------------------------------------------------------
-- Answer grading (mirrors src/lib/grading.ts)
-- -----------------------------------------------------------------------------
-- Same steps as normalizeAnswer(): NFC, straighten quotes, lower-case, collapse whitespace,
-- trim, drop spaces before punctuation, drop trailing . ! ?
create or replace function public.normalize_answer(t text)
returns text
language sql
immutable
set search_path = ''
as $$
  select btrim(
    regexp_replace(
      regexp_replace(
        btrim(regexp_replace(lower(translate(normalize(coalesce(t, ''), NFC), '‘’ʼ`“”', $q$''''""$q$)), '\s+', ' ', 'g')),
        '\s+([?.!,])', '\1', 'g'
      ),
      '[.!?]+$', ''
    )
  )
$$;

create or replace function public.matches_any(p_input text, p_accepted jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select v <> '' and exists (
    select 1 from jsonb_array_elements_text(coalesce(p_accepted, '[]'::jsonb)) a where public.normalize_answer(a) = v
  )
  from (select public.normalize_answer(p_input) as v) s
$$;

-- p_correct_option: for multiple choice (from answer_options or the assessment payload).
create or replace function public.grade_answer(p_type text, p_payload jsonb, p_correct_option text, p_answer jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_answer is null or jsonb_typeof(p_answer) <> 'object' or (p_answer ->> 'type') is distinct from p_type then
    return false;
  end if;
  case p_type
    when 'multiple_choice' then
      return (p_answer ->> 'optionId') = p_correct_option;
    when 'true_false' then
      return jsonb_typeof(p_answer -> 'value') = 'boolean' and (p_answer -> 'value') = (p_payload -> 'answer');
    when 'fill_blank', 'error_correction', 'translation' then
      return public.matches_any(p_answer ->> 'text', p_payload -> 'acceptedAnswers');
    when 'ordering' then
      return (p_answer -> 'tokens') = (p_payload -> 'tokens');
    when 'matching' then
      return jsonb_typeof(p_answer -> 'pairs') = 'object'
        and (select count(*) from jsonb_object_keys(p_answer -> 'pairs')) = jsonb_array_length(p_payload -> 'pairs')
        and not exists (
          select 1 from jsonb_array_elements(p_payload -> 'pairs') p
          where (p_answer -> 'pairs' ->> (p ->> 'left')) is distinct from (p ->> 'right')
        );
    else
      return false;
  end case;
end;
$$;

-- -----------------------------------------------------------------------------
-- Internal helpers
-- -----------------------------------------------------------------------------
-- Today in the learner's time zone (IANA name); unknown zones fall back to UTC.
create or replace function public._local_date(p_tz text)
returns date
language plpgsql
stable
set search_path = ''
as $$
begin
  return (now() at time zone coalesce(nullif(p_tz, ''), 'UTC'))::date;
exception when others then
  return (now() at time zone 'UTC')::date;
end;
$$;

create or replace function public._safe_tz(p_tz text)
returns text
language plpgsql
stable
set search_path = ''
as $$
begin
  perform now() at time zone coalesce(nullif(p_tz, ''), 'UTC');
  return coalesce(nullif(p_tz, ''), 'UTC');
exception when others then
  return 'UTC';
end;
$$;

-- Records activity on a local day: extends, keeps or restarts the streak.
create or replace function public._touch_streak(p_user uuid, p_day date)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_last date;
  v_current integer;
  v_best integer;
begin
  insert into public.learning_streaks (user_id) values (p_user) on conflict (user_id) do nothing;
  select last_active_date, current_streak, best_streak into v_last, v_current, v_best
    from public.learning_streaks where user_id = p_user for update;
  if v_last is not null and v_last >= p_day then
    return; -- already counted (or a clock/time-zone change moved backwards)
  end if;
  v_current := case when v_last = p_day - 1 then v_current + 1 else 1 end;
  update public.learning_streaks
    set current_streak = v_current, best_streak = greatest(v_best, v_current), last_active_date = p_day
    where user_id = p_user;
end;
$$;

-- Unlocks every achievement whose metric reached its goal; returns the newly unlocked ids.
create or replace function public._unlock_achievements(p_user uuid)
returns text[]
language sql
set search_path = ''
as $$
  with m as (
    select
      (select coalesce(sum(xp), 0) from public.study_sessions where user_id = p_user) as total_xp,
      (select count(distinct ref_id) from public.study_sessions where user_id = p_user and kind = 'lesson' and xp > 0) as completed_lessons,
      (select coalesce(max(best_streak), 0) from public.learning_streaks where user_id = p_user) as best_streak,
      (select coalesce(max(current_streak), 0) from public.learning_streaks where user_id = p_user) as current_streak,
      (select count(distinct ref_id) from public.study_sessions where user_id = p_user and kind = 'exercise' and score = 100) as perfect_exercises,
      (select count(*) from public.user_vocabulary where user_id = p_user and repetitions >= 2) as words_learned,
      (select coalesce(sum(duration_seconds), 0) / 60 from public.study_sessions where user_id = p_user) as total_minutes
  ),
  reached as (
    select a.id from public.achievements a, m
    where case a.metric
      when 'totalXp' then m.total_xp
      when 'completedLessons' then m.completed_lessons
      when 'bestStreak' then m.best_streak
      when 'currentStreak' then m.current_streak
      when 'perfectExercises' then m.perfect_exercises
      when 'wordsLearned' then m.words_learned
      when 'totalMinutes' then m.total_minutes
      else 0
    end >= a.goal
  ),
  ins as (
    insert into public.user_achievements (user_id, achievement_id)
    select p_user, id from reached
    on conflict do nothing
    returning achievement_id
  )
  select coalesce(array_agg(achievement_id order by achievement_id), '{}') from ins
$$;

-- Totals and recent activity for one user (used by every RPC and to restore a new device).
create or replace function public._progress_summary(p_user uuid, p_tz text)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with tz as (select public._safe_tz(p_tz) as name),
  today as (select (now() at time zone (select name from tz))::date as d),
  streak as (
    select current_streak, best_streak, last_active_date from public.learning_streaks where user_id = p_user
  ),
  days as (
    select (s.created_at at time zone (select name from tz))::date as day,
           sum(s.duration_seconds) / 60 as minutes,
           sum(s.xp) as xp
    from public.study_sessions s
    where s.user_id = p_user and s.created_at >= now() - interval '62 days'
    group by 1
  )
  select jsonb_build_object(
    'totalXp', (select coalesce(sum(xp), 0) from public.study_sessions where user_id = p_user),
    'currentStreak', coalesce((
      select case when last_active_date >= (select d from today) - 1 then current_streak else 0 end from streak
    ), 0),
    'bestStreak', coalesce((select best_streak from streak), 0),
    'completedLessonIds', coalesce((
      select jsonb_agg(lesson_id order by lesson_id) from (
        select lesson_id from public.user_lessons where user_id = p_user and status = 'completed'
        union
        select ref_id from public.study_sessions where user_id = p_user and kind = 'lesson' and xp > 0
      ) c(lesson_id)
    ), '[]'::jsonb),
    'achievementIds', coalesce((
      select jsonb_agg(achievement_id order by achievement_id) from public.user_achievements where user_id = p_user
    ), '[]'::jsonb),
    'days', coalesce((
      select jsonb_agg(jsonb_build_object('day', day, 'minutes', minutes, 'xp', xp) order by day) from days
    ), '[]'::jsonb)
  )
$$;

create or replace function public._require_user()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  return v_uid;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPCs
-- -----------------------------------------------------------------------------
-- Completes a lesson. 20 XP the first time only (XP rules: src/lib/xp.ts).
create or replace function public.complete_lesson(p_lesson_id text, p_op_id uuid, p_tz text default 'UTC')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public._require_user();
  v_minutes integer;
  v_xp integer := 0;
  v_prev integer;
  v_new text[];
begin
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  select xp into v_prev from public.study_sessions where client_op_id = p_op_id and user_id = v_uid;
  if found then
    return jsonb_build_object('xp', v_prev, 'duplicate', true, 'newAchievements', '[]'::jsonb) || public._progress_summary(v_uid, p_tz);
  end if;

  select estimated_minutes into v_minutes from public.lessons where id = p_lesson_id and is_published;
  if not found then
    raise exception 'Unknown lesson: %', p_lesson_id using errcode = 'P0002';
  end if;

  -- XP is decided from the (client-read-only) session ledger, not from user_lessons, which clients can edit.
  if not exists (
    select 1 from public.study_sessions where user_id = v_uid and kind = 'lesson' and ref_id = p_lesson_id and xp > 0
  ) then
    v_xp := 20;
  end if;

  insert into public.user_lessons (user_id, lesson_id, status, progress_percent, completed_at)
  values (v_uid, p_lesson_id, 'completed', 100, now())
  on conflict (user_id, lesson_id) do update
    set status = 'completed', progress_percent = 100, completed_at = coalesce(public.user_lessons.completed_at, now());

  insert into public.study_sessions (user_id, kind, ref_id, duration_seconds, xp, client_op_id)
  values (v_uid, 'lesson', p_lesson_id, v_minutes * 60, v_xp, p_op_id);

  perform public._touch_streak(v_uid, public._local_date(p_tz));
  v_new := public._unlock_achievements(v_uid);
  return jsonb_build_object('xp', v_xp, 'duplicate', false, 'newAchievements', to_jsonb(v_new)) || public._progress_summary(v_uid, p_tz);
end;
$$;

-- Grades an exercise on the server and records it.
-- p_answers: { "<question key>": <AnswerValue>, ... } (same shape as src/types/content.ts AnswerValue).
-- XP: 5 per correct answer above the previous best + 10 for a first perfect score.
create or replace function public.submit_exercise(
  p_exercise_id text,
  p_answers jsonb,
  p_duration_seconds integer,
  p_op_id uuid,
  p_tz text default 'UTC'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public._require_user();
  v_total integer;
  v_correct integer;
  v_results jsonb;
  v_prev_score integer;
  v_prev_correct integer;
  v_score integer;
  v_xp integer;
  v_new text[];
  v_session record;
  v_graded jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  select xp, score into v_session from public.study_sessions where client_op_id = p_op_id and user_id = v_uid;
  if found then
    return jsonb_build_object('xp', v_session.xp, 'score', v_session.score, 'duplicate', true, 'newAchievements', '[]'::jsonb)
      || public._progress_summary(v_uid, p_tz);
  end if;

  if not exists (select 1 from public.exercises where id = p_exercise_id and is_published) then
    raise exception 'Unknown exercise: %', p_exercise_id using errcode = 'P0002';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Answers must be a JSON object' using errcode = '22023';
  end if;

  -- (No temporary tables: they are unsafe in security-definer functions.)
  select coalesce(jsonb_agg(jsonb_build_object('question_id', g.question_id, 'key', g.key, 'answer', g.answer, 'ok', g.ok)), '[]'::jsonb)
    into v_graded
  from (
    select q.id as question_id,
           substr(q.id, length(p_exercise_id) + 2) as key,
           p_answers -> substr(q.id, length(p_exercise_id) + 2) as answer,
           public.grade_answer(
             q.type,
             q.payload,
             (select o.option_key from public.answer_options o where o.question_id = q.id and o.is_correct limit 1),
             p_answers -> substr(q.id, length(p_exercise_id) + 2)
           ) as ok
    from public.questions q
    where q.exercise_id = p_exercise_id
  ) g;

  select count(*), count(*) filter (where (e ->> 'ok')::boolean), coalesce(jsonb_object_agg(e ->> 'key', (e ->> 'ok')::boolean), '{}'::jsonb)
    into v_total, v_correct, v_results
  from jsonb_array_elements(v_graded) e;

  insert into public.user_answers (user_id, question_id, attempt_id, answer, is_correct)
  select v_uid, e ->> 'question_id', p_op_id, e -> 'answer', (e ->> 'ok')::boolean
  from jsonb_array_elements(v_graded) e
  where jsonb_typeof(e -> 'answer') = 'object';

  select coalesce(max(score), 0) into v_prev_score
    from public.study_sessions where user_id = v_uid and kind = 'exercise' and ref_id = p_exercise_id;
  v_prev_correct := round(v_prev_score * v_total / 100.0);
  v_xp := greatest(0, v_correct - v_prev_correct) * 5
        + case when v_total > 0 and v_correct = v_total and v_prev_correct < v_total then 10 else 0 end;
  v_score := case when v_total = 0 then 0 else round(v_correct * 100.0 / v_total) end;

  insert into public.study_sessions (user_id, kind, ref_id, duration_seconds, xp, score, client_op_id)
  values (v_uid, 'exercise', p_exercise_id, least(greatest(coalesce(p_duration_seconds, 0), 0), 86400), v_xp, v_score, p_op_id);

  perform public._touch_streak(v_uid, public._local_date(p_tz));
  v_new := public._unlock_achievements(v_uid);
  return jsonb_build_object(
    'xp', v_xp, 'score', v_score, 'correct', v_correct, 'total', v_total, 'results', v_results,
    'duplicate', false, 'newAchievements', to_jsonb(v_new)
  ) || public._progress_summary(v_uid, p_tz);
end;
$$;

-- Records a flashcard session. Review state lives in user_vocabulary (client-writable), so the server
-- cannot verify due dates: XP is 2 per recalled card, capped at 120 XP of reviews per local day.
create or replace function public.record_reviews(
  p_reviewed integer,
  p_recalled integer,
  p_duration_seconds integer,
  p_op_id uuid,
  p_tz text default 'UTC'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public._require_user();
  v_tz text := public._safe_tz(p_tz);
  v_today date := public._local_date(p_tz);
  v_earned integer;
  v_xp integer;
  v_prev integer;
  v_new text[];
begin
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  select xp into v_prev from public.study_sessions where client_op_id = p_op_id and user_id = v_uid;
  if found then
    return jsonb_build_object('xp', v_prev, 'duplicate', true, 'newAchievements', '[]'::jsonb) || public._progress_summary(v_uid, p_tz);
  end if;
  if coalesce(p_reviewed, 0) <= 0 then
    raise exception 'Nothing reviewed' using errcode = '22023';
  end if;

  select coalesce(sum(xp), 0) into v_earned
    from public.study_sessions
    where user_id = v_uid and kind = 'review' and (created_at at time zone v_tz)::date = v_today;
  v_xp := least(greatest(least(coalesce(p_recalled, 0), p_reviewed), 0) * 2, greatest(0, 120 - v_earned));

  insert into public.study_sessions (user_id, kind, ref_id, duration_seconds, xp, client_op_id)
  values (v_uid, 'review', 'flashcards', least(greatest(coalesce(p_duration_seconds, 0), 0), 86400), v_xp, p_op_id);

  perform public._touch_streak(v_uid, v_today);
  v_new := public._unlock_achievements(v_uid);
  return jsonb_build_object('xp', v_xp, 'duplicate', false, 'newAchievements', to_jsonb(v_new)) || public._progress_summary(v_uid, p_tz);
end;
$$;

-- Scores a placement test (mirrors src/lib/placement.ts): a level is mastered at >= 75% correct;
-- the estimate is the level after the highest consecutive mastered level.
create or replace function public.submit_assessment(
  p_assessment_id text,
  p_answers jsonb,
  p_duration_seconds integer,
  p_op_id uuid,
  p_tz text default 'UTC'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public._require_user();
  v_existing record;
  v_total integer;
  v_correct integer;
  v_results jsonb;
  v_level_scores jsonb;
  v_skill_scores jsonb;
  v_mastered text;
  v_estimated text;
  v_score integer;
  v_level record;
  v_passed boolean := true;
  v_graded jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  select * into v_existing from public.assessment_results where client_op_id = p_op_id and user_id = v_uid;
  if found then
    return jsonb_build_object(
      'duplicate', true, 'estimatedLevel', v_existing.estimated_level, 'masteredLevel', v_existing.mastered_level,
      'score', v_existing.score, 'skillScores', v_existing.skill_scores, 'levelScores', v_existing.level_scores
    );
  end if;
  if not exists (select 1 from public.assessments where id = p_assessment_id and is_published) then
    raise exception 'Unknown assessment: %', p_assessment_id using errcode = 'P0002';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Answers must be a JSON object' using errcode = '22023';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('key', g.key, 'level_id', g.level_id, 'skill', g.skill, 'ok', g.ok)), '[]'::jsonb)
    into v_graded
  from (
    select substr(q.id, length(p_assessment_id) + 2) as key, q.level_id, q.skill,
           public.grade_answer(q.type, q.payload, q.payload ->> 'correctOptionId', p_answers -> substr(q.id, length(p_assessment_id) + 2)) as ok
    from public.assessment_questions q
    where q.assessment_id = p_assessment_id
  ) g;

  select count(*), count(*) filter (where (e ->> 'ok')::boolean), coalesce(jsonb_object_agg(e ->> 'key', (e ->> 'ok')::boolean), '{}'::jsonb)
    into v_total, v_correct, v_results
  from jsonb_array_elements(v_graded) e;

  select coalesce(jsonb_object_agg(level_id, jsonb_build_object('correct', c, 'total', t)), '{}'::jsonb) into v_level_scores
  from (
    select e ->> 'level_id' as level_id, count(*) filter (where (e ->> 'ok')::boolean) c, count(*) t
    from jsonb_array_elements(v_graded) e group by 1
  ) s;

  select coalesce(jsonb_object_agg(skill, round(c * 100.0 / t)), '{}'::jsonb) into v_skill_scores
  from (
    select e ->> 'skill' as skill, count(*) filter (where (e ->> 'ok')::boolean) c, count(*) t
    from jsonb_array_elements(v_graded) e group by 1
  ) s;

  for v_level in select id from public.cefr_levels order by sort_order loop
    if v_passed then
      if coalesce((v_level_scores -> v_level.id ->> 'total')::int, 0) > 0
         and (v_level_scores -> v_level.id ->> 'correct')::numeric / (v_level_scores -> v_level.id ->> 'total')::numeric >= 0.75 then
        v_mastered := v_level.id;
      else
        v_passed := false;
        v_estimated := v_level.id;
      end if;
    end if;
  end loop;
  v_estimated := coalesce(v_estimated, 'C2');
  v_score := case when v_total = 0 then 0 else round(v_correct * 100.0 / v_total) end;

  insert into public.assessment_results (user_id, assessment_id, estimated_level, mastered_level, score, skill_scores, level_scores, client_op_id)
  values (v_uid, p_assessment_id, v_estimated, v_mastered, v_score, v_skill_scores, v_level_scores, p_op_id);

  -- Taking the test counts as study activity (streak, minutes) but earns no XP.
  insert into public.study_sessions (user_id, kind, ref_id, duration_seconds, xp, score, client_op_id)
  values (v_uid, 'assessment', p_assessment_id, least(greatest(coalesce(p_duration_seconds, 0), 0), 86400), 0, v_score, p_op_id);
  perform public._touch_streak(v_uid, public._local_date(p_tz));

  return jsonb_build_object(
    'duplicate', false, 'estimatedLevel', v_estimated, 'masteredLevel', v_mastered, 'score', v_score,
    'correct', v_correct, 'total', v_total, 'results', v_results, 'skillScores', v_skill_scores, 'levelScores', v_level_scores
  );
end;
$$;

create or replace function public.get_progress_summary(p_tz text default 'UTC')
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  return public._progress_summary(public._require_user(), p_tz);
end;
$$;

-- -----------------------------------------------------------------------------
-- Privileges: only signed-in users may call the RPCs; helpers are internal.
-- -----------------------------------------------------------------------------
revoke execute on function public.normalize_answer(text) from public, anon, authenticated;
revoke execute on function public.matches_any(text, jsonb) from public, anon, authenticated;
revoke execute on function public.grade_answer(text, jsonb, text, jsonb) from public, anon, authenticated;
revoke execute on function public._local_date(text) from public, anon, authenticated;
revoke execute on function public._safe_tz(text) from public, anon, authenticated;
revoke execute on function public._touch_streak(uuid, date) from public, anon, authenticated;
revoke execute on function public._unlock_achievements(uuid) from public, anon, authenticated;
revoke execute on function public._progress_summary(uuid, text) from public, anon, authenticated;
revoke execute on function public._require_user() from public, anon, authenticated;

revoke execute on function public.complete_lesson(text, uuid, text) from public, anon;
revoke execute on function public.submit_exercise(text, jsonb, integer, uuid, text) from public, anon;
revoke execute on function public.record_reviews(integer, integer, integer, uuid, text) from public, anon;
revoke execute on function public.submit_assessment(text, jsonb, integer, uuid, text) from public, anon;
revoke execute on function public.get_progress_summary(text) from public, anon;

grant execute on function public.complete_lesson(text, uuid, text) to authenticated;
grant execute on function public.submit_exercise(text, jsonb, integer, uuid, text) to authenticated;
grant execute on function public.record_reviews(integer, integer, integer, uuid, text) to authenticated;
grant execute on function public.submit_assessment(text, jsonb, integer, uuid, text) to authenticated;
grant execute on function public.get_progress_summary(text) to authenticated;
