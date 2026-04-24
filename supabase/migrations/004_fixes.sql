-- ============================================================
-- Hexora — Fixes
-- 1. Grant leaderboard view access so real player pts show up.
-- 2. Add spend_orbs RPC so game-entry deduction persists even
--    if the client's RLS update is blocked.
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. LEADERBOARD VIEW — grant read access
--    Views do not inherit table-level grants.
--    Without this, supabase-js returns an error
--    and the frontend falls back to sample data.
-- ─────────────────────────────────────────────
grant select on public.leaderboard to anon, authenticated;

-- ─────────────────────────────────────────────
-- 2. spend_orbs RPC
--    Atomically deducts p_amount orbs from the
--    calling user's profile.
--    Returns the new orbs balance.
--    Raises 'INSUFFICIENT_ORBS' if balance is too low.
-- ─────────────────────────────────────────────
create or replace function public.spend_orbs(p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id  uuid    := auth.uid();
  v_new_orbs integer;
begin
  update public.profiles
  set    orbs = orbs - p_amount
  where  id   = v_user_id
    and  orbs >= p_amount
  returning orbs into v_new_orbs;

  if v_new_orbs is null then
    raise exception 'INSUFFICIENT_ORBS';
  end if;

  return v_new_orbs;
end;
$$;
