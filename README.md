# Pathly

**Understand your skills, identify gaps, and build your career path.**

A career-readiness web application for D3, D4, and bachelor's students. Pathly connects career exploration, self-assessment, skill-gap analysis, reflection, and a personal roadmap in one account.

- Existing live demo: https://pathly-velora.vercel.app/
- Repository: https://github.com/keisyaazzahrakamall-png/PATHLY
- This source package uses an English interface. The existing live demo changes only after you deploy this version.

## Quick start

**Three-role update:** Student, Supervisor, and Admin. Start with
[BACA_DULU.md](BACA_DULU.md) for the Indonesian setup guide, database migration,
first Admin account, and a three-account demo. This ZIP contains source code;
it does not apply SQL to your live database or deploy your website.

Install a Node.js version supported by the Vite version in `package-lock.json` (the current dependency requires Node.js 20.19+ or 22.12+). From this folder:

```bash
npm ci
npm run dev
```

Open the HTTP address printed in your terminal, usually `http://localhost:5173`. Do not open the HTML files directly with `file://`: the main application requires Vite to resolve its JavaScript modules and environment variables.

The project retains the existing public Supabase configuration in `js/lib/supabase.js`. The dashboard does not need to stay open, but authentication and account data require an internet connection and an available Supabase project.

To use your own backend:

1. Copy `.env.example` to `.env`.
2. Fill in your project URL and **publishable** key:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

3. For a new database, run `supabase/migrations/001_initial_schema.sql`, then `supabase/migrations/002_roles_and_supervision.sql` in Supabase SQL Editor. For an existing Pathly database with the six original tables, run only `002_roles_and_supervision.sql`. Do not rerun 001 after 002, as it restores the original policies and auth trigger. Register your own account and follow `supabase/bootstrap-admin.sql` to set up the first Admin.
4. In Supabase Authentication > URL Configuration, allow the URLs used for email confirmation and password recovery, including `http://localhost:5173/confirm-email.html` and `http://localhost:5173/reset-password.html`. If using another port or hostname, add those exact URLs too.
5. Restart Vite after changing `.env`. For production, rebuild after changing these values; Vite inserts `VITE_` variables at build time.

Use only the publishable/anon key in the browser. Never include a secret or `service_role` key in frontend code.

## Purpose and intended impact

Career information is often scattered. Students need to connect role requirements with their current skills and choose useful next steps. Pathly offers a structured, personal view of that journey.

Pathly supports the intended goals of **SDG 8: Decent Work and Economic Growth**, especially targets 8.5 and 8.6. This describes the intended contribution, not measured impact. User-study results must not be claimed until a study has actually taken place.

The app does not predict employment, diagnose psychological traits, or verify portfolio evidence.

## Features

| Role | Dashboard and permissions |
| --- | --- |
| Student | `student-dashboard.html`: continue the existing career journey, see progress, assigned Supervisor, and feedback. |
| Supervisor | `supervisor-dashboard.html`: review assigned Students, assessments, references, roadmaps, task progress, and guidance history; send feedback. |
| Admin | `admin-dashboard.html`: manage registered users' roles, assign or remove Supervisors, monitor progress, and read recent role changes. |

Sign-in opens the dashboard for the account's database role. Public signup
always creates a Student. Role management uses guarded database functions;
editing browser storage or signup metadata cannot grant elevated access.

| Feature | What it does |
| --- | --- |
| Explore, Compare, and Prepare | Three starting contexts. Explore and Prepare choose one target; Compare lets users compare two or three careers. |
| Career catalog | Five initial careers plus supported role templates for more specific searches. Unsupported roles are not automatically analyzed. |
| Skills assessment | Rates each skill from 0 to 3 and records evidence categories and optional work references. |
| Weighted alignment | Compares self-reported levels with mapped role requirements. |
| Priority gaps | Sorts unmet skills by weight, gap size, and status. |
| Adaptability reflection | Eight Pathly-written statements covering concern, control, curiosity, and confidence. |
| Learn–Apply–Prove roadmap | Turns the top three gaps into tasks with initial activity estimates and completion criteria. |
| My Path | Tracks targets, results, roadmap tasks, and career history. Changing targets retains other careers' results. |
| Accounts and sync | Supabase Auth and PostgreSQL store each account's data across sessions. |

