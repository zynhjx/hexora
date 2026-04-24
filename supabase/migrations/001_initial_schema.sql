-- ============================================================
-- Hexora — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. PROFILES
--    One row per authenticated user (auth.users).
--    Auto-created by trigger on signup.
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null,
  orbs        integer not null default 200,   -- in-game currency
  pts         integer not null default 0,     -- leaderboard points
  created_at  timestamptz not null default now()
);

-- Index for fast leaderboard queries
create index if not exists profiles_pts_idx on public.profiles (pts desc);

-- ─────────────────────────────────────────────
-- 2. GAME SESSIONS
--    One row per completed game round.
-- ─────────────────────────────────────────────
create table if not exists public.game_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  game_id           text not null,           -- e.g. 'jumbled-letters' | 'hexo-quiz'
  score             integer not null default 0,
  correct_answers   integer not null default 0,
  total_questions   integer not null default 0,
  duration_seconds  integer not null default 0,
  completed_at      timestamptz not null default now()
);

create index if not exists game_sessions_user_idx    on public.game_sessions (user_id);
create index if not exists game_sessions_game_idx    on public.game_sessions (game_id);
create index if not exists game_sessions_date_idx    on public.game_sessions (completed_at desc);

-- ─────────────────────────────────────────────
-- 3. LEADERBOARD VIEW
--    Top 100 players ordered by pts descending.
--    The frontend queries this view directly.
-- ─────────────────────────────────────────────
drop view if exists public.leaderboard;

create view public.leaderboard as
  select
    row_number() over (order by pts desc) as rank,
    id,
    username,
    pts,
    created_at
  from public.profiles
  order by pts desc
  limit 100;

-- ─────────────────────────────────────────────
-- 4. AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    -- Use the username from metadata if supplied during signUp,
    -- otherwise fall back to the email prefix.
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- Drop before recreate to make this migration idempotent
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ─────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────

-- profiles ──────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "profiles: public read"  on public.profiles;
drop policy if exists "profiles: owner update" on public.profiles;

create policy "profiles: public read"
  on public.profiles for select
  using (true);

create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id);

-- game_sessions ─────────────────────────────
alter table public.game_sessions enable row level security;

drop policy if exists "sessions: owner read"   on public.game_sessions;
drop policy if exists "sessions: owner insert" on public.game_sessions;

create policy "sessions: owner read"
  on public.game_sessions for select
  using (auth.uid() = user_id);

create policy "sessions: owner insert"
  on public.game_sessions for insert
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 6. HELPER FUNCTION — submit a game result
--    Call via supabase.rpc('submit_game_result', {...})
--    Atomically inserts the session and updates
--    the player's pts / exp / level.
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
  -- Insert game session
  insert into public.game_sessions (
    user_id, game_id, score,
    correct_answers, total_questions, duration_seconds
  ) values (
    v_user_id, p_game_id, p_score,
    p_correct_answers, p_total_questions, p_duration_seconds
  );

  -- Update profile pts
  update public.profiles
  set pts = pts + p_score
  where id = v_user_id;
end;
$$;
