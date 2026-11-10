# ExamPilot Admin Dashboard setup

The admin username is fixed as `admin@exampilot.com`. It is a login name only; it does not need to be a real mailbox and no email is sent.

## 1. Apply the database migration

In Supabase Dashboard → SQL Editor, run the complete file:

`supabase/migrations/006_private_usage_analytics.sql`

This creates a private usage-events table. RLS is enabled and no browser-role policies are created.

## 2. Add Vercel environment variables

In Vercel → Project → Settings → Environment Variables, add these for Production (and Preview if you want preview deployments to support admin):

- `ADMIN_PASSWORD`: choose a long, unique password (at least 16 characters).
- `ADMIN_SESSION_SECRET`: a random secret of at least 32 characters.
- `SUPABASE_SERVICE_ROLE_KEY`: the project's service-role key. Keep it server-side only; never use a `NEXT_PUBLIC_` prefix.

The project also needs its existing `NEXT_PUBLIC_SUPABASE_URL` setting. Do not paste secrets into GitHub files, source code, chat, or screenshots.

Generate a session secret with a password manager or a secure random generator. Do not reuse the admin password as the session secret.

## 3. Deploy

Redeploy the project after adding the environment variables. The admin login is at `/admin/login`; the dashboard is at `/admin`.

Username: `admin@exampilot.com`

The password is the value you set in Vercel as `ADMIN_PASSWORD`.

## Tracking behavior and limits

Students do not need to create accounts or verify email. The tracker uses a random ID stored in that browser and reads the name/branch/semester from the existing local onboarding profile, if present. It records feature/page visits and timestamps only—not passwords, notes, or AI chat content.

This means the dashboard identifies a browser, not a verified person. Clearing browser storage or using another device/browser creates a different visitor. A visitor who never fills in an academic profile appears as anonymous. Do not describe these as verified individual student accounts.

Display a clear privacy notice before enabling this tracking for public visitors.
