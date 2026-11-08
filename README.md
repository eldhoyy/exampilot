# ExamPilot

**Study with direction.**

ExamPilot is a mobile-first academic planning workspace for university students. The first release is being developed with Kerala Technological University (KTU) B.Tech students in mind, with an architecture intended to support additional universities later.

## Current status

The first frontend foundation is in place:
- Next.js App Router + TypeScript
- Responsive dashboard layout
- Minimal white, navy and blue visual system
- Initial workspace navigation and dashboard sections
- PWA manifest foundation

The dashboard currently uses placeholder states. It does **not** claim to have imported official KTU syllabi, verified exam timetables, or connected AI services yet.

## Planned development

1. Academic profile and KTU curriculum catalogue
2. Official timetable discovery, revision tracking and manual upload
3. Subject difficulty and syllabus progress
4. Deterministic study planner with breaks and rescheduling
5. Verified study materials and YouTube references
6. Syllabus-grounded AI doubt solver
7. Supabase authentication, database, storage and row-level security
8. PWA installation, notifications and deployment hardening

## Local development

Requirements: Node.js 20.9 or later.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Environment variables

Copy `.env.example` to `.env.local` when the Supabase integration is added. Never commit real API keys or secrets.

## Data integrity principles

- An unavailable timetable source must never be presented as proof that there are no exams.
- Timetable entries must retain their source, retrieval time and revision history.
- YouTube search results are candidates, not verified learning resources.
- Only reviewed resources should be shown as approved.
- AI answers should use the student's selected syllabus and approved academic sources, and clearly state uncertainty.

## License

All rights reserved unless a license is added by the repository owner.
