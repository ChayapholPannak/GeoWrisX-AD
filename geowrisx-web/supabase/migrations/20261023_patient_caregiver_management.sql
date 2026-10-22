-- GeoWrisX AD: patient management + caregiver profile migration
-- Run once in Supabase SQL Editor AFTER the initial setup.sql.
-- Safe to re-run: uses IF NOT EXISTS and drops policies before recreating.

alter table public.patients
  add column if not exists relationship text,
  add column if not exists date_of_birth date,
  add column if not exists is_archived boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

alter table public.patients
  drop constraint if exists patients_relationship_length_check;
alter table public.patients
  add constraint patients_relationship_length_check
  check (relationship is null or char_length(trim(relationship)) <= 80);

create index if not exists patients_owner_archived_created_idx
  on public.patients(owner_id, is_archived, created_at desc);

create table if not exists public.caregiver_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  phone text,
  relationship_to_patient text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint caregiver_profiles_phone_length_check
    check (phone is null or char_length(trim(phone)) <= 30),
  constraint caregiver_profiles_relationship_length_check
    check (relationship_to_patient is null or char_length(trim(relationship_to_patient)) <= 80)
);

alter table public.caregiver_profiles enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.caregiver_profiles to authenticated;

drop policy if exists "caregiver reads own profile" on public.caregiver_profiles;
create policy "caregiver reads own profile"
  on public.caregiver_profiles for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "caregiver creates own profile" on public.caregiver_profiles;
create policy "caregiver creates own profile"
  on public.caregiver_profiles for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "caregiver updates own profile" on public.caregiver_profiles;
create policy "caregiver updates own profile"
  on public.caregiver_profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Keep row-level restrictions in place. Grants allow the app to request updates;
-- RLS determines which patient's row the signed-in caregiver may change.
grant select, insert, update, delete on public.patients to authenticated;
