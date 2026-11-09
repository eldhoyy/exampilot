"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ExternalLink, CalendarDays, ShieldCheck, AlertTriangle } from "lucide-react";

type Slot={date:string;day:string;slot:string;session:string};
type SemesterData={scheme:string;publisher:string;source:string;slots:Slot[];note:string;secondary?:string};
const data:Record<string,SemesterData>={
"3":{
scheme:"2024",
publisher:"KTU Notes detailed notice; compare with KTU Notes Live and KSU Student Assist Cell",
source:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-timetable-of-b-tech-s3-r-s-examinations-november-20-1794048058.pdf",
slots:[
{date:"24 Nov 2026",day:"Tuesday",slot:"A",session:"Afternoon"},
{date:"26 Nov 2026",day:"Thursday",slot:"B",session:"Afternoon"},
{date:"30 Nov 2026",day:"Monday",slot:"C",session:"Afternoon"},
{date:"2 Dec 2026",day:"Wednesday",slot:"D",session:"Afternoon"},
{date:"5 Dec 2026",day:"Saturday",slot:"F",session:"Afternoon"},
{date:"8 Dec 2026",day:"Tuesday",slot:"G",session:"Afternoon"}
],
note:"Semester-wide slots only. KTU Notes Live provides branch-wise course-code mapping; select your department there before relying on a paper date. This page does not yet contain every branch mapping."
},
"5":{
scheme:"2024",
publisher:"KTU Notes detailed notice; compare with KTU Notes Live and KSU Student Assist Cell",
source:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-time-table-of-b-tech-s5-r-exam-november-2026-includ-1794048414.pdf",
slots:[
{date:"23 Nov 2026",day:"Monday",slot:"A",session:"Afternoon"},
{date:"27 Nov 2026",day:"Friday",slot:"B",session:"Afternoon"},
{date:"1 Dec 2026",day:"Tuesday",slot:"C",session:"Afternoon"},
{date:"4 Dec 2026",day:"Friday",slot:"D",session:"Afternoon"},
{date:"7 Dec 2026",day:"Monday",slot:"E",session:"Afternoon"},
{date:"9 Dec 2026",day:"Wednesday",slot:"M",session:"Afternoon"},
{date:"5 Jan 2027",day:"Tuesday",slot:"H",session:"Afternoon"}
],
note:"These are semester-wide slots. Use the detailed PDF to match the course code and paper title. Do not assume every branch has an exam in every slot."
},
"7":{
scheme:"2019",
publisher:"KTU Notes detailed notice; compare with KTU Notes Live and KSU Student Assist Cell",
source:"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-timetable-of-b-tech-s7-r-s-examinations-november-20-1794048779.pdf",
secondary:"https://timetable.ktunotes.live/",
slots:[
{date:"23 Nov 2026",day:"Monday",slot:"A",session:"Forenoon"},
{date:"25 Nov 2026",day:"Wednesday",slot:"B",session:"Forenoon"},
{date:"27 Nov 2026",day:"Friday",slot:"C",session:"Forenoon"},
{date:"30 Nov 2026",day:"Monday",slot:"D",session:"Forenoon"},
{date:"2 Dec 2026",day:"Wednesday",slot:"H",session:"Forenoon"},
{date:"4 Dec 2026",day:"Friday",slot:"M",session:"Forenoon"}
],
note:"This is the consolidated semester slot calendar. Match each subject code in the detailed PDF. The Entri page is a secondary cross-check; the detailed timetable PDF is linked as the source document."
}
};
export default function TimetablePage(){
const [semester,setSemester]=useState("3");const selected=data[semester];
return <main className="min-h-screen px-4 py-7 sm:px-8"><div className="mx-auto max-w-4xl">
<Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16}/> Dashboard</Link>
<p className="eyebrow mb-2">KTU · B.TECH · NOVEMBER 2026</p><h1 className="text-3xl font-extrabold">Examination timetable</h1>
<p className="mt-2 text-sm text-slate-500">Published semester slot calendar. Select your scheme and semester, then confirm your paper code in the detailed PDF.</p>
<div className="mt-5 flex flex-wrap gap-2">{["3","5","7"].map(value=><button key={value} onClick={()=>setSemester(value)} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${semester===value?"bg-[#315efb] text-white":"border border-slate-200"}`}>Semester {value}</button>)}</div>
<section className="panel mt-5 p-5"><div className="flex items-center gap-2 text-blue-700"><ShieldCheck size={18}/><b className="text-sm">Published slot calendar</b></div>
<h2 className="mt-3 text-xl font-extrabold">B.Tech S{semester} · {selected.scheme} Scheme</h2><p className="mt-1 text-xs text-slate-500">{selected.publisher}</p>
<div className="mt-5 divide-y divide-slate-100">{selected.slots.map(item=><div key={item.date+item.slot} className="flex items-center gap-3 py-3"><CalendarDays className="shrink-0 text-blue-600"/><div className="min-w-0 flex-1"><p className="text-sm font-bold">{item.date} · {item.day}</p><p className="text-xs text-slate-500">Slot {item.slot} · {item.session} session</p></div></div>)}</div>
<div className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"><AlertTriangle size={16} className="mt-0.5 shrink-0"/><p>{selected.note}</p></div>
<a href={selected.source} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700">Open detailed timetable PDF <ExternalLink size={15}/></a>
{selected.secondary&&<a href={selected.secondary} target="_blank" rel="noreferrer" className="ml-4 mt-4 inline-flex items-center gap-2 text-sm font-bold text-slate-600">Compare KTU Notes Live <ExternalLink size={15}/></a>}
</section>
<p className="mt-4 text-xs leading-5 text-slate-500">The semester slot calendar is not a substitute for the detailed branch-wise timetable. Sources: KTU Notes and KTU Notes Live. Compare the paper code and date against your department schedule; later revisions may change dates or slots.</p>
</div></main>;
}
