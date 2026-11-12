# Supabase database setup

For a new database, run `migrations/001_initial_schema.sql`, then
`migrations/002_roles_and_supervision.sql` in Supabase SQL Editor.
For an existing Pathly database with the six original tables, run **only 002**.
Do not rerun 001 after 002: the older migration restores the original policies
and signup trigger. See `../BACA_DULU.md` for the full Indonesian guide.

The migration creates:

- `profiles`
- `career_journeys`
- `assessments`
- `career_readiness`
- `roadmaps`
- `roadmap_tasks`

Migration 002 adds `user_roles`, `supervisor_assignments`,
`supervisor_feedback`, and `role_change_log`. It preserves existing career data
and defaults existing and new accounts to Student. Reapplying 002 preserves
roles that have already been assigned.

Row Level Security is enabled on all ten tables. Students manage their own
career data. Supervisors can read only their currently assigned Students' data
and send feedback. Admins manage roles and assignments through guarded database
functions and can read Student data. Staff cannot modify Student assessments or
task completion. No role can promote itself through signup metadata or direct
table writes.

Register an account, confirm its email, then run `bootstrap-admin.sql` after
replacing its example email. Use the resulting Admin Dashboard for all later
role assignments. Keep the `private` schema outside Supabase's exposed API
schemas. Only `public` needs to be exposed for this app.

`npm run test:database` checks the actual policies in an isolated PGlite
PostgreSQL database with a small simulated Auth schema. It never contacts your
live Supabase project. Apply and test the migration on your backend separately.

## Authentication redirect URLs

In **Authentication → URL Configuration**, allow the local development URL
shown by Vite, including:

- `http://localhost:5173/onboarding.html`
- `http://localhost:5173/confirm-email.html`
- `http://localhost:5173/reset-password.html`

Before publishing, set **Site URL** to the final deployed domain and add one of
the following redirect configurations:

- `https://your-domain.vercel.app/confirm-email.html`
- `https://your-domain.vercel.app/reset-password.html`
- `https://your-domain.vercel.app/**` to allow every Pathly authentication page

Without these redirects, email verification or password reset links can fall
back to the home page instead of opening their intended status/form page.
