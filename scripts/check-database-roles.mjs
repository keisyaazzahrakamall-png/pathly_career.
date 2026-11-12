// Runs the real SQL policies in isolated WASM PostgreSQL. No live Supabase calls.
// The small auth schema below stands in for Supabase Auth's users + auth.uid().
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const users = { admin: id(1), supervisorA: id(2), supervisorB: id(3), studentA: id(4), studentB: id(5), spare: id(6) };
const read = (path) => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');
let passed = 0;
async function check(name, action) { await action(); passed += 1; console.log(`PASS ${name}`); }
async function owner() { await db.exec('reset role;'); }
async function asUser(userId) {
  await owner();
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  await db.exec('set role authenticated;');
}
async function role(userId) { return (await db.query('select role from public.user_roles where user_id = $1', [userId])).rows[0]?.role; }
async function count(table) { return Number((await db.query(`select count(*) as total from public.${table}`)).rows[0].total); }

try {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb not null default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `);
  // PGlite has built-in gen_random_uuid(); its pgcrypto extension is unavailable.
  const initial = (await read('supabase/migrations/001_initial_schema.sql'))
    .replace('create extension if not exists pgcrypto;', '-- gen_random_uuid() is built into this test engine.');
  await db.exec(initial);
  for (const [name, userId] of Object.entries(users)) {
    await db.query('insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)',
      [userId, `${name}@example.com`, JSON.stringify({ full_name: name, role: 'admin' })]);
  }
  for (const userId of [users.studentA, users.studentB]) {
    await db.query("insert into public.career_journeys (user_id, career_stage, target_career_id, target_career_name) values ($1, 'prepare', 'data-analyst', 'Data Analyst')", [userId]);
    await db.query("insert into public.assessments (user_id, career_id, career_name, answers) values ($1, 'data-analyst', 'Data Analyst', '{\"SQL\":{\"level\":1}}')", [userId]);
    await db.query("insert into public.career_readiness (user_id, career_id, result) values ($1, 'data-analyst', '{\"alignment\":50}')", [userId]);
    const roadmap = await db.query("insert into public.roadmaps (user_id, career_id, roadmap_data) values ($1, 'data-analyst', '{\"tasks\":[{\"id\":\"t1\"}]}') returning id", [userId]);
    await db.query("insert into public.roadmap_tasks (user_id, roadmap_id, task_key, completed) values ($1, $2, 't1', true)", [userId, roadmap.rows[0].id]);
  }
  const migration = await read('supabase/migrations/002_roles_and_supervision.sql');
  await check('migration preserves existing assessments and roadmaps', async () => {
    await db.exec(migration);
    assert.equal(await count('assessments'), 2); assert.equal(await count('roadmaps'), 2);
  });
  await check('existing accounts default to Student; user metadata cannot grant Admin', async () => {
    for (const userId of Object.values(users)) assert.equal(await role(userId), 'student');
  });
  await check('first Admin can be bootstrapped by the database owner', async () => {
    const bootstrap = (await read('supabase/bootstrap-admin.sql'))
      .replace('REPLACE_WITH_YOUR_ADMIN_EMAIL@example.com', 'admin@example.com');
    await db.exec(bootstrap); assert.equal(await role(users.admin), 'admin');
  });
  await asUser(users.admin);
  await check('Admin assigns Supervisor roles through the guarded function', async () => {
    for (const key of ['supervisorA', 'supervisorB']) {
      await db.query("select public.admin_set_user_role($1, 'supervisor')", [users[key]]);
      assert.equal(await role(users[key]), 'supervisor');
    }
  });
  await check('Admin can read all accounts and role-change history', async () => {
    assert.equal(await count('profiles'), 6); assert.equal(await count('role_change_log'), 2);
  });
  await check('Admin cannot demote its own account', async () => {
    await assert.rejects(db.query("select public.admin_set_user_role($1, 'student')", [users.admin]), /own admin role/);
  });
  await check('unknown or missing roles are rejected', async () => {
    await assert.rejects(db.query("select public.admin_set_user_role($1, 'owner')", [users.spare]), /Choose Student/);
    await assert.rejects(db.query('select public.admin_set_user_role($1, null)', [users.spare]), /Choose Student/);
  });
  await check('Admin cannot bypass role validation by writing the roles table', async () => {
    await assert.rejects(db.query("update public.user_roles set role = 'admin' where user_id = $1", [users.spare]), /permission denied/);
  });
  await check('only Supervisor accounts can be assigned to Students', async () => {
    await assert.rejects(db.query('select public.admin_assign_supervisor($1, $2)', [users.studentA, users.studentB]), /Supervisor role/);
    await assert.rejects(db.query('select public.admin_assign_supervisor($1, $2)', [users.supervisorA, users.supervisorB]), /Student role/);
    await db.query('select public.admin_assign_supervisor($1, $2)', [users.studentA, users.supervisorA]);
    await db.query('select public.admin_assign_supervisor($1, $2)', [users.studentB, users.supervisorB]);
  });
  await check('changing an assigned user role requires removing assignments first', async () => {
    await assert.rejects(db.query("select public.admin_set_user_role($1, 'student')", [users.supervisorA]), /Remove this account/);
    await assert.rejects(db.query("select public.admin_set_user_role($1, 'admin')", [users.studentA]), /Remove this account/);
  });
  await asUser(users.studentA);
  await check('Student can read its role but not other roles', async () => {
    assert.equal(await count('user_roles'), 1); assert.equal(await role(users.admin), undefined);
  });
  await check('Student reads only its own career records', async () => {
    for (const table of ['career_journeys', 'assessments', 'career_readiness', 'roadmaps', 'roadmap_tasks']) assert.equal(await count(table), 1);
  });
  await check('Student cannot promote itself, assign a Supervisor, or insert a forged role', async () => {
    await assert.rejects(db.query("select public.admin_set_user_role($1, 'admin')", [users.studentA]), /Only an admin/);
    await assert.rejects(db.query('select public.admin_assign_supervisor($1, $2)', [users.studentA, users.supervisorB]), /Only an admin/);
    await assert.rejects(db.query("insert into public.user_roles (user_id, role) values ($1, 'admin')", [users.studentA]), /permission denied/);
  });
  await check('Student profile edits and upserts still work without changing roles', async () => {
    await db.query("insert into public.profiles (id, full_name, major) values ($1, 'Student A', 'Information Systems') on conflict (id) do update set full_name = excluded.full_name, major = excluded.major", [users.studentA]);
    assert.equal(await role(users.studentA), 'student');
    const update = await db.query("update public.profiles set full_name = 'Forged' where id = $1 returning id", [users.studentB]);
    assert.equal(update.rows.length, 0);
    await assert.rejects(db.query('delete from public.profiles where id = $1', [users.studentA]), /permission denied/);
  });
  await check('Student cannot submit Supervisor feedback or read role history', async () => {
    await assert.rejects(db.query("insert into public.supervisor_feedback (student_id, supervisor_id, body) values ($1, $2, 'Forged guidance')", [users.studentA, users.studentA]), /row-level security/);
    assert.equal(await count('role_change_log'), 0);
  });
  await asUser(users.supervisorA);
  await check('Supervisor can read only assigned Students across career tables', async () => {
    for (const table of ['career_journeys', 'assessments', 'career_readiness', 'roadmaps', 'roadmap_tasks']) {
      const result = await db.query(`select user_id from public.${table}`);
      assert.deepEqual(result.rows.map((r) => r.user_id), [users.studentA]);
    }
    assert.equal((await db.query('select id from public.profiles where id = $1', [users.studentB])).rows.length, 0);
  });
  await check('Supervisor cannot edit Student assessments, roadmaps, or task completion', async () => {
    assert.equal((await db.query("update public.assessments set answers = '{}' where user_id = $1 returning id", [users.studentA])).rows.length, 0);
    assert.equal((await db.query("update public.roadmaps set roadmap_data = '{}' where user_id = $1 returning id", [users.studentA])).rows.length, 0);
    assert.equal((await db.query('update public.roadmap_tasks set completed = false where user_id = $1 returning id', [users.studentA])).rows.length, 0);
  });
  await check('Supervisor can write feedback only as itself for an assigned Student', async () => {
    await db.query("insert into public.supervisor_feedback (student_id, supervisor_id, body) values ($1, $2, 'Practice SQL with a small dataset.')", [users.studentA, users.supervisorA]);
    await assert.rejects(db.query("insert into public.supervisor_feedback (student_id, supervisor_id, body) values ($1, $2, 'Unassigned student guidance')", [users.studentB, users.supervisorA]), /row-level security/);
    await assert.rejects(db.query("insert into public.supervisor_feedback (student_id, supervisor_id, body) values ($1, $2, 'Impersonated supervisor')", [users.studentA, users.supervisorB]), /row-level security/);
  });
  await check('feedback length is validated by the database', async () => {
    await assert.rejects(db.query("insert into public.supervisor_feedback (student_id, supervisor_id, body) values ($1, $2, 'x')", [users.studentA, users.supervisorA]), /check constraint/);
  });
  await asUser(users.studentA);
  await check('Student can read its Supervisor feedback', async () => { assert.equal(await count('supervisor_feedback'), 1); });
  await asUser(users.studentB);
  await check('another Student cannot read that feedback', async () => { assert.equal(await count('supervisor_feedback'), 0); });
  await asUser(users.admin);
  await check('Admin has read-only access to Student career data', async () => {
    assert.equal(await count('assessments'), 2);
    assert.equal((await db.query("update public.assessments set answers = '{}' returning id")).rows.length, 0);
  });
  await check('assignment removal is immediately reflected in permissions', async () => {
    await db.query('select public.admin_assign_supervisor($1, null)', [users.studentA]);
    await asUser(users.supervisorA);
    assert.equal(await count('assessments'), 0); assert.equal(await count('supervisor_feedback'), 0);
    await assert.rejects(db.query("insert into public.supervisor_feedback (student_id, supervisor_id, body) values ($1, $2, 'Guidance after removal')", [users.studentA, users.supervisorA]), /row-level security/);
  });
  await asUser(users.studentA);
  await check('feedback remains available to the Student after reassignment', async () => { assert.equal(await count('supervisor_feedback'), 1); });
  await asUser(users.admin);
  await check('a new assigned Supervisor can review earlier guidance', async () => {
    await db.query('select public.admin_assign_supervisor($1, $2)', [users.studentA, users.supervisorB]);
    await asUser(users.supervisorB);
    assert.equal(await count('assessments'), 2); assert.equal(await count('supervisor_feedback'), 1);
  });
  await owner();
  await check('new registrations always get Student even with forged signup metadata', async () => {
    await db.query("insert into auth.users (id, email, raw_user_meta_data) values ($1, 'new@example.com', '{\"role\":\"admin\"}')", [id(7)]);
    assert.equal(await role(id(7)), 'student');
  });
  await check('migration is rerunnable without resetting roles or deleting data', async () => {
    await db.exec(migration);
    assert.equal(await role(users.admin), 'admin'); assert.equal(await role(users.supervisorB), 'supervisor');
    assert.equal(await count('assessments'), 2); assert.equal(await count('supervisor_feedback'), 1);
  });
  await check('anonymous access cannot read career data or call admin functions', async () => {
    await db.exec('set role anon');
    await assert.rejects(db.query('select * from public.assessments'), /permission denied/);
    await assert.rejects(db.query("select public.admin_set_user_role($1, 'admin')", [users.spare]), /permission denied/);
  });
  console.log(`\n${passed} database permission checks passed. No live backend was used.`);
} finally { await db.close(); }
