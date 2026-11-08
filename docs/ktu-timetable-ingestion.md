# KTU timetable ingestion

ExamPilot supports KTU B.Tech timetable discovery across semesters 1–8 and the
2019/2024 schemes. Timetables are generally programme/scheme/semester scoped;
the subject code is matched to each student's branch catalogue.

## Safety model

1. The KTU examination timetable portal is the authority:
   https://ktu.edu.in/exam/Timetable
2. Discovery only creates rows in `timetable_discovery_candidates` with status
   `discovered`. It never creates exam events or marks anything verified.
3. A reviewer must inspect the actual university-issued notice/PDF, confirm
   publication date, exam session, scheme, semester, paper codes, dates and
   session times, and record the document SHA-256.
4. A revised timetable must be imported as a new version; the old version is
   marked `superseded` and linked using `supersedes_id`.
5. Only verified timetable/source rows are visible to the student app.

## Enable scheduled discovery

Add these GitHub Actions repository secrets:

- `SUPABASE_URL`: project URL, e.g. `https://<project-ref>.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role key (GitHub secret only;
  never put it in browser environment variables or commit it).

Run the workflow manually once from **GitHub → Actions → Discover KTU timetable
notices → Run workflow**. It repeats every six hours.

## Important current limitation

KTU's timetable page is JavaScript-rendered. If it does not expose static
notice links to the crawler, the workflow reports that no links were found and
does not fall back to unofficial dates. A future browser-backed crawler or
university feed integration is needed to discover all dynamically loaded
notices. A human verification/import step is still required before dates can
be used to generate student plans.
