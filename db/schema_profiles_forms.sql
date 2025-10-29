-- Raven configurable profiles & forms schema
-- Fixed version — compatible with Supabase/Postgres
-- No IF NOT EXISTS in policy creation

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- =========================
-- Core profiles table
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

-- Helpful GIN index for querying attributes
create index if not exists idx_profiles_attributes_gin on public.profiles using gin (attributes);

-- Enable RLS
alter table public.profiles enable row level security;

-- A user can see their own profile
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
using (auth.uid() = id);

-- A user can insert their own profile
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
with check (auth.uid() = id);

-- A user can update their own profile
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- =========================
-- Form fields configuration
-- =========================
create table if not exists public.form_fields (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  scope text not null check (scope in ('registration','profile','both')),
  label text not null,
  type text not null, -- text, textarea, email, number, select, checkbox, date
  required boolean not null default false,
  unique_field boolean not null default false,
  validation_regex text null,
  min_length int null,
  max_length int null,
  options jsonb null, -- e.g. ['a','b'] or { min:1, max:10 }
  default_value text null,
  order_index int not null default 0,
  system boolean not null default false,
  write_to text not null check (write_to in ('core','attributes')),
  visible boolean not null default true,
  help_text text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at trigger
drop trigger if exists trg_form_fields_updated_at on public.form_fields;
create trigger trg_form_fields_updated_at
before update on public.form_fields
for each row execute procedure public.set_updated_at();

-- Useful indexes
create index if not exists idx_form_fields_scope_visible
  on public.form_fields (scope, visible, order_index);
create index if not exists idx_form_fields_key on public.form_fields (key);

-- Enable RLS
alter table public.form_fields enable row level security;

-- Visible fields are selectable by any authenticated user
drop policy if exists form_fields_select_visible on public.form_fields;
create policy form_fields_select_visible
on public.form_fields
for select
using (visible = true);
