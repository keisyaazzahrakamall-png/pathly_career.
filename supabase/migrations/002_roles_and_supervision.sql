-- Pathly: apply AFTER 001_initial_schema.sql. Existing career data is retained.
-- Roles are stored separately so profile edits cannot grant elevated access.
begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'supervisor', 'admin')),
  updated_at timestamptz not null default now()
);

create table if not exists public.supervisor_assignments (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  supervisor_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  check (student_id <> supervisor_id)
);
create index if not exists supervisor_assignments_supervisor_idx
  on public.supervisor_assignments(supervisor_id);

create table if not exists public.supervisor_feedback (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  supervisor_id uuid not null references public.profiles(id) on delete cascade,
  career_id text,
  career_name text not null default 'General guidance' check (char_length(career_name) <= 200),
  body text not null check (char_length(btrim(body)) between 5 and 3000),
  created_at timestamptz not null default now()
);
create index if not exists supervisor_feedback_student_idx
  on public.supervisor_feedback(student_id, created_at desc);

create table if not exists public.role_change_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  old_role text not null,
  new_role text not null,
  created_at timestamptz not null default now()
);

-- Create missing profiles for accounts created before the original auth trigger.
insert into public.profiles (id, full_name)
select id, coalesce(raw_user_meta_data ->> 'full_name', '') from auth.users
on conflict (id) do nothing;
insert into public.user_roles (user_id, role)
select id, 'student' from public.profiles
on conflict (user_id) do nothing;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  -- Ignore any role supplied through signup metadata.
  insert into public.user_roles (user_id, role) values (new.id, 'student')
  on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create or replace function private.current_app_role()
returns text language sql stable security definer set search_path = '' as $$
  select role from public.user_roles where user_id = (select auth.uid());
$$;

create or replace function private.can_review_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.current_app_role() = 'supervisor' and exists (
    select 1 from public.supervisor_assignments a
    join public.user_roles r on r.user_id = a.student_id and r.role = 'student'
    where a.student_id = p_student_id and a.supervisor_id = (select auth.uid())
  );
$$;

