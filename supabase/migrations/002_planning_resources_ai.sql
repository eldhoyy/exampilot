-- ExamPilot planning, resources and AI knowledge tables.
create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'My study plan',
  starts_on date,
  ends_on date,
  daily_study_minutes integer not null default 240 check (daily_study_minutes between 30 and 900),
  status text not null default 'draft' check (status in ('draft','active','paused','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id),
  title text not null,
  task_date date not null,
  duration_minutes integer not null check (duration_minutes between 5 and 600),
  task_type text not null default 'study' check (task_type in ('study','revision','practice','break')),
  status text not null default 'pending' check (status in ('pending','completed','skipped','rescheduled')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.study_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id),
  task_id uuid references public.study_tasks(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz,
  minutes_studied integer check (minutes_studied is null or minutes_studied >= 0),
  notes text,
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create table if not exists public.study_resources (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references public.subjects(id) on delete cascade,
  module_id uuid references public.subject_modules(id) on delete cascade,
  title text not null,
  description text,
  resource_type text not null check (resource_type in ('video','notes','pdf','question_paper','reference')),
  resource_url text not null,
  platform text,
  video_id text,
  channel_name text,
  language text,
  academic_year text,
  topic text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','under_review','approved','rejected','needs_recheck')),
  verification_notes text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.resource_reports (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.study_resources(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New study doubt',
  subject_id uuid references public.subjects(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  source_references jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references public.subjects(id) on delete cascade,
  title text not null,
  source_url text,
  storage_path text,
  document_type text not null default 'syllabus',
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(document_id, chunk_index)
);

create index if not exists study_tasks_user_date_idx on public.study_tasks(user_id, task_date);
create index if not exists study_logs_user_started_idx on public.study_logs(user_id, started_at desc);
create index if not exists study_resources_subject_status_idx on public.study_resources(subject_id, verification_status);
create index if not exists ai_messages_conversation_created_idx on public.ai_messages(conversation_id, created_at);

alter table public.study_plans enable row level security;
alter table public.study_tasks enable row level security;
alter table public.study_logs enable row level security;
alter table public.study_resources enable row level security;
alter table public.resource_reports enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;

create policy "Users manage own study plans" on public.study_plans
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own study tasks" on public.study_tasks
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own study logs" on public.study_logs
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Read approved study resources" on public.study_resources
for select to authenticated using (verification_status = 'approved');
create policy "Users submit own resource reports" on public.resource_reports
for insert to authenticated with check (auth.uid() = user_id);
create policy "Users read own resource reports" on public.resource_reports
for select to authenticated using (auth.uid() = user_id);
create policy "Users manage own AI conversations" on public.ai_conversations
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own AI messages" on public.ai_messages
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Read verified knowledge documents" on public.knowledge_documents
for select to authenticated using (verification_status = 'verified');
create policy "Read chunks from verified documents" on public.knowledge_chunks
for select to authenticated using (
  exists (select 1 from public.knowledge_documents d
    where d.id = document_id and d.verification_status = 'verified')
);

-- No client-side insert/update policy is granted for academic resources or
-- knowledge documents: trusted review/import jobs must approve them server-side.
