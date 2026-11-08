-- Public read access for verified KTU curriculum and timetable data.
-- These records are public university information; student-owned tables remain private.
create policy "Public can read universities"
  on public.universities for select to anon, authenticated using (true);
create policy "Public can read schemes"
  on public.academic_schemes for select to anon, authenticated using (true);
create policy "Public can read programmes"
  on public.programmes for select to anon, authenticated using (true);
create policy "Public can read branches"
  on public.branches for select to anon, authenticated using (true);
create policy "Public can read verified subjects"
  on public.subjects for select to anon, authenticated using (verification_status = 'verified');
create policy "Public can read modules for verified subjects"
  on public.subject_modules for select to anon, authenticated using (
    exists (select 1 from public.subjects s
      where s.id = subject_id and s.verification_status = 'verified')
  );
create policy "Public can read verified timetable sources"
  on public.timetable_sources for select to anon, authenticated using (verification_status = 'verified');
create policy "Public can read verified timetables"
  on public.exam_timetables for select to anon, authenticated using (status = 'verified');
create policy "Public can read events from verified timetables"
  on public.exam_events for select to anon, authenticated using (
    exists (select 1 from public.exam_timetables t
      where t.id = timetable_id and t.status = 'verified')
  );
