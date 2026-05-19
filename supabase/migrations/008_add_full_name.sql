-- ============================================================
-- Hexora — Add full_name to profiles
--
-- Stores the participant's real name for prize distribution.
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Add column (nullable so existing rows aren't affected)
alter table public.profiles
  add column if not exists full_name text;

-- Update the signup trigger to also capture full_name from metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;
