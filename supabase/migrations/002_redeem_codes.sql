-- ============================================================
-- Hexora — Redeem Codes
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. REDEEM CODES TABLE
-- ─────────────────────────────────────────────
create table if not exists public.redeem_codes (
  code        text primary key,
  orbs_reward integer not null default 10,
  max_uses    integer not null default 1,   -- set to -1 for unlimited
  times_used  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2. REDEMPTION LOG
--    Prevents a user from redeeming the same code twice.
-- ─────────────────────────────────────────────
create table if not exists public.code_redemptions (
  id          uuid primary key default gen_random_uuid(),
  code        text not null references public.redeem_codes (code) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  unique (code, user_id)     -- one redemption per user per code
);

-- ─────────────────────────────────────────────
-- 3. RLS
-- ─────────────────────────────────────────────
alter table public.redeem_codes     enable row level security;
alter table public.code_redemptions enable row level security;

-- Nobody can read codes directly from the client
-- (the RPC runs as security definer, bypassing RLS)
drop policy if exists "codes: no direct read" on public.redeem_codes;
create policy "codes: no direct read"
  on public.redeem_codes for select
  using (false);

-- Users can only see their own redemptions
drop policy if exists "redemptions: owner read" on public.code_redemptions;
create policy "redemptions: owner read"
  on public.code_redemptions for select
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 4. RPC — redeem_code
--    Returns: { orbs_reward, new_orbs } on success
--    Raises exceptions on failure (caught by the client)
-- ─────────────────────────────────────────────
create or replace function public.redeem_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id    uuid := auth.uid();
  v_reward     integer;
  v_max_uses   integer;
  v_times_used integer;
  v_new_orbs   integer;
begin
  -- 1. Look up code
  select orbs_reward, max_uses, times_used
  into   v_reward, v_max_uses, v_times_used
  from   public.redeem_codes
  where  code = upper(trim(p_code));

  if not found then
    raise exception 'INVALID_CODE';
  end if;

  -- 2. Check uses remaining (-1 = unlimited)
  if v_max_uses <> -1 and v_times_used >= v_max_uses then
    raise exception 'CODE_EXHAUSTED';
  end if;

  -- 3. Check this user hasn't already used it
  if exists (
    select 1 from public.code_redemptions
    where  code = upper(trim(p_code)) and user_id = v_user_id
  ) then
    raise exception 'ALREADY_REDEEMED';
  end if;

  -- 4. Log redemption
  insert into public.code_redemptions (code, user_id)
  values (upper(trim(p_code)), v_user_id);

  -- 5. Increment usage counter
  update public.redeem_codes
  set    times_used = times_used + 1
  where  code = upper(trim(p_code));

  -- 6. Add orbs to profile
  update public.profiles
  set    orbs = orbs + v_reward
  where  id = v_user_id
  returning orbs into v_new_orbs;

  return json_build_object('orbs_reward', v_reward, 'new_orbs', v_new_orbs);
end;
$$;

-- ─────────────────────────────────────────────
-- 5. SEED — sample codes to test with
--    (delete or replace these before going live)
-- ─────────────────────────────────────────────
insert into public.redeem_codes (code, orbs_reward, max_uses) values
  ('HEXORA2026',  10, -1),   -- unlimited uses, 10 orbs
  ('LAUNCH10',    10,  1),   -- single-use, 10 orbs
  ('CYBERSEC',    10,  50)   -- 50-use event code, 10 orbs
on conflict (code) do nothing;
