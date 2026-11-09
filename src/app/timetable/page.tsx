"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ExternalLink, CalendarDays, ShieldCheck, AlertTriangle } from "lucide-react";

type Slot={date:string;day:string;slot:string;time:string;papers:string[]};
type SemesterData={scheme:string;source:string;publisher:string;slots:Slot[];note:string;secondary?:string};
const data:Record<string,SemesterData>={
"3":{
scheme:"2024",publisher:"KTU Notes · detailed PDF published 7 Nov 2026",
source:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-timetable-of-b-tech-s3-r-s-examinations-november-20-1794048058.pdf",
slots:[
{date:"24 Nov 2026",day:"Tuesday",slot:"A",time:"1:30 PM – 4:00 PM",papers:["GYMAT301 · Mathematics for Physical Science-3 / Electrical Science-3"]},
{date:"26 Nov 2026",day:"Thursday",slot:"B",time:"1:30 PM – 4:00 PM",papers:["PCMET302 · Mechanics of Solids"]},
{date:"30 Nov 2026",day:"Monday",slot:"C",time:"1:30 PM – 4:00 PM",papers:["PCMET303 · Fluid Mechanics and Machinery"]},
{date:"2 Dec 2026",day:"Wednesday",slot:"D",time:"1:30 PM – 4:00 PM",papers:["PBMET304 · Manufacturing Processes"]},
{date:"5 Dec 2026",day:"Saturday",slot:"F",time:"1:30 PM – 4:00 PM",papers:["GNEST305 · Introduction to Artificial Intelligence and Data Science"]},
{date:"8 Dec 2026",day:"Tuesday",slot:"G",time:"1:30 PM – 4:00 PM",papers:["UCHUT346 · Economics for Engineers / UCHUT347 · Engineering Ethics and Sustainable Development (check your registered course)"]}
],
note:"Mechanical paper codes are shown where identifiable in the detailed PDF. Other branches have different course codes in the same slot groups. The PDF lists slots A, B, C, D, F and G; an extra 10 Dec slot shown by some calendar pages is not included because it is absent from this detailed PDF."
},
"5":{
scheme:"2024",publisher:"KTU Notes · detailed PDF published 7 Nov 2026",
source:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-time-table-of-b-tech-s5-r-exam-november-2026-includ-1794048414.pdf",
slots:[
{date:"23 Nov 2026",day:"Monday",slot:"A",time:"1:30 PM – 4:00 PM",papers:["PCMET501 · Dynamics of Machinery"]},
{date:"27 Nov 2026",day:"Friday",slot:"B",time:"2:00 PM – 4:30 PM",papers:["PCMET502 · Advanced Manufacturing Engineering"]},
{date:"1 Dec 2026",day:"Tuesday",slot:"C",time:"1:30 PM – 4:00 PM",papers:["PCMET503 · Heat and Mass Transfer"]},
{date:"3 Dec 2026",day:"Thursday",slot:"D",time:"1:30 PM – 4:00 PM",papers:["PBMET504 · Management for Engineers"]},
{date:"7 Dec 2026",day:"Monday",slot:"E",time:"1:30 PM – 4:00 PM",papers:["Mechanical elective options: PEMET521 Computational Fluid Dynamics · PEMET522 Design for Manufacture and Assembly · PEMET523 Computer Aided Design and Analysis · PEMET524 Additive Manufacturing · PEMET525 Instrumentation and Control Systems · PEMET526 Energy Economics and Policy · PEMET527 Human Resources Management · PEMET528 Operations Research"]}
],
note:"Dates and times above are taken from the linked detailed PDF. A secondary calendar lists additional S5 slots on 9 Dec and 5 Jan, but those entries are not present in this detailed PDF, so they are not presented here as confirmed subject exams."
},
"7":{
scheme:"2019",publisher:"KTU Notes · detailed PDF published 7 Nov 2026",
source:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-timetable-of-b-tech-s7-r-s-examinations-november-20-1794048779.pdf",
secondary:"https://entri.app/blog/ktu-exam-timetable/",
slots:[
{date:"23 Nov 2026",day:"Monday",slot:"A",time:"9:30 AM – 12:30 PM",papers:["MET401 · Design of Machine Elements"]},
{date:"25 Nov 2026",day:"Wednesday",slot:"B",time:"9:30 AM – 12:30 PM",papers:["MET413 · Advanced Methods in Nondestructive Testing · MET423 · Optimization Techniques and Applications · MET443 · Aerospace Engineering · MET453 · Hybrid and Electric Vehicles · MET463 · Operations Management · MET473 · Air Conditioning and Refrigeration"]},
{date:"27 Nov 2026",day:"Friday",slot:"C",time:"9:30 AM – 12:30 PM",papers:["MET415 · Introduction to Business Analytics · MET425 · Quantitative Techniques for Engineers · MET435 · Automotive Technology · MET445 · Renewable Energy Engineering · MET455 · Quality Engineering and Management"]},
{date:"2 Dec 2026",day:"Wednesday",slot:"D",time:"9:30 AM – 12:30 PM",papers:["MCN401 · Industrial Safety Engineering"]}
],
note:"The detailed PDF's course table shows slots A, B, C and D. Entri's consolidated 2019-scheme calendar lists additional S7 dates/slot labels (30 Nov, 2 Dec and 4 Dec) that do not align with this PDF. This page therefore shows only entries explicitly readable in the linked detailed PDF; compare both sources before relying on any S7 date."
}
};
export default function TimetablePage(){
const [semester,setSemester]=useState("3");const selected=data[semester];
return <main className="min-h-screen px-4 py-7 sm:px-8"><div className="mx-auto max-w-4xl">
<Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16}/> Dashboard</Link>
<p className="eyebrow mb-2">KTU · B.TECH · NOVEMBER 2026</p><h1 className="text-3xl font-extrabold">Examination timetable</h1>
<p className="mt-2 text-sm text-slate-500">Choose the semester and open the source PDF for the complete course-code list.</p>
<div className="mt-5 flex flex-wrap gap-2">{["3","5","7"].map(value=><button key={value} onClick={()=>setSemester(value)} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${semester===value?"bg-[#315efb] text-white":"border border-slate-200"}`}>Semester {value}</button>)}</div>
<section className="panel mt-5 p-5"><div className="flex items-center gap-2 text-emerald-700"><ShieldCheck size={18}/><b className="text-sm">Source document available</b></div>
<h2 className="mt-3 text-xl font-extrabold">B.Tech S{semester} · {selected.scheme} Scheme</h2><p className="mt-1 text-xs text-slate-500">{selected.publisher}</p>
<div className="mt-5 divide-y divide-slate-100">{selected.slots.map(item=><div key={item.date+item.slot} className="py-4"><div className="flex items-center gap-3"><CalendarDays className="shrink-0 text-blue-600"/><div className="min-w-0 flex-1"><p className="text-sm font-bold">{item.date} · {item.day}</p><p className="text-xs text-slate-500">Slot {item.slot} · {item.time}</p></div></div><ul className="ml-9 mt-2 list-disc space-y-1 text-xs leading-5 text-slate-600">{item.papers.map(paper=><li key={paper}>{paper}</li>)}</ul></div>)}</div>
<div className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"><AlertTriangle size={16} className="mt-0.5 shrink-0"/><p>{selected.note}</p></div>
<a href={selected.source} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700">Open detailed timetable PDF <ExternalLink size={15}/></a>
{selected.secondary&&<a href={selected.secondary} target="_blank" rel="noreferrer" className="ml-4 mt-4 inline-flex items-center gap-2 text-sm font-bold text-slate-600">Compare Entri calendar <ExternalLink size={15}/></a>}
</section>
<p className="mt-4 text-xs leading-5 text-slate-500">Publisher: KTU Notes is an independent academic publisher. The linked document identifies the Controller of Examinations as issuer. This view does not replace any later revised notice. <a className="font-semibold text-blue-700" href="https://ktunotes.in/notifications/" target="_blank" rel="noreferrer">Browse latest notices</a>.</p>
</div></main>;
}
