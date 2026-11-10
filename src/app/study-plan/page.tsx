"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CalendarDays, Coffee, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import StudyTracker from "@/components/study-tracker";
import { buildStudyPlan, localDateISO, type Difficulty, type StudySubject } from "@/lib/planner";
import { getApprovedPapers } from "@/lib/approved-timetable";
import topicData from "@/data/important-topics.json";

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
    const rows=JSON.parse(localStorage.getItem("exampilot-subjects")||"[]") as Array<{id?:string;title?:string;code?:string;difficulty?:string;examDate?:string;modules?:number;verified?:boolean;sourceTitle?:string}>;
    return rows.filter(row=>Boolean(row.title&&row.examDate&&row.examDate.length===10))
      .map((row,index)=>{
        const id=row.id||"local-"+index;
        const level=(row.difficulty==="easy"||row.difficulty==="hard"||row.difficulty==="medium")?row.difficulty:(saved[id]||"medium");
        return {id,title:row.title||"Untitled subject",code:row.code||"Manual",examDate:row.examDate||"",startsAt:row.examDate+"T23:59:59",difficulty:level,modules:Math.max(1,Number(row.modules)||5),completedModules:0,verified:row.verified===true,sourceTitle:row.sourceTitle|| (row.verified?"Verified curriculum":"Student-entered date")} as PlannerSubject;
      });
  }catch{return [];}
}
export default function StudyPlanPage() {
  const [profile,setProfile]=useState<Profile|null>(null);
  const [subjects,setSubjects]=useState<PlannerSubject[]>([]);
  const [difficulty,setDifficulty]=useState<Record<string,Difficulty>>({});
  const [excludedCodes,setExcludedCodes]=useState<string[]>([]);
   const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [error,setError]=useState("");
  const [lastChecked,setLastChecked]=useState("");
  const [startDate,setStartDate]=useState(localDateISO(new Date()));

  useEffect(()=>{const saved=localStorage.getItem("exampilot-plan-start-date");if(saved && /^\d{4}-\d{2}-\d{2}$/.test(saved))setStartDate(saved);},[]);
  function changeStartDate(value:string){setStartDate(value);localStorage.setItem("exampilot-plan-start-date",value);}

  useEffect(()=> {
    try {
      const p=JSON.parse(localStorage.getItem("exampilot-profile-draft")||"null") as Profile|null;
      if(!p){setError("Complete your academic profile first.");setLoading(false);return;}
      setProfile(p);
      const saved=JSON.parse(localStorage.getItem("exampilot-difficulty")||"{}") as Record<string,Difficulty>;
      setDifficulty(saved);
      const savedExclusions=JSON.parse(localStorage.getItem("exampilot-excluded-subjects")||"[]") as string[];
      const syllabusExclusions=savedExclusions.filter(code=>code==="UCHUT346"||code==="UCHUT347");
      setExcludedCodes(syllabusExclusions);
      localStorage.setItem("exampilot-excluded-subjects",JSON.stringify(syllabusExclusions));
      void loadOfficial(p,saved);
    } catch {setError("Could not read your saved academic profile.");setLoading(false);}
  },[]);

  async function loadOfficial(p:Profile, saved:Record<string,Difficulty>, isRefresh=false) {
    if(isRefresh)setRefreshing(true);else setLoading(true);
    setError("");
    const localFallback=localSubjectsFromStorage(saved);
    try {
      const excluded: string[]=(JSON.parse(localStorage.getItem("exampilot-excluded-subjects")||"[]") as string[]).filter((code:string)=>code==="UCHUT346"||code==="UCHUT347");
      const approved=getApprovedPapers(p).filter(paper=>!excluded.includes(paper.code));
      const pdfUrls:Record<number,string>={3:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-timetable-of-b-tech-s3-r-s-examinations-november-20-1794048058.pdf",5:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-time-table-of-b-tech-s5-r-exam-november-2026-includ-1794048414.pdf",7:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-timetable-of-b-tech-s7-r-s-examinations-november-20-1794048779.pdf"};
      const fromPdf:PlannerSubject[]=approved.map(paper=>({id:paper.code,code:paper.code,title:paper.title,examDate:paper.date,startsAt:paper.date+"T"+paper.start+":00+05:30",difficulty:saved[paper.code]||"medium",modules:5,completedModules:0,verified:false,sourceTitle:"User-approved timetable PDF",sourceUrl:pdfUrls[Number(p.semester.replace(/\\D/g,""))]}));
      const combined=[...fromPdf,...localFallback.filter(local=>!excluded.includes(local.code)&&!fromPdf.some(item=>item.code===local.code))];
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

  const syllabusChoiceCodes=["UCHUT346","UCHUT347"];
  function toggleSyllabusChoice(code:string){
    if(!syllabusChoiceCodes.includes(code))return;
    const next=excludedCodes.includes(code)?excludedCodes.filter(item=>item!==code):[...excludedCodes,code];
    setExcludedCodes(next);
    localStorage.setItem("exampilot-excluded-subjects",JSON.stringify(next));
    if(profile) void loadOfficial(profile,difficulty,true);
  }

  function setSubjectDifficulty(id:string,value:Difficulty) {
    const next={...difficulty,[id]:value};
    setDifficulty(next);
    localStorage.setItem("exampilot-difficulty",JSON.stringify(next));
    try{const local=JSON.parse(localStorage.getItem("exampilot-subjects")||"[]") as Array<{id:string;difficulty:string}>;localStorage.setItem("exampilot-subjects",JSON.stringify(local.map(item=>item.id===id?{...item,difficulty:value}:item)));}catch{}
    setSubjects(items=>items.map(s=>s.id===id?{...s,difficulty:value}:s));
  }

  const plan=useMemo(()=>buildStudyPlan(subjects,240,new Date(startDate+"T00:00:00"),50,10),[subjects,startDate]);
  const grouped=useMemo(()=>plan.reduce<Record<string,typeof plan>>((acc,s)=>{(acc[s.date] ||= []).push(s);return acc;},{}),[plan]);
  const upcoming=subjects.filter(s=>s.examDate>=localDateISO(new Date())).sort((a,b)=>a.examDate.localeCompare(b.examDate));

  return <main className="min-h-screen px-4 py-7 sm:px-8"><div className="mx-auto max-w-4xl">
    <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16}/> Dashboard</Link>
    <div className="mb-7"><p className="eyebrow mb-2">AUTOMATIC EXAM PLANNER</p><h1 className="text-3xl font-extrabold tracking-tight">Your study plan, built automatically.</h1><p className="mt-2 text-sm leading-6 text-slate-500">ExamPilot uses the timetable PDFs you approved. You can also plan with exam dates saved in My Subjects; student-entered dates are clearly labelled.</p></div>
    {profile&&<section className="panel mb-5 p-5"><div className="flex items-center gap-2"><Sparkles size={18} className="text-[var(--accent)]"/><h2 className="font-bold">Academic profile matched</h2></div><p className="mt-2 text-sm text-slate-600">{profile.university} · {profile.programme} · {profile.scheme} scheme · {profile.branch} · {profile.semester}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>Today: {new Date().toLocaleString("en-IN",{dateStyle:"full",timeStyle:"short"})}</span><button onClick={()=>profile&&loadOfficial(profile,difficulty,true)} disabled={refreshing} className="inline-flex items-center gap-2 font-bold text-[var(--accent)]"><RefreshCw size={14} className={refreshing?"animate-spin":""}/> Refresh approved timetable</button></div></section>}
    <section className="panel mb-5 p-5"><div className="flex items-center gap-2"><ShieldCheck size={19} className="text-[var(--accent)]"/><h2 className="font-bold">Approved PDF examination timetable</h2></div>
      {loading&&<p className="mt-3 text-sm text-slate-500">Loading your approved PDF timetable and matching course codes…</p>}
      {error&&<p role="status" className="mt-3 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">{error} ExamPilot will not invent exam dates or substitute an unverified timetable.</p>}
      {!loading&&!error&&subjects.length===0&&<p className="mt-3 text-sm leading-6 text-slate-600">No upcoming examination dates were found for this profile.</p>}
      {lastChecked&&<p className="mt-2 text-xs text-slate-400">Loaded {lastChecked} · User-approved PDF timetable and labelled student-entered dates</p>}
      {getApprovedPapers(profile||{branch:"",semester:"",scheme:""}).filter(paper=>syllabusChoiceCodes.includes(paper.code)).map(paper=><div key={"syllabus-"+paper.code} className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{paper.code} · {paper.title}</p><p className="text-xs text-slate-500">Slot {paper.slot} · {paper.date} · Alternative subject</p></div><button type="button" onClick={()=>toggleSyllabusChoice(paper.code)} className={"rounded-lg px-3 py-2 text-xs font-bold "+(excludedCodes.includes(paper.code)?"bg-slate-100 text-slate-600":"bg-[var(--surface-muted)] text-[var(--accent)]")}>{excludedCodes.includes(paper.code)?"Not in my syllabus · Add":"In my syllabus · Change"}</button></div>)}
      {upcoming.map(s=><div key={s.id} className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-100 p-3"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{s.code} · {s.title}</p><p className="text-xs text-slate-500">Exam: {new Date(s.examDate+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})} · {s.modules} study blocks</p><p className="mt-1 text-xs font-semibold text-[var(--accent)]">{remainingLabel(s.startsAt)}</p></div>{s.sourceUrl?<a href={s.sourceUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[var(--accent)]">{s.sourceTitle||"Source"}</a>:<span className="text-xs font-semibold text-amber-700">{s.sourceTitle||"Student-entered date"}</span>}</div>)}
    </section>
    {subjects.length>0&&<section className="panel mb-5 space-y-4 p-5"><div className="flex items-center gap-2"><BookOpen size={18} className="text-[var(--accent)]"/><h2 className="font-bold">Choose difficulty for each subject</h2></div><p className="text-sm text-slate-500">Choose how difficult each subject feels. PDF timetable papers are used directly; any manually entered dates remain clearly marked as student-entered.</p>
      {subjects.map(s=><div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{s.code} · {s.title}</p><p className="text-xs text-slate-400">Exam {s.examDate}</p></div><select aria-label={"Difficulty for "+s.title} value={difficulty[s.id]||"medium"} onChange={e=>setSubjectDifficulty(s.id,e.target.value as Difficulty)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>)}
    </section>}
    {subjects.length>0&&<section className="panel mb-5 p-5">
      <div className="mb-2 flex items-center gap-2"><Sparkles size={18} className="text-amber-500"/><h2 className="font-bold">Important topics to concentrate on</h2></div>
      <p className="mb-4 text-sm leading-6 text-slate-500">Where previous papers are available, topics are ranked using repeated question evidence. Where they are not, the guide lists every syllabus module without inventing frequency-based priorities.</p>
      <div className="space-y-3">{subjects.map(s=>{const analysis=topicData[s.code as keyof typeof topicData];return <details key={s.code} className="rounded-xl border border-slate-200 bg-white p-3"><summary className="cursor-pointer list-none"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-bold">{s.code} · {s.title}</p><p className="text-xs text-slate-500">{analysis?(analysis.papers>0?analysis.papers+" previous question paper(s) analysed":"Syllabus-based checklist · no PYQ frequency claimed"):"No verified question-paper analysis available yet"}</p></div><span className={"rounded-full px-2.5 py-1 text-[11px] font-bold "+(analysis?"bg-amber-50 text-amber-800":"bg-slate-100 text-slate-600")}>{analysis?"Topic guide":"Analysis pending"}</span></div></summary>{analysis?<><p className="mt-3 text-xs leading-5 text-slate-500">{analysis.evidence}</p><div className="mt-3 space-y-2">{analysis.topics.map(topic=><div key={topic.module+"-"+topic.name} className="rounded-lg bg-slate-50 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-800">M{topic.module} · {topic.name}</p><span className={"rounded-md px-2 py-1 text-[10px] font-bold "+(topic.priority==="High"?"bg-rose-50 text-rose-700":"bg-amber-50 text-amber-800")}>{topic.priority} priority</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{topic.evidence}</p></div>)}</div></>:<p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">This subject is included in your timetable and study plan, but ExamPilot does not yet have enough verified previous question papers and the matching module syllabus to publish reliable important topics. Upload or add those source documents to complete this analysis. Do not treat a guessed topic list as exam guidance.</p>}</details>})}</div>
      <p className="mt-4 rounded-lg bg-[var(--surface-muted)] p-3 text-xs leading-5 text-blue-900">Question-paper trends are shown only when source papers exist. Syllabus-based checklists are not frequency rankings. Always cover the full syllabus.</p>
    </section>}
    {subjects.length>0&&<section className="panel mb-5 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow mb-1">PLAN SETTINGS</p><h2 className="font-bold">Choose when your preparation begins</h2><p className="mt-1 text-sm text-slate-500">Your daily schedule will be generated from this date.</p></div><label className="text-sm font-semibold text-slate-700">Start date<input type="date" value={startDate} min={localDateISO(new Date())} max={subjects.length?subjects.reduce((m,s)=>s.examDate<m?s.examDate:m,subjects[0].examDate):undefined} onChange={e=>changeStartDate(e.target.value)} className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2.5"/></label></div></section>}
    <StudyTracker />
    {subjects.length>0&&<section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="panel p-4"><p className="text-xs font-semibold text-slate-500">Upcoming exams</p><p className="mt-1 text-2xl font-extrabold">{upcoming.length}</p><p className="text-xs text-slate-400">In your semester</p></div>
      <div className="panel p-4"><p className="text-xs font-semibold text-slate-500">Study sessions</p><p className="mt-1 text-2xl font-extrabold">{plan.length}</p><p className="text-xs text-slate-400">Planned focus blocks</p></div>
      <div className="panel p-4"><p className="text-xs font-semibold text-slate-500">Study time</p><p className="mt-1 text-2xl font-extrabold">{Math.round(plan.reduce((n,s)=>n+s.minutes,0)/60*10)/10}h</p><p className="text-xs text-slate-400">Total scheduled</p></div>
      <div className="panel p-4"><p className="text-xs font-semibold text-slate-500">Daily target</p><p className="mt-1 text-2xl font-extrabold">4h</p><p className="text-xs text-slate-400">50 min focus blocks</p></div>
    </section>}
    <section className="panel p-4 sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><CalendarDays className="text-[var(--accent)]" size={19}/><div><h2 className="font-bold">Daily study schedule</h2><p className="text-xs text-slate-500">Your preparation, arranged day by day</p></div></div><span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold text-[var(--accent)]">50 min study · 10 min rest</span></div>
      {!subjects.length?<p className="py-5 text-sm text-slate-500">Your study plan will appear when matching timetable papers are available for your branch and semester.</p>:!plan.length?<p className="py-5 text-sm text-slate-500">No preparation sessions remain for the upcoming exam dates.</p>:<div className="space-y-4">{Object.entries(grouped).map(([date,sessions])=>{const isToday=date===localDateISO(new Date());const total=sessions.reduce((n,s)=>n+s.minutes,0);return <article key={date} className={`overflow-hidden rounded-2xl border ${isToday?"border-blue-200 bg-[var(--surface-muted)]/40":"border-slate-200 bg-white"}`}><div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3"><div className="flex items-center gap-2"><div className="rounded-xl bg-white p-2 text-[var(--accent)] shadow-sm"><CalendarDays size={17}/></div><div><p className="text-sm font-extrabold text-[var(--ink)]">{new Date(date+"T00:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</p><p className="text-xs text-slate-500">{sessions.length} focus sessions · {Math.floor(total/60)>0?Math.floor(total/60)+"h ":""}{total%60?total%60+" min":""} planned</p></div></div>{isToday&&<span className="rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white">TODAY</span>}</div><div className="space-y-0 px-4 py-1">{sessions.map((s,i)=><div key={s.subjectId+"-"+i} className="flex gap-3 py-3"><div className="flex flex-col items-center"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xs font-extrabold text-[var(--accent)]">{i+1}</div>{i<sessions.length-1&&<div className="mt-1 h-full min-h-5 w-px bg-slate-200"/>}</div><div className="min-w-0 flex-1 pb-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-slate-800">{s.subject}</p><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{s.minutes} min</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{s.reason}</p>{i<sessions.length-1&&<div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--surface-muted)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--accent)]"><Coffee size={13}/> 10-minute rest break</div>}</div></div>)}</div></article>})}</div>}
      <div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-700">How to follow this plan</p><p className="mt-1 text-xs leading-5 text-slate-500">Complete one focus session at a time. Take a 10-minute rest between sessions. Subjects with closer exams and higher difficulty are prioritized. No sessions are scheduled on an exam date.</p></div>
    </section>
  </div></main>;
}
