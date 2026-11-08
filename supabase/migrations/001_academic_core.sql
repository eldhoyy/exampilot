-- ExamPilot academic core (Supabase PostgreSQL)
-- Apply in the Supabase SQL editor after creating a project.
create extension if not exists pgcrypto;

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  short_name text not null,
  country text not null default 'India',
  website_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.academic_schemes (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  name text not null,
  scheme_year integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (university_id, name)
);

create table if not exists public.programmes (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  name text not null,
  short_name text not null,
  created_at timestamptz not null default now(),
  unique (university_id, short_name)
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz not null default now(),
  unique (programme_id, name)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  scheme_id uuid not null references public.academic_schemes(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  semester smallint not null check (semester between 1 and 12),
  subject_code text not null,
  title text not null,
  category text,
  credits numeric(4,1),
  source_document_url text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (scheme_id, branch_id, semester, subject_code)
);

create table if not exists public.subject_modules (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  module_number smallint not null check (module_number > 0),
  title text not null,
  topics jsonb not null default '[]'::jsonb,
  source_page text,
  created_at timestamptz not null default now(),
  unique (subject_id, module_number)
);

create table if not exists public.student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  university_id uuid references public.universities(id),
  programme_id uuid references public.programmes(id),
  scheme_id uuid references public.academic_schemes(id),
  branch_id uuid references public.branches(id),
  current_semester smallint check (current_semester between 1 and 12),
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_subject_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  confidence smallint check (confidence between 1 and 5),
  notes text,
  updated_at timestamptz not null default now(),
  unique (user_id, subject_id)
);

create table if not exists public.timetable_sources (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  source_url text not null,
  source_title text,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  document_sha256 text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected','superseded')),
  verified_by uuid references auth.users(id),
  verification_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.exam_timetables (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id),
  scheme_id uuid references public.academic_schemes(id),
  programme_id uuid references public.programmes(id),
  semester smallint not null check (semester between 1 and 12),
  exam_session text not null,
  version_label text,
  source_id uuid references public.timetable_sources(id),
  status text not null default 'pending'
    check (status in ('pending','verified','rejected','superseded')),
  supersedes_id uuid references public.exam_timetables(id),
  created_at timestamptz not null default now()
);

create table if not exists public.exam_events (
  id uuid primary key default gen_random_uuid(),
  timetable_id uuid not null references public.exam_timetables(id) on delete cascade,
  subject_id uuid references public.subjects(id),
  subject_code text not null,
  subject_title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create index if not exists subjects_lookup_idx
  on public.subjects (scheme_id, branch_id, semester);
create index if not exists exam_events_date_idx
  on public.exam_events (starts_at);
create index if not exists exam_timetables_scope_idx
  on public.exam_timetables (university_id, scheme_id, semester, status);

-- Student-owned records are private. Curriculum and timetable reads are
-- restricted to verified records; writes are reserved for trusted service/admin roles.
alter table public.student_profiles enable row level security;
alter table public.student_subject_settings enable row level security;
alter table public.universities enable row level security;
alter table public.academic_schemes enable row level security;
alter table public.programmes enable row level security;
alter table public.branches enable row level security;
alter table public.subjects enable row level security;
alter table public.subject_modules enable row level security;
alter table public.timetable_sources enable row level security;
alter table public.exam_timetables enable row level security;
alter table public.exam_events enable row level security;

create policy "Students can read own profile"
  on public.student_profiles for select to authenticated
  using (auth.uid() = user_id);
create policy "Students can create own profile"
  on public.student_profiles for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Students can update own profile"
  on public.student_profiles for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Students manage own subject settings"
  on public.student_subject_settings for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Authenticated users read universities"
  on public.universities for select to authenticated using (true);
create policy "Authenticated users read schemes"
  on public.academic_schemes for select to authenticated using (true);
create policy "Authenticated users read programmes"
  on public.programmes for select to authenticated using (true);
create policy "Authenticated users read branches"
  on public.branches for select to authenticated using (true);
create policy "Authenticated users read verified subjects"
  on public.subjects for select to authenticated using (verification_status = 'verified');
create policy "Authenticated users read modules for verified subjects"
  on public.subject_modules for select to authenticated using (
    exists (select 1 from public.subjects s
      where s.id = subject_id and s.verification_status = 'verified')
  );
create policy "Authenticated users read verified timetable sources"
  on public.timetable_sources for select to authenticated using (verification_status = 'verified');
create policy "Authenticated users read verified timetables"
  on public.exam_timetables for select to authenticated using (status = 'verified');
create policy "Authenticated users read events from verified timetables"
  on public.exam_events for select to authenticated using (
    exists (select 1 from public.exam_timetables t
      where t.id = timetable_id and t.status = 'verified')
  );

-- Seed the initial university/programme/scheme catalogue. Branches and
-- syllabus records are added only after their official source is checked.
insert into public.universities (name, short_name, website_url)
values ('APJ Abdul Kalam Technological University', 'KTU', 'https://ktu.edu.in/')
on conflict (name) do nothing;

insert into public.academic_schemes (university_id, name, scheme_year)
select id, '2024 Scheme', 2024 from public.universities where short_name = 'KTU'
on conflict (university_id, name) do nothing;

insert into public.academic_schemes (university_id, name, scheme_year)
select id, '2019 Scheme', 2019 from public.universities where short_name = 'KTU'
on conflict (university_id, name) do nothing;

insert into public.programmes (university_id, name, short_name)
select id, 'Bachelor of Technology', 'B.Tech'
from public.universities where short_name = 'KTU'
on conflict (university_id, short_name) do nothing;
