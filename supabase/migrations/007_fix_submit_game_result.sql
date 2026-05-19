-- ============================================================
-- Hexora — Ensure submit_game_result uses best-score logic
--
-- Replaces any earlier version (including the accumulating one
-- from 001_initial_schema.sql).
--
-- pts = best hexo-words score + best hexo-quiz score.
-- Only increases when the player beats their own record.
-- ============================================================

create or replace function public.submit_game_result(
  p_game_id          text,
  p_score            integer,
  p_correct_answers  integer,
  p_total_questions  integer,
  p_duration_seconds integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  -- 1. Record this session
  insert into public.game_sessions (
    user_id, game_id, score,
    correct_answers, total_questions, duration_seconds
  ) values (
    v_user_id, p_game_id, p_score,
    p_correct_answers, p_total_questions, p_duration_seconds
  );

  -- 2. pts = best hexo-words score + best hexo-quiz score
  --    coalesce(..., 0) handles games never played
  update public.profiles
  set pts = (
    select coalesce(max(score), 0)
    from   public.game_sessions
    where  user_id = v_user_id
      and  game_id = 'hexo-words'
  ) + (
    select coalesce(max(score), 0)
    from   public.game_sessions
    where  user_id = v_user_id
      and  game_id = 'hexo-quiz'
  )
  where id = v_user_id;
end;
$$;

-- Back-fill existing profiles so current data is consistent
update public.profiles p
set pts = (
  select coalesce(max(score), 0)
  from   public.game_sessions
  where  user_id = p.id
    and  game_id = 'hexo-words'
) + (
  select coalesce(max(score), 0)
  from   public.game_sessions
  where  user_id = p.id
    and  game_id = 'hexo-quiz'
);
