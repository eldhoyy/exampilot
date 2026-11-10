# ExamPilot

A mobile-first exam planner for KTU B.Tech students: subjects, exam dates and a study plan in one place.

## Why I built this

I'm a mechanical engineering student in Kerala. Keeping track of KTU notices, subject lists and what to revise next can get messy, especially when exams are close. I started ExamPilot to put those everyday student tasks in one practical place, without pretending that unverified dates or guessed study advice are official.

## Features

- Save your academic profile, branch, semester and scheme.
- Add subjects from the verified curriculum catalogue or enter them manually.
- Keep verified curriculum/timetable sources distinct from student-entered dates.
- Generate a daily study schedule from saved subjects and exam dates.
- Run focus and rest timers and keep a local study-session history.
- Review topic guides where previous-paper evidence is available.
- Browse approved KTU timetable records and study materials.
- Installable PWA manifest, responsive mobile navigation and light/dark themes.
- Optional, consent-based feature analytics and a protected admin dashboard.

## Screenshots

Add current product screenshots to `docs/screenshots/` and link them here:

- `docs/screenshots/dashboard.png`
- `docs/screenshots/study-plan.png`
- `docs/screenshots/mobile.png`

## Tech stack

Next.js 15 App Router · React 19 · TypeScript · Tailwind CSS v4 · lucide-react · Supabase.

## Run locally

Requirements: Node.js 20.9 or later.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

For production checks:

```bash
npm run lint
npm run build
```

## Limitations

- Subjects, profile and study history are stored in the current browser; they do not sync across devices.
- Timetable records are shown only when included in the trusted/approved source data. Student-entered dates remain visibly unverified; always check the official KTU notice for revisions.
- An empty timetable result does not mean KTU has no examination.
- Subject preparation is provisionally estimated from the saved module count.
- The doubt-solver route is a coming-soon placeholder, not a connected AI service.
- Browser notifications and background alarms are not implemented.
- Login and analytics IP limits currently use an in-memory best-effort fallback; use shared rate limiting before high-traffic production use.

## Data integrity

- Preserve source documents, dates and revision context for timetable entries.
- Never promote student-entered dates to verified timetable records.
- Previous-paper topic evidence is a revision aid, not a prediction; students should cover the full syllabus.
- Unapproved YouTube/resource candidates must not be presented as verified learning material.

## License

MIT is a suitable option if the repository owner wants to permit reuse. Add an MIT `LICENSE` file before describing this repository as MIT-licensed.
