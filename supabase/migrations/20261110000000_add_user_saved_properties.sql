-- ============================================================
-- Migration: Add user saved properties & Google OAuth profile support
-- ============================================================

-- 1. Ensure role check constraint includes 'user'
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles drop constraint if exists profiles_role_check1;
alter table public.profiles add constraint profiles_role_check check (role in ('user', 'tenant', 'owner', 'admin'));

-- 2. Add saved_properties text array column to profiles table
alter table public.profiles add column if not exists saved_properties text[] default '{}';

-- 3. Add insert policy so authenticated users (Google OAuth) can create/upsert their profile
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());

-- 4. Ensure users can update their own profile including saved_properties
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- 5. Add index for faster profile lookups
create index if not exists profiles_role_idx on public.profiles (role);
