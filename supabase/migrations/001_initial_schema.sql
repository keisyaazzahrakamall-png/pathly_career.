begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  education_level text check (education_level in ('D3', 'D4', 'S1')),
  major text,
  semester smallint check (semester between 1 and 9),
  graduation_year smallint check (graduation_year between 2026 and 2100),
  experiences text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.career_journeys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  career_stage text check (career_stage in ('explore', 'validate', 'prepare')),
  target_career_id text,
  target_career_name text,
  compared_career_ids text[] not null default '{}',
  custom_career jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  career_id text not null,
  career_name text not null,
  answers jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, career_id)
);

create table if not exists public.career_readiness (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  career_id text not null,
  responses jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, career_id)
);

create table if not exists public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  career_id text not null,
  roadmap_data jsonb not null default '{}'::jsonb,
  source_assessment_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, career_id),
  unique (id, user_id)
);

create table if not exists public.roadmap_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_id uuid not null,
  task_key text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, roadmap_id, task_key),
  foreign key (roadmap_id, user_id)
    references public.roadmaps(id, user_id)
    on delete cascade
);

create index if not exists assessments_user_id_idx
  on public.assessments(user_id);
create index if not exists career_readiness_user_id_idx
  on public.career_readiness(user_id);
create index if not exists roadmaps_user_id_idx
  on public.roadmaps(user_id);
create index if not exists roadmap_tasks_user_id_idx
  on public.roadmap_tasks(user_id);
create index if not exists roadmap_tasks_roadmap_id_idx
  on public.roadmap_tasks(roadmap_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists career_journeys_set_updated_at on public.career_journeys;
create trigger career_journeys_set_updated_at
before update on public.career_journeys
for each row execute function public.set_updated_at();

drop trigger if exists assessments_set_updated_at on public.assessments;
create trigger assessments_set_updated_at
before update on public.assessments
for each row execute function public.set_updated_at();

drop trigger if exists career_readiness_set_updated_at on public.career_readiness;
create trigger career_readiness_set_updated_at
before update on public.career_readiness
for each row execute function public.set_updated_at();

drop trigger if exists roadmaps_set_updated_at on public.roadmaps;
create trigger roadmaps_set_updated_at
before update on public.roadmaps
for each row execute function public.set_updated_at();

drop trigger if exists roadmap_tasks_set_updated_at on public.roadmap_tasks;
create trigger roadmap_tasks_set_updated_at
before update on public.roadmap_tasks
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.career_journeys enable row level security;
alter table public.assessments enable row level security;
alter table public.career_readiness enable row level security;
alter table public.roadmaps enable row level security;
alter table public.roadmap_tasks enable row level security;

drop policy if exists "Users manage their own profile" on public.profiles;
create policy "Users manage their own profile"
on public.profiles for all
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users manage their own career journey" on public.career_journeys;
create policy "Users manage their own career journey"
on public.career_journeys for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own assessments" on public.assessments;
create policy "Users manage their own assessments"
on public.assessments for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own readiness" on public.career_readiness;
create policy "Users manage their own readiness"
on public.career_readiness for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own roadmaps" on public.roadmaps;
create policy "Users manage their own roadmaps"
on public.roadmaps for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own roadmap tasks" on public.roadmap_tasks;
create policy "Users manage their own roadmap tasks"
on public.roadmap_tasks for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on table public.profiles from anon;
revoke all on table public.career_journeys from anon;
revoke all on table public.assessments from anon;
revoke all on table public.career_readiness from anon;
revoke all on table public.roadmaps from anon;
revoke all on table public.roadmap_tasks from anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.career_journeys to authenticated;
grant select, insert, update, delete on table public.assessments to authenticated;
grant select, insert, update, delete on table public.career_readiness to authenticated;
grant select, insert, update, delete on table public.roadmaps to authenticated;
grant select, insert, update, delete on table public.roadmap_tasks to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

commit;