Initial careers: Data Analyst, Business Analyst, Front-End Developer, UI/UX Designer, and Digital Marketing Specialist.

## User journey

1. Create an account, confirm the email if requested, and sign in.
2. Complete the education and experience profile.
3. Choose Explore, Compare, or Prepare.
4. Explore careers and set a target.
5. Assess your skills and select evidence categories. “No Evidence Yet” is valid.
6. Review your alignment score and priority skill gaps.
7. Complete and save the adaptability reflection.
8. Build a roadmap, open My Path, and check or uncheck completed tasks.
9. Return to previous targets through career history or edit your profile from the account menu.

The password eye buttons work independently on sign-in, sign-up, and reset-password pages. Their accessible labels and icons update with the current state. The standalone control is served from `public/password-toggle.js` and does not depend on the authentication module loading.

## Scoring method

| Level | Meaning |
| ---: | --- |
| 0 — Not Started | Has not studied the skill yet. |
| 1 — Learning | Understands the basics or is learning. |
| 2 — Applied | Has used the skill in an assignment or project. |
| 3 — Independent | Can use the skill independently. |

```text
coverage = min(max(userLevel, 0) / targetLevel, 1)
alignment = round(sum(weight × coverage) / sum(weight) × 100)
```

Core skills use weight 3 and target level 2; Important skills use weight 2 and target level 1. These are Pathly learning-priority heuristics, not official hiring thresholds or industry standards.

Evidence categories, notes, and links do **not** raise the score or change gap ordering. The application does not open or authenticate referenced documents. Gap priority considers skill weight first, then the level gap, then missing-skill status.

