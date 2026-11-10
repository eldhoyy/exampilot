"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, ExternalLink, Search } from "lucide-react";
import { getApprovedPapers, getApprovedElectiveGroups } from "@/lib/approved-timetable";

type Profile = { university:string; programme:string; scheme:string; branch:string; semester:string };
const sources:Record<string,{scheme:string;url:string;label:string}> = {
 "3":{scheme:"2024",url:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-timetable-of-b-tech-s3-r-s-examinations-november-20-1794048058.pdf",label:"S3 November 2026 PDF"},
 "5":{scheme:"2024",url:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-time-table-of-b-tech-s5-r-exam-november-2026-includ-1794048414.pdf",label:"S5 November 2026 PDF"},
 "7":{scheme:"2019",url:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-timetable-of-b-tech-s7-r-s-examinations-november-20-1794048779.pdf",label:"S7 November 2026 PDF"}
};
export default function TimetablePage(){
 const [profile,setProfile]=useState<Profile|null>(null);
 const [semester,setSemester]=useState("3");
 const [query,setQuery]=useState("");
 const [selectedElectives,setSelectedElectives]=useState<Record<string,string>>({});
 useEffect(()=>{try{const p=JSON.parse(localStorage.getItem("exampilot-profile-draft")||"null") as Profile|null;if(p){setProfile(p);const s=String(p.semester).match(/\d+/)?.[0];if(s&&sources[s])setSemester(s);}setSelectedElectives(JSON.parse(localStorage.getItem("exampilot-selected-electives")||"{}") as Record<string,string>);}catch{}},[]);
 const activeProfile=profile?{...profile,semester,scheme:sources[semester]?.scheme||profile.scheme}:null;
 const papers=useMemo(()=>activeProfile?getApprovedPapers(activeProfile):[],[activeProfile]);
 const visible=papers.filter(p=>(p.code+" "+p.title).toLowerCase().includes(query.toLowerCase()));
 const electiveGroups=useMemo(()=>activeProfile?getApprovedElectiveGroups(activeProfile):[],[activeProfile]);
 const visibleElectiveGroups=electiveGroups.map(group=>({...group,papers:group.papers.filter(p=>(p.code+" "+p.title).toLowerCase().includes(query.toLowerCase()))})).filter(group=>group.papers.length>0);
 const source=sources[semester];
 function saveElective(slot:string,code:string){
  const next={...selectedElectives,[semester+"-"+slot]:code};
  setSelectedElectives(next);
  localStorage.setItem("exampilot-selected-electives",JSON.stringify(next));
  const current=JSON.parse(localStorage.getItem("exampilot-subjects")||"[]") as Array<Record<string,unknown>>;
  const currentOptionCodes=electiveGroups.flatMap(group=>group.papers.map(p=>p.code));
  const without=current.filter(item=>!currentOptionCodes.includes(String(item.code||"")));
  const selectedRows=electiveGroups.flatMap(group=>{
   const selected=next[semester+"-"+group.slot];
   const paper=group.papers.find(item=>item.code===selected);
   return paper?[{id:paper.code,code:paper.code,title:paper.title,examDate:paper.date,difficulty:"medium",modules:5,verified:false,sourceTitle:"Selected from approved timetable PDF"}]:[];
  });
  localStorage.setItem("exampilot-subjects",JSON.stringify([...without,...selectedRows]));
 }
 return <main className="min-h-screen px-4 py-7 sm:px-8"><div className="mx-auto max-w-4xl">
  <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16}/> Dashboard</Link>
  <p className="eyebrow mb-2">KTU · B.TECH · NOVEMBER 2026</p><h1 className="text-3xl font-extrabold">Examination timetable</h1>
  {profile&&<p className="mt-2 text-sm text-slate-500">{profile.university} · {profile.branch} · {sources[semester].scheme} Scheme</p>}
  <div className="mt-5 flex flex-wrap gap-2">{["3","5","7"].map(s=><button key={s} onClick={()=>setSemester(s)} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${semester===s?"bg-[#315efb] text-white":"border border-slate-200"}`}>Semester {s}</button>)}</div>
  <section className="panel mt-5 p-5"><div className="flex items-center gap-2"><CalendarDays className="text-blue-600" size={18}/><h2 className="font-bold">Papers for your selected branch</h2></div>
   <p className="mt-2 text-sm text-slate-500">Dates and paper details are taken from the PDFs you approved. These records are used directly; no Supabase curriculum verification is required.</p>
   <div className="relative mt-4"><Search size={16} className="absolute left-3 top-3.5 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search subject code or title" className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-3 text-sm"/></div>
   <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">{visible.length} papers found</p>
   <div className="mt-2 divide-y divide-slate-100">{visible.map(p=><div key={p.code} className="flex flex-wrap items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{p.code} · {p.title}</p><p className="mt-1 text-xs text-slate-500">Slot {p.slot} · {new Date(p.date+"T00:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short",year:"numeric"})}</p></div><span className="text-xs font-semibold text-slate-600">{p.start}–{p.end}</span></div>)}</div>
   {!visible.length&&<p className="py-6 text-sm text-amber-800">{profile?"No paper matched this branch name. You can still open the complete PDF below.":"Complete your academic profile to filter the timetable."}</p>}
   <a href={source.url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700">Open original {source.label} <ExternalLink size={15}/></a>
  </section>
  {visibleElectiveGroups.length>0&&<section className="panel mt-5 p-5"><div className="flex items-center gap-2"><CalendarDays className="text-amber-600" size={18}/><h2 className="font-bold">Choose your registered elective papers</h2></div><p className="mt-2 text-sm leading-6 text-slate-500">These are elective options, not all compulsory papers. Choose only the paper registered by your college for each listed slot. Your choices are saved into the study plan.</p>{visibleElectiveGroups.map(group=><div key={group.slot} className="mt-4 border-t border-slate-100 pt-3"><div className="mb-2 flex items-center justify-between gap-2"><p className="text-sm font-bold">Elective slot {group.slot}</p><span className="text-xs text-slate-500">{group.papers.length} options shown</span></div><div className="divide-y divide-slate-100">{group.papers.map(p=><div key={p.code} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{p.code} · {p.title}</p><p className="mt-1 text-xs text-slate-500">{new Date(p.date+"T00:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short",year:"numeric"})} · {p.start}–{p.end}</p></div><button onClick={()=>saveElective(group.slot,p.code)} className={"rounded-lg px-3 py-2 text-xs font-bold "+(selectedElectives[semester+"-"+group.slot]===p.code?"bg-emerald-100 text-emerald-800":"bg-[#315efb] text-white")}>{selectedElectives[semester+"-"+group.slot]===p.code?"Selected":"Choose"}</button></div>)}</div></div>)}<p className="mt-3 text-xs text-slate-500">Unselected elective slots are left out of the study plan rather than being scheduled as compulsory exams.</p></section>}
  <Link href="/study-plan" className="mt-5 inline-flex rounded-xl bg-[#14213d] px-4 py-3 text-sm font-bold text-white">Open my connected study plan →</Link>
 </div></main>;
}
