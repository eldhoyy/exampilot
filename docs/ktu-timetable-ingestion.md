# KTU timetable ingestion

ExamPilot supports KTU B.Tech timetable discovery across semesters 1–8 and the
2019/2024 schemes. Timetables are programme/scheme/semester scoped; subject
codes must be matched against a verified branch curriculum before events are
published.

## Source and evidence model

- KTU-issued timetable PDFs/notices are the authoritative examination records.
- The KTU timetable portal is checked when reachable:
  https://ktu.edu.in/exam/Timetable
- The crawler also checks the KTU Notes notifications index as a discovery and
  distribution source: https://ktunotes.in/notifications/
- KTU Notes is an independent publisher, not KTU. A PDF linked from it is only
  a candidate until its contents establish that it is a KTU-issued document.
- The crawler stores extracted PDF text, SHA-256, document metadata and a
  review status. Extraction is not verification and never creates exam events.
- A reviewer must confirm the KTU document number/issuer, publication date,
  exam session, scheme, semester, paper codes, dates, session times and any
  revised/cancelled notices. The PDF's semester and scheme must match the
  notice scope.
- Subject codes must match the verified branch catalogue. Unknown or ambiguous
  codes stay in review; they must not be guessed.
- A revised timetable is imported as a new version; the old version is marked
  superseded and linked using supersedes_id.
- Only verified timetable/source rows are visible to the student app.

## Enable scheduled discovery

Add these GitHub Actions repository secrets:

- SUPABASE_URL: project URL, e.g. https://<project-ref>.supabase.co
- SUPABASE_SERVICE_ROLE_KEY: Supabase service-role key (GitHub secret only;
  never put it in browser environment variables or commit it).

Run the workflow manually from GitHub → Actions → Discover KTU timetable
notices → Run workflow. It also runs every six hours and when the crawler
workflow/script changes on the main branch.

## Current limitations

The KTU official timetable portal may be temporarily unavailable. The crawler
continues with configured discovery publishers and logs source failures. It
currently extracts PDF text into a review packet; it does not automatically
approve notices, map all paper codes to all branches, or publish exam dates.
Scanned PDFs without selectable text require OCR/manual review.

A human verification/import step is required before dates can be used to
generate student plans. Discovery is not verification.
