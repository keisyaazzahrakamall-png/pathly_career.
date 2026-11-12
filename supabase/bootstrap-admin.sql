-- Run in Supabase SQL Editor AFTER migrations 001 and 002.
-- 1. Register your own account in Pathly and confirm its email first.
-- 2. Replace the email below with that account's actual email.
-- 3. Run this script once. Manage later roles from Admin Dashboard.
-- This runs only with the database owner's SQL Editor privileges.
do $$
declare target_id uuid;
begin
  select id into target_id from auth.users
  where lower(email) = lower('REPLACE_WITH_YOUR_ADMIN_EMAIL@example.com');
  if target_id is null then
    raise exception 'Account not found. Replace the example email with your registered Pathly email.';
  end if;
  if exists (select 1 from public.supervisor_assignments where student_id = target_id or supervisor_id = target_id) then
    raise exception 'Remove existing supervisor assignments for this account first.';
  end if;
  update public.user_roles set role = 'admin', updated_at = now() where user_id = target_id;
  if not found then raise exception 'Run migration 002_roles_and_supervision.sql first.'; end if;
end;
$$;
