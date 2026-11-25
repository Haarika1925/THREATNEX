create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.scan_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scan_type text not null check (scan_type in ('email', 'sms', 'url', 'voice', 'call')),
  input_excerpt text not null default '',
  score smallint not null check (score between 0 and 100),
  level text not null check (level in ('LOW', 'MEDIUM', 'HIGH')),
  indicators jsonb not null default '[]'::jsonb,
  explanation text not null,
  recommendation text not null,
  method text not null,
  transcript text,
  created_at timestamptz not null default now()
);

create index if not exists scan_history_user_created_idx on public.scan_history (user_id, created_at desc);
create index if not exists scan_history_user_type_idx on public.scan_history (user_id, scan_type);
create index if not exists scan_history_user_level_idx on public.scan_history (user_id, level);

create table if not exists public.email_reports (
  id uuid primary key references public.scan_history (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.sms_reports (
  id uuid primary key references public.scan_history (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.url_reports (
  id uuid primary key references public.scan_history (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.voice_reports (
  id uuid primary key references public.scan_history (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.call_reports (
  id uuid primary key references public.scan_history (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.scan_history enable row level security;
alter table public.email_reports enable row level security;
alter table public.sms_reports enable row level security;
alter table public.url_reports enable row level security;
alter table public.voice_reports enable row level security;
alter table public.call_reports enable row level security;

create policy "Users manage their own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users manage their own scan history" on public.scan_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own email reports" on public.email_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own sms reports" on public.sms_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own url reports" on public.url_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own voice reports" on public.voice_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own call reports" on public.call_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
