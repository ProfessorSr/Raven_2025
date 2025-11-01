-- 1) Extend placements scope to include 'login'
do $$
begin
  if exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'form_field_placements' and c.conname = 'form_field_placements_scope_check'
  ) then
    alter table public.form_field_placements drop constraint form_field_placements_scope_check;
  end if;
exception when undefined_table then
  null;
end $$;

alter table public.form_field_placements
  add constraint form_field_placements_scope_check
  check (scope in ('registration','profile','login'));

-- 2) Public pages + blocks for drag/drop page builder
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  layout text not null default 'default',
  meta jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.page_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  zone text not null default 'main',
  type text not null,
  config jsonb not null default '{}',
  order_index integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_page_blocks_page_zone
  on public.page_blocks(page_id, zone, order_index);

alter table public.pages enable row level security;
alter table public.page_blocks enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='pages' and policyname='pages_read_all') then
    create policy pages_read_all on public.pages for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='page_blocks' and policyname='page_blocks_read_all') then
    create policy page_blocks_read_all on public.page_blocks for select using (true);
  end if;
end $$;
