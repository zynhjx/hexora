-- ============================================================
-- Hexora — Event Codes (Migration 006)
-- Replaces ticket_codes with event-aware redeem_codes.
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─────────────────────────────────────────────
-- 0a. PATCH profiles default orbs → 0
-- ─────────────────────────────────────────────
alter table public.profiles alter column orbs set default 0;

-- ─────────────────────────────────────────────
-- 0. CLEANUP OLD DESIGN
-- ─────────────────────────────────────────────
drop table    if exists public.ticket_codes              cascade;
drop function if exists public.redeem_code(text);
drop function if exists public.make_ticket_code(integer);
drop function if exists public.generate_ticket_codes(integer, integer);

-- ─────────────────────────────────────────────
-- 1. EVENT CODES TABLE
--    One row per physical code. Marked on redemption,
--    never deleted (keeps audit trail).
-- ─────────────────────────────────────────────
drop table if exists public.event_codes cascade;
create table public.event_codes (
  code         text        primary key,
  orbs_reward  integer     not null check (orbs_reward > 0),
  day          integer     not null check (day in (1, 2)),
  redeemed_by  uuid        references auth.users(id) on delete set null,
  redeemed_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- Clients can never read or list codes directly
alter table public.event_codes enable row level security;

drop policy if exists "event_codes: no client access" on public.event_codes;
create policy "event_codes: no client access"
  on public.event_codes
  using (false);

-- ─────────────────────────────────────────────
-- 2. EVENT CONFIG TABLE
--    Maps day number → calendar date.
--    Edit these rows to change the event schedule.
-- ─────────────────────────────────────────────
create table if not exists public.event_config (
  day         integer primary key check (day in (1, 2)),
  event_date  date    not null
);

alter table public.event_config enable row level security;

drop policy if exists "event_config: authenticated read" on public.event_config;
create policy "event_config: authenticated read"
  on public.event_config for select
  using (auth.role() = 'authenticated');

insert into public.event_config (day, event_date) values
  (1, '2026-05-20'),
  (2, '2026-05-21')
on conflict (day) do update set event_date = excluded.event_date;

-- ─────────────────────────────────────────────
-- 3. REDEEM RPC
--    Guards:
--      • Time window  — 8:00 AM to 5:00 PM (Asia/Manila)
--      • Event day    — today must be a configured event date
--      • Day match    — code must belong to today's day
--      • Single-use   — code cannot have been redeemed before
-- ─────────────────────────────────────────────
create or replace function public.redeem_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id   uuid    := auth.uid();
  v_clean     text    := upper(trim(p_code));
  v_code_row  public.event_codes%rowtype;
  v_event_day integer;
  v_new_orbs  integer;
begin
  -- ── Time window check (8 AM – 5 PM Asia/Manila) ──────────────
  -- DISABLED: re-enable before going live
  -- v_hour := extract(hour from now() at time zone 'Asia/Manila')::integer;
  -- if v_hour < 8 or v_hour >= 17 then
  --   raise exception 'OUTSIDE_HOURS';
  -- end if;

  -- ── Resolve today's event day ─────────────────────────────────
  select day into v_event_day
  from   public.event_config
  where  event_date = (now() at time zone 'Asia/Manila')::date;

  if not found then
    raise exception 'OUTSIDE_EVENT';
  end if;

  -- ── Look up the code ──────────────────────────────────────────
  select * into v_code_row
  from   public.event_codes
  where  code = v_clean;

  if not found then
    raise exception 'INVALID_CODE';
  end if;

  -- ── Already redeemed by anyone ────────────────────────────────
  if v_code_row.redeemed_by is not null then
    raise exception 'ALREADY_REDEEMED';
  end if;

  -- ── Wrong event day ───────────────────────────────────────────
  if v_code_row.day != v_event_day then
    raise exception 'WRONG_DAY';
  end if;

  -- ── Atomic claim (race-condition guard) ───────────────────────
  update public.event_codes
  set    redeemed_by = v_user_id,
         redeemed_at = now()
  where  code        = v_clean
    and  redeemed_by is null;

  if not found then
    raise exception 'ALREADY_REDEEMED';
  end if;

  -- ── Credit orbs ───────────────────────────────────────────────
  update public.profiles
  set    orbs = orbs + v_code_row.orbs_reward
  where  id   = v_user_id
  returning orbs into v_new_orbs;

  return json_build_object(
    'orbs_reward', v_code_row.orbs_reward,
    'new_orbs',    v_new_orbs
  );
end;
$$;

-- ─────────────────────────────────────────────
-- 4. SEED CODES (20 codes — 9-char alphanumeric, all caps)
--    Day 1 = May 20 | Day 2 = May 21
--    Replace with your own list when ready.
-- ─────────────────────────────────────────────
insert into public.event_codes (code, orbs_reward, day) values
  -- ── Day 1 · 50 orbs ──────────────────────────────────────────
  ('K7MNPX2QR', 50, 1),
  ('F6RYXC3DH', 50, 1),
  ('T9WZDB5LQ', 50, 1),
  ('Q8FBZV4KT', 50, 1),
  ('M7QXRT6BZ', 50, 1),
  -- ── Day 1 · 20 orbs ──────────────────────────────────────────
  ('BW4JTLZ9A', 20, 1),
  ('V2GPNK8EM', 20, 1),
  ('H3XCMR7YN', 20, 1),
  ('N5LDWY2PJ', 20, 1),
  ('J4HNPK9WC', 20, 1),
  -- ── Day 2 · 50 orbs ──────────────────────────────────────────
  ('R6ZTMB3FW', 50, 2),
  ('X2PNDH7KM', 50, 2),
  ('Y3KZGC6DV', 50, 2),
  ('L4FQYJ8NX', 50, 2),
  ('Z6NRDW5TV', 50, 2),
  -- ── Day 2 · 20 orbs ──────────────────────────────────────────
  ('C8VJXL5QN', 20, 2),
  ('W5BRTF9YZ', 20, 2),
  ('D9WXMB4RL', 20, 2),
  ('P7CMKZ2HB', 20, 2),
  ('G8YPXJ3QF', 20, 2)
on conflict (code) do nothing;
