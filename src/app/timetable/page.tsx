"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ExternalLink, CalendarDays, ShieldCheck, AlertTriangle, FileText } from "lucide-react";

type Slot={date:string;day:string;slot:string;session:string};
type SemesterData={scheme:string;source:string;slots:Slot[];note:string;status:"dates"|"document-only"};
const data:Record<string,SemesterData>={
"3":{
scheme:"2024",
source:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-timetable-of-b-tech-s3-r-s-examinations-november-20-1794048058.pdf",
status:"dates",
slots:[
{date:"24 Nov 2026",day:"Tuesday",slot:"A",session:"1:30 PM – 4:00 PM"},
{date:"26 Nov 2026",day:"Thursday",slot:"B",session:"1:30 PM – 4:00 PM"},
{date:"30 Nov 2026",day:"Monday",slot:"C",session:"1:30 PM – 4:00 PM"},
{date:"2 Dec 2026",day:"Wednesday",slot:"D",session:"1:30 PM – 4:00 PM"},
{date:"5 Dec 2026",day:"Saturday",slot:"F",session:"1:30 PM – 4:00 PM"},
{date:"8 Dec 2026",day:"Tuesday",slot:"G",session:"1:30 PM – 4:00 PM"}
],
note:"These are semester-wide slots, not a branch-specific subject list. Open the PDF and match your exact subject code and branch. This page must not be used to infer that every branch has a paper in every slot."
},
"5":{
scheme:"2024",
source:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-time-table-of-b-tech-s5-r-exam-november-2026-includ-1794048414.pdf",
status:"document-only",
slots:[],
note:"The timetable notice was discovered and its PDF extracted for review, but ExamPilot has not completed reliable branch-wise paper-code mapping. Open the source PDF and check your exact branch and subject code."
},
"7":{
scheme:"2019",
source:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-timetable-of-b-tech-s7-r-s-examinations-november-20-1794048779.pdf",
status:"document-only",
slots:[],
note:"The timetable notice was discovered and its PDF extracted for review, but ExamPilot has not completed reliable branch-wise paper-code mapping. Open the source PDF and check your exact branch and subject code."
}
};
export default function TimetablePage(){
const [semester,setSemester]=useState("3");const selected=data[semester];
return <main className="min-h-screen px-4 py-7 sm:px-8"><div className="mx-auto max-w-4xl">
<Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16}/> Dashboard</Link>
<p className="eyebrow mb-2">KTU · B.TECH · NOVEMBER 2026</p><h1 className="text-3xl font-extrabold">Examination timetable</h1>
<p className="mt-2 text-sm text-slate-500">Choose a semester to view the timetable evidence currently checked by ExamPilot.</p>
<div className="mt-5 flex flex-wrap gap-2">{["3","5","7"].map(value=><button key={value} onClick={()=>setSemester(value)} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${semester===value?"bg-[#315efb] text-white":"border border-slate-200"}`}>Semester {value}</button>)}</div>
<section className="panel mt-5 p-5"><div className="flex items-center gap-2 text-blue-700"><ShieldCheck size={18}/><b className="text-sm">{selected.status==="dates"?"Semester slot dates extracted":"Source document found · mapping pending"}</b></div>
<h2 className="mt-3 text-xl font-extrabold">B.Tech S{semester} · {selected.scheme} Scheme</h2>
{selected.slots.length>0?<div className="mt-5 divide-y divide-slate-100">{selected.slots.map(item=><div key={item.date+item.slot} className="flex items-center gap-3 py-3"><CalendarDays className="shrink-0 text-blue-600"/><div className="min-w-0 flex-1"><p className="text-sm font-bold">{item.date} · {item.day}</p><p className="text-xs text-slate-500">Slot {item.slot} · {item.session}</p></div></div>)}</div>:<div className="mt-5 rounded-xl border border-dashed border-slate-200 p-5"><FileText className="mb-2 text-blue-600"/><p className="text-sm font-bold">Branch-wise dates are not published in ExamPilot yet.</p><p className="mt-1 text-sm leading-6 text-slate-500">We will show individual subject dates only after the PDF paper codes have been checked against the matching branch and scheme.</p></div>}
<div className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"><AlertTriangle size={16} className="mt-0.5 shrink-0"/><p>{selected.note}</p></div>
<a href={selected.source} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700">Open detailed timetable PDF <ExternalLink size={15}/></a>
</section>
<p className="mt-4 text-xs leading-5 text-slate-500">Source: KTU Notes, an independent academic publisher distributing the timetable PDF. ExamPilot does not use search snippets or AI guesses as exam-date evidence. Check for later revisions before your examination.</p>
</div></main>;
}
