-- GeoWrisX AD starter schema for Supabase PostgreSQL.
-- Run this file in Supabase Dashboard -> SQL Editor using the project's database owner.
-- The app uses Supabase Auth (JWT); passwords are managed and hashed by Supabase Auth.

create extension if not exists pgcrypto;

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  device_type text not null check (device_type in ('wristband', 'pillbox', 'gateway')),
  device_name text not null,
  status text not null default 'unknown' check (status in ('online', 'offline', 'unknown')),
  battery_percent integer check (battery_percent between 0 and 100),
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  alert_type text not null check (alert_type in ('GEOFENCE_EXIT', 'TAMPER', 'LOW_BATTERY', 'BLE_DISCONNECTED', 'OTHER')),
  severity text not null default 'warning' check (severity in ('info', 'warning', 'critical')),
  message text not null check (char_length(message) between 1 and 300),
  occurred_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid references auth.users(id) on delete set null
);

create table if not exists public.pillbox_approvals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  compartment_no integer not null check (compartment_no between 1 and 3),
  status text not null default 'pending' check (status in ('pending', 'approved', 'expired', 'rejected')),
  -- This field must be written only by the trusted device ingestion service after local BLE verification.
  ble_verified boolean not null default false,
  requested_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '60 seconds'),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null
);

create table if not exists public.device_commands (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  approval_id uuid unique references public.pillbox_approvals(id) on delete cascade,
  command_type text not null check (command_type in ('UNLOCK_COMPARTMENT')),
  compartment_no integer not null check (compartment_no between 1 and 3),
  status text not null default 'queued' check (status in ('queued', 'sent', 'executed', 'failed', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists patients_owner_id_idx on public.patients(owner_id);
create index if not exists devices_patient_id_idx on public.devices(patient_id);
create index if not exists alerts_patient_time_idx on public.alerts(patient_id, occurred_at desc);
create index if not exists approvals_patient_time_idx on public.pillbox_approvals(patient_id, requested_at desc);
create index if not exists commands_patient_time_idx on public.device_commands(patient_id, created_at desc);

alter table public.patients enable row level security;
alter table public.devices enable row level security;
alter table public.alerts enable row level security;
alter table public.pillbox_approvals enable row level security;
alter table public.device_commands enable row level security;

-- Explicit schema/table grants; RLS remains the row-level gate for authenticated users.
grant usage on schema public to authenticated, service_role;
grant all on public.patients, public.devices, public.alerts, public.pillbox_approvals, public.device_commands to service_role;

-- Patients: a caregiver can only manage their own patient entries.
drop policy if exists "caregiver reads own patients" on public.patients;
create policy "caregiver reads own patients" on public.patients for select to authenticated using (owner_id = auth.uid());
drop policy if exists "caregiver creates own patients" on public.patients;
create policy "caregiver creates own patients" on public.patients for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "caregiver updates own patients" on public.patients;
create policy "caregiver updates own patients" on public.patients for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "caregiver deletes own patients" on public.patients;
create policy "caregiver deletes own patients" on public.patients for delete to authenticated using (owner_id = auth.uid());

-- Caregivers can view device/alert/approval/command records only for their own patient profiles.
drop policy if exists "caregiver reads own devices" on public.devices;
create policy "caregiver reads own devices" on public.devices for select to authenticated
using (exists (select 1 from public.patients p where p.id = patient_id and p.owner_id = auth.uid()));
drop policy if exists "caregiver reads own alerts" on public.alerts;
create policy "caregiver reads own alerts" on public.alerts for select to authenticated
using (exists (select 1 from public.patients p where p.id = patient_id and p.owner_id = auth.uid()));
drop policy if exists "caregiver reads own pillbox approvals" on public.pillbox_approvals;
create policy "caregiver reads own pillbox approvals" on public.pillbox_approvals for select to authenticated
using (exists (select 1 from public.patients p where p.id = patient_id and p.owner_id = auth.uid()));
drop policy if exists "caregiver reads own device commands" on public.device_commands;
create policy "caregiver reads own device commands" on public.device_commands for select to authenticated
using (exists (select 1 from public.patients p where p.id = patient_id and p.owner_id = auth.uid()));

-- Explicit privileges: authenticated users may read device-originated records,
-- but cannot write device status, alerts, BLE proofs, or commands directly from the browser.
grant select, insert, update, delete on public.patients to authenticated;
grant select on public.devices, public.alerts, public.pillbox_approvals, public.device_commands to authenticated;
revoke insert, update, delete on public.devices, public.alerts, public.pillbox_approvals, public.device_commands from anon, authenticated;

-- Atomic approval routine: validates owner + pending state + non-expired request + BLE proof,
-- then queues a short-lived command. It does NOT directly actuate a physical lock.
create or replace function public.approve_pillbox_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request public.pillbox_approvals%rowtype;
  v_command_id uuid;
begin
  select a.* into v_request
  from public.pillbox_approvals a
  join public.patients p on p.id = a.patient_id
  where a.id = p_request_id and p.owner_id = auth.uid()
  for update of a;

  if not found then
    raise exception using message = 'REQUEST_NOT_FOUND', errcode = 'P0002';
  end if;
  if v_request.status <> 'pending' then
    raise exception using message = 'REQUEST_NOT_PENDING', errcode = 'P0001';
  end if;
  if v_request.ble_verified is not true then
    raise exception using message = 'BLE_NOT_VERIFIED', errcode = 'P0001';
  end if;
  if v_request.expires_at <= now() then
    raise exception using message = 'REQUEST_EXPIRED', errcode = 'P0001';
  end if;

  update public.pillbox_approvals
  set status = 'approved', approved_at = now(), approved_by = auth.uid()
  where id = v_request.id;

  insert into public.device_commands (patient_id, approval_id, command_type, compartment_no, status, expires_at)
  values (v_request.patient_id, v_request.id, 'UNLOCK_COMPARTMENT', v_request.compartment_no, 'queued', least(v_request.expires_at, now() + interval '30 seconds'))
  returning id into v_command_id;

  return jsonb_build_object('ok', true, 'status', 'queued', 'command_id', v_command_id);
end;
$$;

revoke all on function public.approve_pillbox_request(uuid) from public, anon;
grant execute on function public.approve_pillbox_request(uuid) to authenticated;

-- IMPORTANT: Hardware ingestion uses the server-side service role key through a Cloudflare Pages Function.
-- Never place SUPABASE_SERVICE_ROLE_KEY in VITE_ variables or in browser code.
