-- Store extracted PDF evidence for a human review step.
-- Extraction is not approval and never makes exam dates public.
alter table public.timetable_discovery_candidates
  add column if not exists extracted_text text,
  add column if not exists extracted_metadata jsonb,
  add column if not exists document_content_type text,
  add column if not exists parsed_at timestamptz;

create index if not exists timetable_candidates_review_idx
  on public.timetable_discovery_candidates(status, parsed_at desc);
