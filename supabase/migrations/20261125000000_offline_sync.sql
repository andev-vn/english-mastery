-- =============================================================================
-- Offline sync (Phase 6): conflict-safe vocabulary writes.
--
-- Devices queue vocabulary changes while offline and send them later, possibly after another
-- device has changed the same words. A blind upsert/delete would let the late, older change win.
-- sync_vocabulary applies each change only if it is newer than the server copy:
--   * upsert: only when the server row is missing or older (by updated_at = time of the edit on the device)
--   * delete: only when the server row is not newer than the deletion
-- Device timestamps are clamped to the server's now() so a fast device clock cannot win forever.
-- It returns the server rows that are newer than what the device sent, so the device can adopt them.
-- =============================================================================

-- updated_at must keep the device's edit time; the trigger replaced it with the time of the write.
drop trigger if exists user_vocabulary_set_updated_at on public.user_vocabulary;

create or replace function public.sync_vocabulary(p_cards jsonb default '[]'::jsonb, p_deleted jsonb default '[]'::jsonb)
returns jsonb
language plpgsql
security invoker -- runs as the caller: RLS limits every statement to the caller's own rows
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if jsonb_typeof(p_cards) is distinct from 'array' or jsonb_typeof(p_deleted) is distinct from 'array' then
    raise exception 'p_cards and p_deleted must be arrays' using errcode = '22023';
  end if;
  if jsonb_array_length(p_cards) + jsonb_array_length(p_deleted) > 1000 then
    raise exception 'Too many changes in one call' using errcode = '22023';
  end if;

  with incoming as (
    select distinct on (c ->> 'vocabulary_id')
      c ->> 'vocabulary_id' as vocabulary_id,
      coalesce((c ->> 'repetitions')::integer, 0) as repetitions,
      coalesce((c ->> 'ease_factor')::numeric, 2.5) as ease_factor,
      coalesce((c ->> 'interval_days')::integer, 0) as interval_days,
      coalesce((c ->> 'lapses')::integer, 0) as lapses,
      coalesce((c ->> 'is_favorite')::boolean, false) as is_favorite,
      (c ->> 'last_reviewed_at')::timestamptz as last_reviewed_at,
      coalesce((c ->> 'next_review_at')::timestamptz, v_now) as next_review_at,
      least(coalesce((c ->> 'updated_at')::timestamptz, v_now), v_now) as updated_at
    from jsonb_array_elements(p_cards) as c
    where c ->> 'vocabulary_id' is not null
    order by c ->> 'vocabulary_id', (c ->> 'updated_at')::timestamptz desc nulls last
  )
  insert into public.user_vocabulary as uv
    (user_id, vocabulary_id, repetitions, ease_factor, interval_days, lapses, is_favorite, last_reviewed_at, next_review_at, updated_at)
  select v_uid, i.vocabulary_id, i.repetitions, i.ease_factor, i.interval_days, i.lapses, i.is_favorite, i.last_reviewed_at, i.next_review_at, i.updated_at
  from incoming as i
  -- Words no longer published are skipped instead of failing the whole batch.
  where exists (select 1 from public.vocabulary as v where v.id = i.vocabulary_id)
  on conflict (user_id, vocabulary_id) do update
    set repetitions      = excluded.repetitions,
        ease_factor      = excluded.ease_factor,
        interval_days    = excluded.interval_days,
        lapses           = excluded.lapses,
        is_favorite      = excluded.is_favorite,
        last_reviewed_at = excluded.last_reviewed_at,
        next_review_at   = excluded.next_review_at,
        updated_at       = excluded.updated_at
    where uv.updated_at < excluded.updated_at;

  delete from public.user_vocabulary as uv
  using jsonb_array_elements(p_deleted) as d
  where uv.user_id = v_uid
    and uv.vocabulary_id = d ->> 'vocabulary_id'
    and uv.updated_at <= least(coalesce((d ->> 'deleted_at')::timestamptz, v_now), v_now);

  return jsonb_build_object('newer', coalesce((
    select jsonb_agg(to_jsonb(uv) order by uv.vocabulary_id)
    from public.user_vocabulary as uv
    where uv.user_id = v_uid
      and (
        exists (
          select 1 from jsonb_array_elements(p_cards) as c
          where c ->> 'vocabulary_id' = uv.vocabulary_id
            and uv.updated_at > least(coalesce((c ->> 'updated_at')::timestamptz, v_now), v_now)
        )
        -- A deletion that was refused: the word was changed elsewhere after it was removed here.
        or exists (select 1 from jsonb_array_elements(p_deleted) as d where d ->> 'vocabulary_id' = uv.vocabulary_id)
      )
  ), '[]'::jsonb));
end;
$$;

revoke execute on function public.sync_vocabulary(jsonb, jsonb) from public, anon;
grant execute on function public.sync_vocabulary(jsonb, jsonb) to authenticated;