create or replace function private.can_read_profile(p_profile_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_profile_id = (select auth.uid())
    or private.current_app_role() = 'admin'
    or private.can_review_student(p_profile_id)
    or (private.current_app_role() = 'student' and exists (
      select 1 from public.supervisor_assignments a
      where a.student_id = (select auth.uid()) and a.supervisor_id = p_profile_id
    ));
$$;

create or replace function private.set_user_role(p_user_id uuid, p_role text)
returns void language plpgsql security definer set search_path = '' as $$
declare previous_role text;
begin
  -- Serialize role changes and assignments, including concurrent admin requests.
  perform pg_catalog.pg_advisory_xact_lock(724091);
  if private.current_app_role() is distinct from 'admin' then
    raise exception 'Only an admin can change roles.' using errcode = '42501';
  end if;
  if p_role is null or p_role not in ('student', 'supervisor', 'admin') then
    raise exception 'Choose Student, Supervisor, or Admin.' using errcode = '22023';
  end if;
  select role into previous_role from public.user_roles where user_id = p_user_id for update;
  if not found then raise exception 'This account does not have a role record.'; end if;
  if previous_role = p_role then return; end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'You cannot change your own admin role.' using errcode = '42501';
  end if;
  if previous_role = 'admin' and (select count(*) from public.user_roles where role = 'admin') <= 1 then
    raise exception 'At least one admin must remain.';
  end if;
  if exists (select 1 from public.supervisor_assignments where student_id = p_user_id or supervisor_id = p_user_id) then
    raise exception 'Remove this account''s supervisor assignments before changing its role.';
  end if;
  update public.user_roles set role = p_role, updated_at = now() where user_id = p_user_id;
  insert into public.role_change_log (user_id, changed_by, old_role, new_role)
  values (p_user_id, (select auth.uid()), previous_role, p_role);
end;
$$;

create or replace function private.assign_supervisor(p_student_id uuid, p_supervisor_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(724091);
  if private.current_app_role() is distinct from 'admin' then
    raise exception 'Only an admin can assign supervisors.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.user_roles where user_id = p_student_id and role = 'student') then
    raise exception 'The selected account must have the Student role.';
  end if;
  if p_supervisor_id is null then
    delete from public.supervisor_assignments where student_id = p_student_id;
    return;
  end if;
  if not exists (select 1 from public.user_roles where user_id = p_supervisor_id and role = 'supervisor') then
    raise exception 'The selected account must have the Supervisor role.';
  end if;
  insert into public.supervisor_assignments (student_id, supervisor_id, assigned_by)
  values (p_student_id, p_supervisor_id, (select auth.uid()))
  on conflict (student_id) do update set supervisor_id = excluded.supervisor_id,
    assigned_by = excluded.assigned_by, updated_at = now();
end;
$$;

-- Only these narrow wrappers are exposed through the Data API. Authorization
-- happens in the private functions; no client receives an elevated database key.
create or replace function public.admin_set_user_role(p_user_id uuid, p_role text)
returns void language sql security invoker set search_path = '' as $$
  select private.set_user_role(p_user_id, p_role);
$$;
create or replace function public.admin_assign_supervisor(p_student_id uuid, p_supervisor_id uuid)
returns void language sql security invoker set search_path = '' as $$
  select private.assign_supervisor(p_student_id, p_supervisor_id);
$$;

revoke all on function private.current_app_role() from public, anon;
revoke all on function private.can_review_student(uuid) from public, anon;
revoke all on function private.can_read_profile(uuid) from public, anon;
revoke all on function private.set_user_role(uuid, text) from public, anon;
revoke all on function private.assign_supervisor(uuid, uuid) from public, anon;
revoke all on function public.admin_set_user_role(uuid, text) from public, anon;
revoke all on function public.admin_assign_supervisor(uuid, uuid) from public, anon;
grant execute on function private.current_app_role() to authenticated;
grant execute on function private.can_review_student(uuid) to authenticated;
grant execute on function private.can_read_profile(uuid) to authenticated;
grant execute on function private.set_user_role(uuid, text) to authenticated;
grant execute on function private.assign_supervisor(uuid, uuid) to authenticated;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
grant execute on function public.admin_assign_supervisor(uuid, uuid) to authenticated;

alter table public.user_roles enable row level security;
alter table public.supervisor_assignments enable row level security;
alter table public.supervisor_feedback enable row level security;
alter table public.role_change_log enable row level security;

drop policy if exists "Read own role or all roles as admin" on public.user_roles;
create policy "Read own role or all roles as admin" on public.user_roles for select to authenticated
using (user_id = (select auth.uid()) or (select private.current_app_role()) = 'admin');

drop policy if exists "Read relevant assignments" on public.supervisor_assignments;
create policy "Read relevant assignments" on public.supervisor_assignments for select to authenticated
using (student_id = (select auth.uid()) or supervisor_id = (select auth.uid())
  or (select private.current_app_role()) = 'admin');

drop policy if exists "Read relevant feedback" on public.supervisor_feedback;
create policy "Read relevant feedback" on public.supervisor_feedback for select to authenticated
using ((student_id = (select auth.uid()) and (select private.current_app_role()) = 'student')
  or private.can_review_student(student_id) or (select private.current_app_role()) = 'admin');
drop policy if exists "Supervisors add feedback for assigned students" on public.supervisor_feedback;
create policy "Supervisors add feedback for assigned students" on public.supervisor_feedback for insert to authenticated
with check (supervisor_id = (select auth.uid()) and private.can_review_student(student_id));

drop policy if exists "Admins read role history" on public.role_change_log;
create policy "Admins read role history" on public.role_change_log for select to authenticated
using ((select private.current_app_role()) = 'admin');

drop policy if exists "Users manage their own profile" on public.profiles;
drop policy if exists "Read permitted profiles" on public.profiles;
create policy "Read permitted profiles" on public.profiles for select to authenticated
using (private.can_read_profile(id));
drop policy if exists "Insert own profile" on public.profiles;
create policy "Insert own profile" on public.profiles for insert to authenticated
with check (id = (select auth.uid()));
drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile" on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Replace the six owner-only career policies with student ownership plus
-- read-only access for admins and the currently assigned supervisor.
do $$
declare item record;
begin
  for item in select * from (values
    ('career_journeys', 'Users manage their own career journey'),
    ('assessments', 'Users manage their own assessments'),
    ('career_readiness', 'Users manage their own readiness'),
    ('roadmaps', 'Users manage their own roadmaps'),
    ('roadmap_tasks', 'Users manage their own roadmap tasks')
  ) as tables(table_name, owner_policy)
  loop
    execute format('drop policy if exists %I on public.%I', item.owner_policy, item.table_name);
    execute format('create policy %I on public.%I for all to authenticated using ((select auth.uid()) = user_id and (select private.current_app_role()) = ''student'') with check ((select auth.uid()) = user_id and (select private.current_app_role()) = ''student'')', item.owner_policy, item.table_name);
    execute format('drop policy if exists "Staff read permitted student data" on public.%I', item.table_name);
    execute format('create policy "Staff read permitted student data" on public.%I for select to authenticated using ((select private.current_app_role()) = ''admin'' or private.can_review_student(user_id))', item.table_name);
  end loop;
end;
$$;

revoke all on public.user_roles, public.supervisor_assignments, public.supervisor_feedback, public.role_change_log from anon, authenticated;
grant select on public.user_roles, public.supervisor_assignments, public.role_change_log to authenticated;
grant select, insert on public.supervisor_feedback to authenticated;
revoke delete on public.profiles from authenticated;

commit;
