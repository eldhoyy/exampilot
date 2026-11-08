-- Public read-only access for published academic data. Student records remain private.
do $$
declare t text;
begin
 foreach t in array array['universities','academic_schemes','programmes','branches'] loop
  execute format('drop policy if exists "Public read %s catalogue" on public.%I',t,t);
  execute format('create policy "Public read %s catalogue" on public.%I for select to anon, authenticated using (true)',t,t);
 end loop;
end $$;
drop policy if exists "Public read verified subjects" on public.subjects;
create policy "Public read verified subjects" on public.subjects for select to anon, authenticated using (verification_status='verified');
drop policy if exists "Public read modules for verified subjects" on public.subject_modules;
create policy "Public read modules for verified subjects" on public.subject_modules for select to anon, authenticated using (exists(select 1 from public.subjects s where s.id=subject_id and s.verification_status='verified'));
drop policy if exists "Public read verified timetable sources" on public.timetable_sources;
create policy "Public read verified timetable sources" on public.timetable_sources for select to anon, authenticated using (verification_status='verified');
drop policy if exists "Public read verified timetables" on public.exam_timetables;
create policy "Public read verified timetables" on public.exam_timetables for select to anon, authenticated using (status='verified');
drop policy if exists "Public read verified exam events" on public.exam_events;
create policy "Public read verified exam events" on public.exam_events for select to anon, authenticated using (exists(select 1 from public.exam_timetables t where t.id=timetable_id and t.status='verified'));
drop policy if exists "Public read approved study resources" on public.study_resources;
create policy "Public read approved study resources" on public.study_resources for select to anon, authenticated using (verification_status='approved');
drop policy if exists "Public read verified knowledge documents" on public.knowledge_documents;
create policy "Public read verified knowledge documents" on public.knowledge_documents for select to anon, authenticated using (verification_status='verified');
drop policy if exists "Public read chunks from verified documents" on public.knowledge_chunks;
create policy "Public read chunks from verified documents" on public.knowledge_chunks for select to anon, authenticated using (exists(select 1 from public.knowledge_documents d where d.id=document_id and d.verification_status='verified'));
-- No anon write policy: publishing remains a trusted review/import operation.
