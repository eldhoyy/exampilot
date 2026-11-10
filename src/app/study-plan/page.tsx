"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CalendarDays, Clock3, Coffee, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { buildStudyPlan, localDateISO, type Difficulty, type StudySubject } from "@/lib/planner";
import { getApprovedPapers } from "@/lib/approved-timetable";

type Profile = { name:string; university:string; programme:string; scheme:string; branch:string; semester:string };
type PlannerSubject = StudySubject & { code:string; verified:boolean; startsAt:string; sourceTitle?:string; sourceUrl?:string };

function remainingLabel(value:string) {
  const ms=new Date(value).getTime()-Date.now();
  if(ms<=0)return "Examination time has passed";
  const days=Math.floor(ms/86400000),hours=Math.floor((ms%86400000)/3600000),minutes=Math.floor((ms%3600000)/60000);
  return days>0?days+"d "+hours+"h "+minutes+"m remaining":hours>0?hours+"h "+minutes+"m remaining":minutes+"m remaining";
}
function localSubjectsFromStorage(saved:Record<string,Difficulty>):PlannerSubject[]{
  try{
    const rows=JSON.parse(localStorage.getItem("exampilot-subjects")||"[]") as Array<{id?:string;title?:string;code?:string;difficulty?:string;examDate?:string;modules?:number;verified?:boolean}>;
    return rows.filter(row=>Boolean(row.title&&row.examDate&&row.examDate.length===10))
      .map((row,index)=>{
        const id=row.id||"local-"+index;
        const level=(row.difficulty==="easy"||row.difficulty==="hard"||row.difficulty==="medium")?row.difficulty:(saved[id]||"medium");
        return {id,title:row.title||"Untitled subject",code:row.code||"Manual",examDate:row.examDate||"",startsAt:row.examDate+"T23:59:59",difficulty:level,modules:Math.max(1,Number(row.modules)||5),completedModules:0,verified:row.verified===true,sourceTitle:row.verified?"Verified curriculum":"Student-entered date"} as PlannerSubject;
      });
  }catch{return [];}
}
export default function StudyPlanPage() {
  const [profile,setProfile]=useState<Profile|null>(null);
  const [subjects,setSubjects]=useState<PlannerSubject[]>([]);
  const [difficulty,setDifficulty]=useState<Record<string,Difficulty>>({});
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
    const localFallback=localSubjectsFromStorage(saved);
    try {
      const approved=getApprovedPapers(p);
      const pdfUrls:Record<number,string>={3:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-timetable-of-b-tech-s3-r-s-examinations-november-20-1794048058.pdf",5:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-time-table-of-b-tech-s5-r-exam-november-2026-includ-1794048414.pdf",7:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-timetable-of-b-tech-s7-r-s-examinations-november-20-1794048779.pdf"};
      const fromPdf:PlannerSubject[]=approved.map(paper=>({id:paper.code,code:paper.code,title:paper.title,examDate:paper.date,startsAt:paper.date+"T"+paper.start+":00+05:30",difficulty:saved[paper.code]||"medium",modules:5,completedModules:0,verified:false,sourceTitle:"User-approved timetable PDF",sourceUrl:pdfUrls[Number(p.semester.replace(/\\D/g,""))]}));
      const combined=[...fromPdf,...localFallback.filter(local=>!fromPdf.some(item=>item.code===local.code))];
      setSubjects(combined);
      setError(fromPdf.length?"Using the timetable PDF you approved. Student-entered subjects are included when they do not duplicate a paper code.":localFallback.length?"No matching PDF papers were found for this branch. Showing your student-entered subjects and dates.":"No matching paper codes were found for this branch in the selected PDF.");
      setLastChecked(new Date().toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}));
      localStorage.setItem("exampilot-official-exams",JSON.stringify(fromPdf));
      return;
    } catch(e) {
      setSubjects(localFallback);
      setError(localFallback.length?"The timetable could not be loaded. Showing your student-entered exam dates.":(e instanceof Error?e.message:"Could not retrieve the verified university timetable. Please try again."));
    } finally {setLoading(false);setRefreshing(false);}
  }

  function setSubjectDifficulty(id:string,value:Difficulty) {
    const next={...difficulty,[id]:value};
    setDifficulty(next);
    localStorage.setItem("exampilot-difficulty",JSON.stringify(next));
    try{const local=JSON.parse(localStorage.getItem("exampilot-subjects")||"[]") as Array<{id:string;difficulty:string}>;localStorage.setItem("exampilot-subjects",JSON.stringify(local.map(item=>item.id===id?{...item,difficulty:value}:item)));}catch{}
    setSubjects(items=>items.map(s=>s.id===id?{...s,difficulty:value}:s));
  }

  const plan=useMemo(()=>buildStudyPlan(subjects,240,new Date(),50,10),[subjects]);
  const grouped=useMemo(()=>plan.reduce<Record<string,typeof plan>>((acc,s)=>{(acc[s.date] ||= []).push(s);return acc;},{}),[plan]);
  const upcoming=subjects.filter(s=>s.examDate>=localDateISO(new Date())).sort((a,b)=>a.examDate.localeCompare(b.examDate));

  return <main className="min-h-screen px-4 py-7 sm:px-8"><div className="mx-auto max-w-4xl">
    <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16}/> Dashboard</Link>
    <div className="mb-7"><p className="eyebrow mb-2">AUTOMATIC EXAM PLANNER</p><h1 className="text-3xl font-extrabold tracking-tight">Your study plan, built automatically.</h1><p className="mt-2 text-sm leading-6 text-slate-500">ExamPilot uses the timetable PDFs you approved. You can also plan with exam dates saved in My Subjects; student-entered dates are clearly labelled.</p></div>
    {profile&&<section className="panel mb-5 p-5"><div className="flex items-center gap-2"><Sparkles size={18} className="text-blue-600"/><h2 className="font-bold">Academic profile matched</h2></div><p className="mt-2 text-sm text-slate-600">{profile.university} · {profile.programme} · {profile.scheme} scheme · {profile.branch} · {profile.semester}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>Today: {new Date().toLocaleString("en-IN",{dateStyle:"full",timeStyle:"short"})}</span><button onClick={()=>profile&&loadOfficial(profile,difficulty,true)} disabled={refreshing} className="inline-flex items-center gap-2 font-bold text-blue-700"><RefreshCw size={14} className={refreshing?"animate-spin":""}/> Refresh approved timetable</button></div></section>}
    <section className="panel mb-5 p-5"><div className="flex items-center gap-2"><ShieldCheck size={19} className="text-emerald-600"/><h2 className="font-bold">Approved PDF examination timetable</h2></div>
      {loading&&<p className="mt-3 text-sm text-slate-500">Loading your approved PDF timetable and matching course codes…</p>}
      {error&&<p role="status" className="mt-3 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">{error} ExamPilot will not invent exam dates or substitute an unverified timetable.</p>}
      {!loading&&!error&&subjects.length===0&&<p className="mt-3 text-sm leading-6 text-slate-600">No upcoming examination dates were found for this profile.</p>}
      {lastChecked&&<p className="mt-2 text-xs text-slate-400">Loaded {lastChecked} · User-approved PDF timetable and labelled student-entered dates</p>}
      {upcoming.map(s=><div key={s.id} className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-100 p-3"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{s.code} · {s.title}</p><p className="text-xs text-slate-500">Exam: {new Date(s.examDate+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})} · {s.modules} study blocks</p><p className="mt-1 text-xs font-semibold text-blue-700">{remainingLabel(s.startsAt)}</p></div>{s.sourceUrl?<a href={s.sourceUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-emerald-700">{s.sourceTitle||"Source"}</a>:<span className="text-xs font-semibold text-amber-700">{s.sourceTitle||"Student-entered date"}</span>}</div>)}
    </section>
    {subjects.length>0&&<section className="panel mb-5 space-y-4 p-5"><div className="flex items-center gap-2"><BookOpen size={18} className="text-blue-600"/><h2 className="font-bold">Choose difficulty for each subject</h2></div><p className="text-sm text-slate-500">Choose how difficult each subject feels. PDF timetable papers are used directly; any manually entered dates remain clearly marked as student-entered.</p>
      {subjects.map(s=><div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{s.code} · {s.title}</p><p className="text-xs text-slate-400">Exam {s.examDate}</p></div><select aria-label={"Difficulty for "+s.title} value={difficulty[s.id]||"medium"} onChange={e=>setSubjectDifficulty(s.id,e.target.value as Difficulty)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>)}
    </section>}
    <section className="panel p-5"><div className="mb-4 flex items-center gap-2"><CalendarDays className="text-[#315efb]" size={18}/><h2 className="font-bold">Your automatically generated daily plan</h2></div>
      {!subjects.length?<p className="text-sm text-slate-500">Your plan will appear as soon as a verified official timetable is available for your semester.</p>:!plan.length?<p className="text-sm text-slate-500">No preparation sessions remain for the upcoming exam dates.</p>:<div className="space-y-5">{Object.entries(grouped).map(([date,sessions])=><div key={date}><div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#14213d]"><CalendarDays size={16} className="text-blue-600"/>{new Date(date+"T00:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"})}</div><div className="space-y-2">{sessions.map((s,i)=><div key={s.subjectId+"-"+i}><div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><div className="rounded-xl bg-blue-50 p-2 text-blue-600"><Clock3 size={17}/></div><div className="min-w-0 flex-1"><p className="text-sm font-bold">{s.subject}</p><p className="text-xs text-slate-400">{s.reason}</p></div><span className="whitespace-nowrap text-xs font-bold text-slate-600">{s.minutes} min</span></div>{i<sessions.length-1&&<div className="flex items-center gap-2 px-4 py-2 text-xs text-emerald-700"><Coffee size={14}/> Take a 10-minute rest break</div>}</div>)}</div></div>)}</div>}
      <p className="mt-5 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-900">ExamPilot uses your current local date and time, the PDF examination dates, and your difficulty choices to prioritize preparation. A 50-minute focus block is followed by a 10-minute rest. Recheck the official timetable for university revisions.</p>
    </section>
  </div></main>;
}
