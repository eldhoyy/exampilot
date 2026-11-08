# ExamPilot setup checklist

The repository can be deployed as a frontend preview before the backend is connected. Full student accounts and synced data require the external setup below.

## 1. Deploy the frontend on Vercel

1. Sign in at https://vercel.com/ with the GitHub account that owns this repository.
2. Choose **Add New → Project**.
3. Import `eldhoyy/exampilot`.
4. Keep the detected Next.js framework and default build settings.
5. Deploy. The first deployment may run before any environment variables are added because the current UI uses local draft storage.

## 2. Create Supabase project

1. Create a project at https://supabase.com/dashboard.
2. Save the project URL and publishable/anon key.
3. Open **SQL Editor** and run migrations in filename order:
   - `supabase/migrations/001_academic_core.sql`
   - `supabase/migrations/002_planning_resources_ai.sql`
4. In Vercel → Project → Settings → Environment Variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Redeploy after setting variables.

Do not expose the Supabase service-role key in browser code or any `NEXT_PUBLIC_` variable.

## 3. External integrations (later release)

- YouTube Data API key: store as `YOUTUBE_API_KEY` on the server only.
- AI provider key: store as `AI_PROVIDER_API_KEY` on the server only.
- Email provider / SMTP: required when enabling production email verification and notifications.
- Official KTU curriculum and timetable documents: must be collected, matched to scheme/branch/semester, and reviewed before publication.

## Current limitations

- Onboarding and manually added subjects currently save in this browser's local storage; they are not account-synced.
- The study planner is a transparent prototype with example dates/subjects; it is not a production exam timetable scheduler.
- AI chat is intentionally disabled until a server-side AI route, retrieval layer and approved source corpus exist.
- Study resources are intentionally not populated with unreviewed YouTube results.
- The SQL migrations create the database foundation and RLS policies, but have not been executed against your Supabase project yet.
- Build validation runs through GitHub Actions after a push. A passing workflow is required before treating a commit as deploy-ready.

## Safety and academic integrity

A missing timetable result is never proof that there are no exams. Keep source URLs, revision history, retrieval timestamps and verification state for every timetable. Only show academic resources after review.
