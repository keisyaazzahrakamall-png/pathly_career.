# Pathly Deployment and Submission Checklist

Use this checklist after uploading the final code. Check items only after actually verifying them for the version being submitted. The existing production domain is retained as a reference; this ZIP does not deploy changes automatically.

## 1. Vercel deployment

- [ ] Import the Pathly repository or deploy its updated commit.
- [ ] Select the **Vite** framework preset.
- [ ] Use build command `npm run build` and output directory `dist`.
- [ ] Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` if overriding the public defaults.
- [ ] Confirm the intended production URL, currently documented as `https://pathly-velora.vercel.app/`.
- [ ] Check the response headers from `vercel.json`.
- [ ] Confirm `password-toggle.js` is served and the eye buttons work.
- [ ] Confirm the interface uses English on desktop and mobile.

## 2. Supabase Auth redirects

In Supabase Dashboard > Authentication > URL Configuration:

- [ ] Set **Site URL** to the actual production origin.
- [ ] Allow `https://pathly-velora.vercel.app/confirm-email.html` if using that domain.
- [ ] Allow `https://pathly-velora.vercel.app/reset-password.html` if using that domain.
- [ ] Allow local confirmation/reset URLs on the exact hostname and port in use.
- [ ] Add suitable preview URLs if testing Vercel previews.

Reference: [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

## 3. Two-account test

Use two email addresses that can receive links. Account A's data must not appear under account B.

| Flow | Account A | Account B |
| --- | --- | --- |
| Sign up and confirm email | [ ] | [ ] |
| Sign in and sign out | [ ] | [ ] |
| Forgot password → email → set a new password | [ ] | [ ] |
| Fill in the profile | [ ] | [ ] |
| Choose a target and complete the assessment | [ ] | [ ] |
| Record a reference and use No Evidence Yet on another skill | [ ] | [ ] |
| Save reflection and build a roadmap | [ ] | [ ] |
| Check progress, sign out, and sign back in | [ ] | [ ] |
| Assess another career and return to the first target | [ ] | [ ] |
| Verify pre-English assessments retain their levels and scores | [ ] | [ ] |
| Confirm Reset Journey affects only the active account | [ ] | [ ] |

Record the browser, device, date, actual result, and bugs. Mocked browser tests do not verify delivery of real confirmation/reset emails or the live database's RLS policies.

## 3a. Three-role update

- [ ] On a new database, apply 001 then 002. On an existing Pathly database, apply only 002.
- [ ] Register and confirm separate Student, Supervisor, and Admin accounts.
- [ ] Bootstrap the first Admin with `supabase/bootstrap-admin.sql`; assign later roles in the dashboard.
- [ ] Confirm each account opens its own dashboard after login.
- [ ] Assign the Student to the Supervisor and verify the saved assessments and roadmap are visible.
- [ ] Send feedback as Supervisor; verify it appears on the Student Dashboard after Refresh.
- [ ] Confirm a second, unassigned Student is invisible to the Supervisor.
- [ ] Remove an assignment and verify the old Supervisor loses read and feedback access.
- [ ] Confirm Staff cannot change Student assessments or task completion through the API.
- [ ] Confirm Student cannot change roles through a table write or Admin RPC.
- [ ] Check the three dashboards on desktop and mobile in the deployed browser.
- [ ] Run `npm run check` (unit tests, isolated SQL permissions, and production build).

See `../BACA_DULU.md` for setup. Automated tests do not configure or verify the
live Supabase project, its real email delivery, or the final deployed website.

## 4. Reviewer access

- [ ] Create a demo account without personal data.
- [ ] Confirm its email before handing it over.
- [ ] Complete a journey so reviewers can inspect results and a roadmap.
- [ ] Share credentials through a private submission field, not the public repository.

## 5. Screenshots

The existing files under `docs/screenshots/` show the earlier interface:

- `landing-page.png`
- `asesmen-referensi.png`
- `hasil-kesesuaian.png`
- `roadmap-jalur-saya.png`

Replace them with current production screenshots when the English version is deployed. Use dummy data and keep personal details, emails, and tokens out of screenshots.

## 6. Small user study

Test with 3–5 students before making impact claims. This is separate from the technical checks required to run the application.

After trying the app without guidance, ask:

1. What is Pathly for?
2. Do you understand the differences between the score, evidence references, and reflection?
3. Can you switch targets without losing earlier results?
4. Which roadmap steps are clearest or most confusing?
5. Does Pathly help you choose a next action? Why?

Record participant count, scenarios, findings, changes, and limitations. Do not invent results.

## 7. Final submission

- [ ] Confirm the live demo and repository links.
- [ ] Include the required team identities and contact links.
- [ ] Replace outdated screenshots with the submitted version's interface.
- [ ] Run `npm run check` and record the current test count.
- [ ] Check that no secret credentials or `service_role` key are committed.
- [ ] Keep `README.md` at the repository root.
