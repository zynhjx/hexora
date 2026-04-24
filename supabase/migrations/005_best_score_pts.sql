-- ============================================================
-- Hexora — Best-score leaderboard pts
--
-- Old behaviour: pts accumulates every run (pts += score).
-- New behaviour: pts = best hexo-quiz score + best hexo-words score.
--   Only improves when a new personal best is set for either game.
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. Replace submit_game_result
-- ─────────────────────────────────────────────
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
  -- 1. Record the session first so the MAX queries below include this run.
  insert into public.game_sessions (
    user_id, game_id, score,
    correct_answers, total_questions, duration_seconds
  ) values (
    v_user_id, p_game_id, p_score,
    p_correct_answers, p_total_questions, p_duration_seconds
  );

  -- 2. Recalculate pts = best hexo-quiz + best hexo-words.
  --    coalesce(..., 0) handles games never played.
  update public.profiles
  set pts = (
    select coalesce(max(score), 0)
    from   public.game_sessions
    where  user_id = v_user_id
      and  game_id = 'hexo-quiz'
  ) + (
    select coalesce(max(score), 0)
    from   public.game_sessions
    where  user_id = v_user_id
      and  game_id = 'hexo-words'
  )
  where id = v_user_id;
end;
$$;

-- ─────────────────────────────────────────────
-- 2. Back-fill existing pts so historical data
--    is consistent with the new formula.
-- ─────────────────────────────────────────────
update public.profiles p
set pts = (
  select coalesce(max(score), 0)
  from   public.game_sessions
  where  user_id = p.id
    and  game_id = 'hexo-quiz'
) + (
  select coalesce(max(score), 0)
  from   public.game_sessions
  where  user_id = p.id
    and  game_id = 'hexo-words'
);
