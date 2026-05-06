
-- Gama Hospital Dia - Supabase schema
create extension if not exists pgcrypto;

create table if not exists cms_data (
  id text primary key default 'main',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into cms_data (id, data) values ('main', '{}'::jsonb) on conflict (id) do nothing;

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  name text,
  password_hash text not null,
  salt text not null,
  manager boolean not null default false,
  protected boolean not null default false,
  full_access boolean not null default false,
  permissions jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  username text,
  action text,
  area text,
  before_data jsonb,
  after_data jsonb
);

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null,
  page text,
  path text,
  referrer text,
  device text,
  user_agent text,
  ip text,
  details jsonb not null default '{}'::jsonb
);

alter table cms_data enable row level security;
alter table admin_users enable row level security;
alter table admin_logs enable row level security;
alter table analytics_events enable row level security;

do $$ begin
  create policy "Public read cms data" on cms_data for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public insert analytics" on analytics_events for insert with check (true);
exception when duplicate_object then null; end $$;
