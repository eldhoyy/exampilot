"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CalendarDays, Clock3, Coffee, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buildStudyPlan, localDateISO, type Difficulty, type StudySubject } from "@/lib/planner";

type Profile = { name:string; university:string; programme:string; scheme:string; branch:string; semester:string };
type ExamRow = { id:string; subject_code:string; subject_title:string; starts_at:string; exam_timetables?:{version_label:string|null; timetable_sources?:{source_title:string|null;source_url:string}|null} };
type PlannerSubject = StudySubject & { code:string; verified:boolean; sourceTitle?:string; sourceUrl?:string };

export default function StudyPlanPage() {
  const [profile,setProfile]=useState<Profile|null>(null);
  const [subjects,setSubjects]=useState<PlannerSubject[]>([]);
  const [difficulty,setDifficulty]=useState<Record<string,Difficulty>>({});
  const [dailyHours,setDailyHours]=useState(4);
  const [focusMinutes,setFocusMinutes]=useState(50);
  const [breakMinutes,setBreakMinutes]=useState(10);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [error,setError]=useState("");
  const [lastChecked,setLastChecked]=useState("");

  useEffect(()=> {
    try {
      const p=JSON.parse(localStorage.getItem("exampilot-profile-draft")||"null") as Profile|null;
      if(!p){setError("Complete your academic profile first.");setLoading(false);return;}
      setProfile(p);
      const saved=JSON.parse(localStorage.getItem("exampilot-difficulty")||"{}") as Record<string,Difficulty>;
      setDifficulty(saved);
      void loadOfficial(p,saved);
    } catch {setError("Could not read your saved academic profile.");setLoading(false);}
  },[]);

  async function loadOfficial(p:Profile, saved:Record<string,Difficulty>, isRefresh=false) {
    if(isRefresh)setRefreshing(true);else setLoading(true);
    setError("");
    try {
      const db=createClient();
      const year=Number(p.scheme);
      const semester=Number(p.semester.replace(/\\D/g,""));
      const [{data:schemes,error:schemeError},{data:programmes,error:programmeError}]=await Promise.all([
        db.from("academic_schemes").select("id").eq("scheme_year",year).eq("is_active",true),
        db.from("programmes").select("id").eq("short_name",p.programme),
      ]);
      if(schemeError)throw schemeError;
      if(programmeError)throw programmeError;
      const schemeId=schemes?.[0]?.id;
      const programmeId=programmes?.[0]?.id;
      if(!schemeId||!programmeId) {setSubjects([]);setError("No matching official curriculum catalogue is available for this academic profile yet.");return;}
      const {data:branches,error:branchError}=await db.from("branches").select("id").eq("programme_id",programmeId).eq("name",p.branch);
      if(branchError)throw branchError;
      const branchId=branches?.[0]?.id;
      if(!branchId){setSubjects([]);setError("The official curriculum for this branch has not been published in ExamPilot yet.");return;}

      const [{data:catalogue,error:catalogueError},{data:events,error:eventsError}]=await Promise.all([
        db.from("subjects").select("id,subject_code,title,subject_modules(id,module_number,title)").eq("scheme_id",schemeId).eq("branch_id",branchId).eq("semester",semester).eq("verification_status","verified"),
        db.from("exam_events").select("id,subject_code,subject_title,starts_at,exam_timetables!inner(version_label,scheme_id,semester,status,timetable_sources!inner(source_title,source_url,verification_status))").eq("exam_timetables.status","verified").eq("exam_timetables.scheme_id",schemeId).eq("exam_timetables.semester",semester).eq("exam_timetables.timetable_sources.verification_status","verified").order("starts_at"),
      ]);
      if(catalogueError)throw catalogueError;
      if(eventsError)throw eventsError;
      const today=localDateISO(new Date());
      const official=(events||[] as ExamRow[]).filter((e:ExamRow)=>e.starts_at.slice(0,10)>=today);
      const next=official.map((e:ExamRow)=>{
        const match=(catalogue||[]).find((s:{subject_code:string})=>s.subject_code===e.subject_code);
        const id=match?.id||e.id;
        return {
          id,title:e.subject_title,code:e.subject_code,examDate:e.starts_at.slice(0,10),
          difficulty:saved[id]||"medium",modules:Math.max(1,match?.subject_modules?.length||5),
          completedModules:0,verified:true,
          sourceTitle:e.exam_timetables?.timetable_sources?.source_title||"Official KTU timetable",
          sourceUrl:e.exam_timetables?.timetable_sources?.source_url||"https://ktu.edu.in/exam/Timetable",
        } as PlannerSubject;
      });
      const unique=next.filter((s,i,a)=>a.findIndex(x=>x.code===s.code)===i);
      setSubjects(unique);
      setLastChecked(new Date().toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}));
      localStorage.setItem("exampilot-official-exams",JSON.stringify(unique));
    } catch(e) {
      setError(e instanceof Error?e.message:"Could not retrieve the verified university timetable. Please try again.");
      setSubjects([]);
    } finally {setLoading(false);setRefreshing(false);}
  }

  function setSubjectDifficulty(id:string,value:Difficulty) {
    const next={...difficulty,[id]:value};
    setDifficulty(next);
    localStorage.setItem("exampilot-difficulty",JSON.stringify(next));
    setSubjects(items=>items.map(s=>s.id===id?{...s,difficulty:value}:s));
  }

  const plan=useMemo(()=>buildStudyPlan(subjects,dailyHours*60,new Date(),focusMinutes,breakMinutes),[subjects,dailyHours,focusMinutes,breakMinutes]);
  const grouped=useMemo(()=>plan.reduce<Record<string,typeof plan>>((acc,s)=>{(acc[s.date] ||= []).push(s);return acc;},{}),[plan]);
  const upcoming=subjects.filter(s=>s.examDate>=localDateISO(new Date())).sort((a,b)=>a.examDate.localeCompare(b.examDate));

  return <main className="min-h-screen px-4 py-7 sm:px-8"><div className="mx-auto max-w-4xl">
    <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16}/> Dashboard</Link>
    <div className="mb-7"><p className="eyebrow mb-2">AUTOMATIC EXAM PLANNER</p><h1 className="text-3xl font-extrabold tracking-tight">Your study plan, built automatically.</h1><p className="mt-2 text-sm leading-6 text-slate-500">ExamPilot checks the verified timetable for your university, scheme, branch and semester, then plans backwards from each examination.</p></div>
    {profile&&<section className="panel mb-5 p-5"><div className="flex items-center gap-2"><Sparkles size={18} className="text-blue-600"/><h2 className="font-bold">Academic profile matched</h2></div><p className="mt-2 text-sm text-slate-600">{profile.university} · {profile.programme} · {profile.scheme} scheme · {profile.branch} · {profile.semester}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>Today: {new Date().toLocaleString("en-IN",{dateStyle:"full",timeStyle:"short"})}</span><button onClick={()=>profile&&loadOfficial(profile,difficulty,true)} disabled={refreshing} className="inline-flex items-center gap-2 font-bold text-blue-700"><RefreshCw size={14} className={refreshing?"animate-spin":""}/> Refresh official timetable</button></div></section>}
    <section className="panel mb-5 p-5"><div className="flex items-center gap-2"><ShieldCheck size={19} className="text-emerald-600"/><h2 className="font-bold">Official examination timetable</h2></div>
      {loading&&<p className="mt-3 text-sm text-slate-500">Checking the university's verified timetable and matching your semester…</p>}
      {error&&<p role="status" className="mt-3 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">{error} ExamPilot will not invent exam dates or substitute an unverified timetable.</p>}
      {!loading&&!error&&subjects.length===0&&<p className="mt-3 text-sm leading-6 text-slate-600">No upcoming verified examination dates were found for this exact profile. The timetable needs to be published and verified before a reliable date-based plan can be generated.</p>}
      {lastChecked&&<p className="mt-2 text-xs text-slate-400">Last checked {lastChecked} · Official records only</p>}
      {upcoming.map(s=><div key={s.id} className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-100 p-3"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{s.code} · {s.title}</p><p className="text-xs text-slate-500">Exam: {new Date(s.examDate+"T00:00:00").toLocaleDateString("en-IN",{dateStyle:"full"})} · {s.modules} study blocks</p></div><a href={s.sourceUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-emerald-700">{s.sourceTitle}</a></div>)}
    </section>
    {subjects.length>0&&<section className="panel mb-5 space-y-4 p-5"><div className="flex items-center gap-2"><BookOpen size={18} className="text-blue-600"/><h2 className="font-bold">Choose difficulty for each subject</h2></div><p className="text-sm text-slate-500">This is the only subject information ExamPilot needs from you. Exam dates and subject names come from the verified timetable.</p>
      {subjects.map(s=><div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{s.code} · {s.title}</p><p className="text-xs text-slate-400">Exam {s.examDate}</p></div><select aria-label={"Difficulty for "+s.title} value={difficulty[s.id]||"medium"} onChange={e=>setSubjectDifficulty(s.id,e.target.value as Difficulty)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>)}
    </section>}
    <section className="panel mb-5 grid gap-5 p-5 sm:grid-cols-3">
      <div><label className="block text-sm font-bold">Study time per day: {dailyHours}h</label><input aria-label="Study hours per day" className="mt-3 w-full accent-[#315efb]" type="range" min="1" max="10" value={dailyHours} onChange={e=>setDailyHours(Number(e.target.value))}/></div>
      <div><label className="block text-sm font-bold">Focus session: {focusMinutes} min</label><input aria-label="Focus session minutes" className="mt-3 w-full accent-[#315efb]" type="range" min="25" max="90" step="5" value={focusMinutes} onChange={e=>setFocusMinutes(Number(e.target.value))}/></div>
      <div><label className="block text-sm font-bold">Rest break: {breakMinutes} min</label><input aria-label="Rest break minutes" className="mt-3 w-full accent-[#315efb]" type="range" min="5" max="30" step="5" value={breakMinutes} onChange={e=>setBreakMinutes(Number(e.target.value))}/></div>
    </section>
    <section className="panel p-5"><div className="mb-4 flex items-center gap-2"><CalendarDays className="text-[#315efb]" size={18}/><h2 className="font-bold">Your automatically generated daily plan</h2></div>
      {!subjects.length?<p className="text-sm text-slate-500">Your plan will appear as soon as a verified official timetable is available for your semester.</p>:!plan.length?<p className="text-sm text-slate-500">No preparation sessions remain for the upcoming exam dates.</p>:<div className="space-y-5">{Object.entries(grouped).map(([date,sessions])=><div key={date}><div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#14213d]"><CalendarDays size={16} className="text-blue-600"/>{new Date(date+"T00:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"})}</div><div className="space-y-2">{sessions.map((s,i)=><div key={s.subjectId+"-"+i}><div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><div className="rounded-xl bg-blue-50 p-2 text-blue-600"><Clock3 size={17}/></div><div className="min-w-0 flex-1"><p className="text-sm font-bold">{s.subject}</p><p className="text-xs text-slate-400">{s.reason}</p></div><span className="whitespace-nowrap text-xs font-bold text-slate-600">{s.minutes} min</span></div>{i<sessions.length-1&&<div className="flex items-center gap-2 px-4 py-2 text-xs text-emerald-700"><Coffee size={14}/> Rest for {breakMinutes} minutes</div>}</div>)}</div></div>)}</div>}
      <p className="mt-5 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-900">Plan is calculated from today's local date and current time. Subject difficulty changes the preparation priority. Recheck the official timetable for university revisions.</p>
    </section>
  </div></main>;
}
