create extension if not exists pgcrypto;
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_pages_updated on public.pages(updated_at desc);
create index if not exists idx_pages_slug on public.pages(slug);
create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_pages_updated on public.pages;
create trigger trg_pages_updated before update on public.pages for each row execute function public.set_updated_at();
