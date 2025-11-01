-- Raven Custom Forms migration
BEGIN;

-- 1) Custom forms registry
create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) Allow field placements to target either a built-in scope OR a custom form
alter table public.form_field_placements
  add column if not exists form_id uuid references public.forms(id) on delete cascade;

-- One target only: scope XOR form_id
alter table public.form_field_placements
  drop constraint if exists ffp_one_target_chk;

alter table public.form_field_placements
  add constraint ffp_one_target_chk
  check (
    (scope is not null and form_id is null)
    or (scope is null and form_id is not null)
  );

-- Uniqueness guards
create unique index if not exists ffp_unique_field_scope
  on public.form_field_placements(field_id, scope)
  where scope is not null;

create unique index if not exists ffp_unique_field_form
  on public.form_field_placements(field_id, form_id)
  where form_id is not null;

-- Ordering helper
create index if not exists idx_ffp_form_order
  on public.form_field_placements(form_id, order_index);

COMMIT;
