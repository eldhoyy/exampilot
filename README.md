# ExamPilot

**Study with direction.**

ExamPilot is a mobile-first academic planning workspace for university students. The first release is aimed at Kerala Technological University (KTU) B.Tech students.

## What works in the current beta

- Responsive Next.js dashboard and academic profile setup.
- Subject list: add, edit difficulty through remove/re-add, set exam date, and save on the current device.
- Study-plan generator using the student's entered subjects, exam dates, difficulty, daily study availability and focus/rest preferences.
- Existing subject entries are imported into the planner when they include an exam date.
- Study plan and subject list persist in the same browser using local storage.
- PWA manifest foundation.

## Important limitations — read before sharing

- This beta does **not** fetch or verify live KTU examination timetables. Students must enter dates from the latest official KTU notification and check revisions themselves.
- An unavailable search result must never be interpreted as “no exams”.
- KTU scheme/branch/semester syllabus and module data are not yet a complete verified catalogue.
- Subject preparation is provisionally estimated as five modules per subject in the planner.
- Study profiles and subjects are stored locally on the device. They do not sync across devices or accounts.
- The AI doubt solver is not connected to an AI provider and must not be advertised as an active AI service.
- Study-material pages are a verification placeholder; no YouTube links are currently certified as syllabus-matched.
- Break durations are included in the schedule display. Browser notifications and background alarms are not yet implemented.

## Local development

Requirements: Node.js 20.9 or later.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Environment variables

Supabase public environment variables are prepared in the project, but authenticated account sync is not yet implemented. Never commit service-role keys or other secrets.

## Data integrity principles

- Timetable entries must retain their source, retrieval time and revision history.
- Only official timetable notifications or explicitly user-entered dates should be used for planning.
- YouTube search results are candidates, not verified learning resources.
- AI answers should use the student's selected syllabus and approved academic sources, and clearly state uncertainty.

## License

All rights reserved unless a license is added by the repository owner.
