# English Interface Update

This package updates the existing Pathly project; it does not deploy the public website or change the live Supabase schema.

## Changes

- English navigation, page titles, forms, descriptions, skill glossary, validation messages, scoring explanations, reflections, and generated roadmaps.
- English date formatting and CSS-generated labels.
- Independent password visibility buttons for sign-in, sign-up, and both reset-password fields. Click, Space, and Enter update the icon and accessible state while preserving the input value.
- Inline SVG eye icons avoid reliance on CSS image masks.
- Compatibility for assessments stored with Indonesian skill names. Existing levels and user-written evidence notes are preserved.
- Compatibility for older roadmap text, retaining task IDs used by progress records.
- Removed the header-only `frame-ancestors` directive from the HTML meta CSP; the HTTP header keeps that directive.
- Updated English setup and deployment documentation.

## Verification

- `npm run check`: 60 tests pass and the production build succeeds.
- Local Chromium checks use a simulated Supabase backend to test interface behavior without modifying real user records.
- Real email delivery, live Supabase permissions, and deployment configuration require the owner's checks in `PRODUCTION-CHECKLIST.md`.

Start with `npm ci`, then `npm run dev`, and open the printed HTTP URL. The source ZIP excludes generated dependencies and build output. Run `npm run build` to create a fresh `dist/` folder.
