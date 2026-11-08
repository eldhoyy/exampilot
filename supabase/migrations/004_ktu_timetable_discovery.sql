-- KTU timetable discovery and revision tracking for every B.Tech branch/semester.
-- Timetables are shared by programme/scheme/semester; subject-code matching
-- connects the published papers to the student's branch curriculum.
create table if not exists public.timetable_discovery_candidates (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  programme_id uuid references public.programmes(id) on delete cascade,
  scheme_id uuid references public.academic_schemes(id) on delete set null,
  semester smallint check (semester between 1 and 12),
  exam_session text,
  notice_title text not null,
  notice_url text not null,
  document_url text,
  discovered_from_url text not null,
  published_at timestamptz,
  document_sha256 text,
  status text not null default 'discovered'
    check (status in ('discovered','downloaded','parsed','under_review','verified','rejected','superseded')),
  review_notes text,
  discovered_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (university_id, notice_url)
);

create index if not exists timetable_candidates_scope_idx
  on public.timetable_discovery_candidates(university_id, scheme_id, semester, published_at desc);
create index if not exists timetable_candidates_status_idx
  on public.timetable_discovery_candidates(status, discovered_at desc);

-- A verified source document may be imported only once. Revisions remain
-- separate records and are linked through exam_timetables.supersedes_id.
create unique index if not exists timetable_sources_document_sha_unique
  on public.timetable_sources(document_sha256)
  where document_sha256 is not null;

create index if not exists timetable_latest_verified_idx
  on public.exam_timetables(university_id, scheme_id, semester, created_at desc)
  where status = 'verified';

alter table public.timetable_discovery_candidates enable row level security;
-- Deliberately no anon/authenticated policies: candidates and review actions
-- are internal ingestion data. Only trusted server/service-role jobs may write.
