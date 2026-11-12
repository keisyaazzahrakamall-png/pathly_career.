# Three-role update — verification record

Date: 12 November 2026.

| Check | Result |
| --- | --- |
| Unit and existing application contract tests (`npm test`) | 65 passed, 0 failed. |
| Database policy checks (`npm run test:database`) | 28 passed in isolated PostgreSQL 18.6 through PGlite. |
| Dashboard DOM interactions with a temporary mocked data service | 13 passed. |
| Production build (`npm run build`) | Passed; all three dashboard entry pages included. |
| Original uploaded project files | All 101 original files retained; selected files updated and new files added. |

The database test executes migrations 001 and 002, with a small simulated
`auth.users` table and `auth.uid()` function. PGlite's built-in
`gen_random_uuid()` replaces the unavailable pgcrypto extension in that test
engine only; the delivered migration 001 is unchanged.

Database checks cover Student ownership, blocked self-promotion and forged
signup metadata, Admin role changes and assignment validation, Supervisor
access limited to assigned Students, read-only Student records for staff,
feedback authorization, revoked assignments, anonymous access, preserving
existing data, and rerunning migration 002.

DOM checks exercised role changes, account search, assignment and removal,
Student progress, Supervisor review and feedback submission, Student feedback
visibility, input validation, and rendering account names as text.
They used an isolated temporary test harness; they are not browser rendering
or real Supabase integration tests.

The local browser preview could not be reached from the available browser
environment, so visual desktop/mobile checks remain on the production
checklist. Real Auth email delivery, real Supabase policies after deployment,
and the final deployed website still need the live checks described in
`PRODUCTION-CHECKLIST.md` and `../BACA_DULU.md`.

No live Supabase account, role, assignment, feedback, or deployment was changed
while creating this ZIP. Apply the included SQL to your chosen Supabase project
and bootstrap the first Admin before using the dashboards.
