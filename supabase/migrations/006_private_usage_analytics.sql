-- Minimal, privacy-conscious feature usage analytics for ExamPilot.
-- Access is performed only by trusted server routes using the service-role key.
create table if not exists public.usage_events (
  id bigint generated always as identity primary key,
  visitor_id uuid not null,
  display_name text,
  branch text,
  semester text,
  feature text not null check (feature in ('home','study_plan','timetable','study_materials','ai_tutor','subjects','onboarding')),
  path text,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_visitor_created_idx
  on public.usage_events (visitor_id, created_at desc);
create index if not exists usage_events_created_idx
  on public.usage_events (created_at desc);

alter table public.usage_events enable row level security;
-- Intentionally no anon/authenticated policies: browser clients cannot read or write analytics.
revoke all on public.usage_events from anon, authenticated;
grant all on public.usage_events to service_role;