The eight reflection statements are inspired by the four career-adaptability dimensions discussed by [Savickas & Porfeli (2012)](https://www.marksavickas.com/files/1_Savickas_bio/Interviews/Savickas%20Publications/Journal%20Articles/CAAS_International.pdf). They are written by Pathly, are not the validated 24-item CAAS instrument, and have not been psychometrically validated.

Roadmap estimates cover initial learning activities, not the time to master an entire skill. Overall pace adjusts to the student's semester.

## Career data

Skills are manually mapped using O*NET occupation profiles, the ESCO taxonomy, the Indonesian SKKNI portal, and a small snapshot of Indonesian job listings. The mapping was last reviewed on September 5, 2026. It should be reviewed each semester or when requirements change significantly.

See [docs/DATA-SOURCES.md](docs/DATA-SOURCES.md) for sources, local context, weights, and limitations. The app exposes a short provenance note through `window.PATHLY_DATA_PROVENANCE`.

## Technology and architecture

| Part | Technology |
| --- | --- |
| Interface | HTML5, CSS3, vanilla JavaScript, ES modules |
| Build and development | Vite |
| Authentication | Supabase Auth |
| Database | PostgreSQL through Supabase |
| Data access | `@supabase/supabase-js`; no custom REST API |
| Tests | Node.js built-in test runner |
| Existing hosting configuration | Vercel |

The browser loads the frontend, then connects directly to Supabase Auth and the database. The database is not contained in the frontend package. `localStorage` is an account-specific cache; the database is the primary store.

| Table | Purpose |
| --- | --- |
| `profiles` | Education and experience profile |
| `user_roles` | Student, Supervisor, or Admin role; protected from direct browser writes |
| `supervisor_assignments` | One Supervisor per Student; managed by Admins |
| `supervisor_feedback` | Supervisor guidance readable by the Student and permitted staff |
| `role_change_log` | Admin role-change history |
| `career_journeys` | Starting stage, target, comparisons, and custom careers |
| `assessments` | Per-career answers and references |
| `career_readiness` | Reflection responses and scoring results |
| `roadmaps` | Generated roadmaps |
| `roadmap_tasks` | Task completion state |

Migration 002 extends Row Level Security: Students manage their own career data;
Supervisors can read only currently assigned Students' data; Admins can read
Student data and manage roles and assignments. Staff cannot overwrite Student
assessments or task completion. Confirm both migrations are applied to the actual
Supabase project before relying on these permissions.

## Project layout

```text
pathly-web/
  *.html                       Multi-page interface
  css/                         Styles and responsive layouts
  js/auth/                     Account and session flows
  js/lib/                      Data access, scoring, validation, legacy-data compatibility
  js/pages/                    Page bootstrap modules
  public/password-toggle.js    Independent password visibility control
  supabase/migrations/         Database schema and access policies
  docs/                        Data sources and deployment checklist
  tests/                       Automated checks
  package.json                 Commands and dependencies
  package-lock.json            Locked dependency versions
  vite.config.js               Multi-page build and local headers
  vercel.json                  Vercel hosting headers
```

## Build and check

```bash
npm run check
npm run preview
```

`npm run check` runs the unit tests, isolated PostgreSQL permission checks, and creates the production build in `dist/`. Open the preview URL printed by Vite. Stop either local server with `Ctrl+C`.

For Vercel, use the Vite preset, build command `npm run build`, and output folder `dist`. Update Supabase's Site URL and allowed redirects to the actual deployment domain.

The tests cover scoring, input safety, email validation, password visibility, account flow contracts, navigation, career history, and compatibility with assessments and roadmaps saved before the English interface. Static contract tests do not replace real browser and backend testing. See [docs/PRODUCTION-CHECKLIST.md](docs/PRODUCTION-CHECKLIST.md).

## English version and saved data

Navigation, forms, messages, role descriptions, skill explanations, results, and generated tasks use English. Existing Indonesian skill names are normalized when old assessments are loaded, so their levels and evidence notes continue to count. Generated roadmap labels are translated while task IDs and completion references remain stable. User-entered names, notes, and links are retained as written.

The existing files in `docs/screenshots/` document the earlier interface; they are not evidence that this English version is already deployed.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| HTML opens but the main app does not work | Start Vite and open its HTTP URL rather than opening files directly. |
| Authentication or data fails to load | Internet access, Supabase project availability, URL/key, migration, and RLS policies. |
| Email confirmation or reset opens the wrong page | Supabase Site URL and allowed redirect URLs for the exact host and port. |
| A configuration change is not visible | Restart development; rebuild and redeploy production. |
| Old language still appears after replacing files | Stop the old server, run this folder's build, restart, and hard-refresh the browser. Do not overwrite the new files with an older `dist/` folder. |
| Password visibility control is missing after deployment | Ensure the build copied `public/password-toggle.js` to `dist/password-toggle.js`. |

## Privacy, limitations, and future work

- Account data is associated with the authenticated user; browser caches are cleared when the account changes.
- Custom career inputs are normalized, length-limited, and checked for unsafe content.
- Security headers are configured for Vite and Vercel. Header-only CSP directives are kept out of HTML meta policies.
- Do not enter private documents, identification numbers, confidential data, or other people's information in references.
- Reset Journey removes targets, assessments, reflections, roadmaps, and progress while retaining the account, education profile, Supervisor assignment, and feedback.
- Full self-service account deletion is not available in this MVP. Contact the project team through the repository.
- The career catalog simplifies differences in seniority, industry, employers, and location. Source mappings and weights are manually maintained.
- There is no automatic document verification, psychometric diagnosis, or guarantee of employment.
- Future work includes expanding Indonesian sources and career coverage, documenting regular reviews, and testing comprehension and impact with students.

See [privacy.html](privacy.html) for the in-app privacy summary. Use private submission fields for demo credentials; never publish passwords in the repository.

## License and team

Copyright © 2026 Keisya Azzahra Kamal. No open-source license has been granted; reuse requires the project owner's permission.
