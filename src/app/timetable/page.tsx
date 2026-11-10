"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, ExternalLink, ShieldCheck, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Profile = { university:string; programme:string; scheme:string; branch:string; semester:string };
type ExamEvent = { id:string; subject_id:string|null; subject_code:string; subject_title:string; starts_at:string; ends_at:string|null; exam_timetables?: { version_label:string|null; exam_session:string; timetable_sources?: { source_title:string|null; source_url:string }|null } };
type Subject = { id:string; subject_code:string; title:string };

const sources:Record<string,{scheme:string;url:string;label:string}> = {
  "3":{scheme:"2024",url:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-timetable-of-b-tech-s3-r-s-examinations-november-20-1794048058.pdf",label:"KTU Notes · S3 November 2026"},
  "5":{scheme:"2024",url:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-time-table-of-b-tech-s5-r-exam-november-2026-includ-1794048414.pdf",label:"KTU Notes · S5 November 2026"},
  "7":{scheme:"2019",url:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-timetable-of-b-tech-s7-r-s-examinations-november-20-1794048779.pdf",label:"KTU Notes · S7 November 2026"}
};

export default function TimetablePage(){
  const [profile,setProfile]=useState<Profile|null>(null);
  const [semester,setSemester]=useState("3");
  const [events,setEvents]=useState<ExamEvent[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [branchSubjects,setBranchSubjects]=useState<Subject[]>([]);
  const selected=sources[semester];

  useEffect(()=>{
    try {
      const p=JSON.parse(localStorage.getItem("exampilot-profile-draft")||"null") as Profile|null;
      if(p){setProfile(p);const s=String(p.semester).match(/\d+/)?.[0];if(s&&sources[s])setSemester(s);}
      else setError("Complete your academic profile to see your branch-specific timetable.");
    } catch {setError("Could not read your saved academic profile.");}
  },[]);

  useEffect(()=>{
    if(!profile)return;
    const currentProfile=profile;
    let active=true;
    async function load(){
      setLoading(true);setError("");setEvents([]);setBranchSubjects([]);
      try{
        const db=createClient();
        const year=Number(selected.scheme);
        const sem=Number(semester);
        const [{data:schemes,error:se},{data:programmes,error:pe}]=await Promise.all([
          db.from("academic_schemes").select("id").eq("scheme_year",year).eq("is_active",true),
          db.from("programmes").select("id").eq("short_name",currentProfile.programme)
        ]);
        if(se)throw se;if(pe)throw pe;
        const schemeId=schemes?.[0]?.id, programmeId=programmes?.[0]?.id;
        if(!schemeId||!programmeId)throw new Error("The selected scheme or programme is not in the academic catalogue yet.");
        const {data:branches,error:be}=await db.from("branches").select("id").eq("programme_id",programmeId).eq("name",currentProfile.branch);
        if(be)throw be;
        const branchId=branches?.[0]?.id;
        if(!branchId)throw new Error("This branch has not yet been added to the verified curriculum catalogue.");
        const {data:subjects,error:su}=await db.from("subjects").select("id,subject_code,title").eq("scheme_id",schemeId).eq("branch_id",branchId).eq("semester",sem).eq("verification_status","verified").order("subject_code");
        if(su)throw su;
        if(active)setBranchSubjects((subjects||[]) as Subject[]);
        if(!subjects?.length){if(active)setError("No verified subject catalogue exists for this exact branch, scheme and semester. No dates will be guessed.");return;}
        const {data:rows,error:ee}=await db.from("exam_events").select("id,subject_id,subject_code,subject_title,starts_at,ends_at,exam_timetables!inner(version_label,exam_session,scheme_id,programme_id,semester,status,timetable_sources!inner(source_title,source_url,verification_status))").eq("exam_timetables.status","verified").eq("exam_timetables.scheme_id",schemeId).eq("exam_timetables.programme_id",programmeId).eq("exam_timetables.semester",sem).eq("exam_timetables.timetable_sources.verification_status","verified").order("starts_at");
        if(ee)throw ee;
        const subjectIds=new Set((subjects||[]).map((s:Subject)=>s.id));
        const matched=(rows||[] as ExamEvent[]).filter((e:ExamEvent)=>Boolean(e.subject_id&&subjectIds.has(e.subject_id)));
        if(active){setEvents(matched);if(!matched.length)setError("The source notice is available, but verified branch-specific paper-code/date records have not been imported yet.");}
      }catch(e){if(active)setError(e instanceof Error?e.message:"Could not load the verified timetable.");}
      finally{if(active)setLoading(false);}
    }
    void load();
    return ()=>{active=false;};
  },[profile,semester,selected.scheme]);

  const source=selected;
  const subjectMap=useMemo(()=>new Map(branchSubjects.map(s=>[s.id,s])),[branchSubjects]);
  return <main className="min-h-screen px-4 py-7 sm:px-8"><div className="mx-auto max-w-4xl">
    <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16}/> Dashboard</Link>
    <p className="eyebrow mb-2">KTU · B.TECH · NOVEMBER 2026</p><h1 className="text-3xl font-extrabold">Examination timetable</h1>
    <p className="mt-2 text-sm text-slate-500">Showing only verified papers matched to your exact branch, scheme and semester.</p>
    {profile&&<p className="mt-3 text-sm font-semibold text-slate-600">{profile.programme} · {profile.scheme} Scheme · {profile.branch}</p>}
    <div className="mt-5 flex flex-wrap gap-2">{["3","5","7"].map(value=><button key={value} onClick={()=>setSemester(value)} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${semester===value?"bg-[#315efb] text-white":"border border-slate-200"}`}>Semester {value}</button>)}</div>
    <section className="panel mt-5 p-5"><div className="flex items-center gap-2 text-blue-700"><ShieldCheck size={18}/><b className="text-sm">Verified branch timetable</b></div>
      <h2 className="mt-3 text-xl font-extrabold">B.Tech S{semester} · {selected.scheme} Scheme</h2>
      {loading&&<p className="mt-4 text-sm text-slate-500">Checking verified subject codes and exam dates…</p>}
      {!loading&&events.length>0&&<div className="mt-5 divide-y divide-slate-100">{events.map(event=>{const subject=event.subject_id?subjectMap.get(event.subject_id):undefined;return <div key={event.id} className="flex items-start gap-3 py-4"><CalendarDays className="mt-1 shrink-0 text-blue-600"/><div className="min-w-0 flex-1"><p className="text-sm font-bold">{event.subject_code} · {subject?.title||event.subject_title}</p><p className="mt-1 text-sm text-slate-600">{new Date(event.starts_at).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Kolkata"})}</p><p className="text-xs text-slate-500">{new Date(event.starts_at).toLocaleTimeString("en-IN",{hour:"numeric",minute:"2-digit",timeZone:"Asia/Kolkata"})}{event.ends_at?" – "+new Date(event.ends_at).toLocaleTimeString("en-IN",{hour:"numeric",minute:"2-digit",timeZone:"Asia/Kolkata"}):""}</p></div></div>})}</div>}
      {!loading&&!events.length&&<div className="mt-5 rounded-xl border border-dashed border-slate-200 p-5"><p className="text-sm font-bold">Branch-wise paper dates are not verified in ExamPilot yet.</p><p className="mt-1 text-sm leading-6 text-slate-500">The timetable PDF is available, but dates will appear here only after each paper code is matched to the verified subject catalogue for this branch.</p></div>}
      {error&&<p role="status" className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"><AlertTriangle size={16} className="mt-0.5 shrink-0"/>{error}</p>}
      <a href={source.url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700">Open source timetable PDF <ExternalLink size={15}/></a>
    </section>
    <p className="mt-4 text-xs leading-5 text-slate-500">Source document: {source.label}. Exam dates are shown only when verified database records match the selected branch and scheme. Check for later revisions.</p>
    <Link href="/study-plan" className="mt-5 inline-flex rounded-xl bg-[#14213d] px-4 py-3 text-sm font-bold text-white">Open my connected study plan →</Link>
  </div></main>;
}
