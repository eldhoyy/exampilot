"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, Sparkles } from "lucide-react";
import { buildStudyPlan, type StudySubject } from "@/lib/planner";

const sample: StudySubject[] = [
  { id:"mp", title:"Manufacturing Process", examDate:"2026-12-03", difficulty:"medium", modules:5, completedModules:0 },
  { id:"mos", title:"Mechanics of Solids", examDate:"2026-12-08", difficulty:"hard", modules:5, completedModules:0 },
  { id:"math", title:"Engineering Mathematics", examDate:"2026-12-12", difficulty:"hard", modules:5, completedModules:0 },
];

export default function StudyPlanPage() {
  const [dailyHours,setDailyHours]=useState(4);
  const [subjects,setSubjects]=useState(sample);
  const plan=useMemo(()=>buildStudyPlan(subjects,dailyHours*60),[subjects,dailyHours]);
  return <main className="min-h-screen px-4 py-7 sm:px-8"><div className="mx-auto max-w-4xl">
    <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16}/> Dashboard</Link>
    <div className="mb-7"><p className="eyebrow mb-2">PERSONAL STUDY PLANNER</p><h1 className="text-3xl font-extrabold tracking-tight">A plan that fits your pace.</h1><p className="mt-2 text-sm text-slate-500">A transparent starter schedule based on exam dates, difficulty and remaining modules.</p></div>
    <section className="panel mb-5 p-5"><label className="block text-sm font-bold">Available study time per day: {dailyHours} hours</label><input className="mt-4 w-full accent-[#315efb]" type="range" min="1" max="10" value={dailyHours} onChange={e=>setDailyHours(Number(e.target.value))}/><div className="mt-1 flex justify-between text-xs text-slate-400"><span>1 hour</span><span>10 hours</span></div></section>
    <section className="panel p-5"><div className="mb-4 flex items-center gap-2"><Sparkles className="text-[#315efb]" size={18}/><h2 className="font-bold">Suggested sessions</h2></div>
      {plan.length===0?<p className="text-sm text-slate-500">No upcoming subjects with unfinished modules. Add subjects and exam dates to generate a plan.</p>:<div className="space-y-3">{plan.slice(0,40).map((s,i)=><div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><div className="rounded-xl bg-blue-50 p-2 text-blue-600"><CalendarDays size={17}/></div><div className="min-w-0 flex-1"><p className="text-sm font-bold">{s.subject}</p><p className="text-xs text-slate-400">{s.date} · {s.reason}</p></div><span className="whitespace-nowrap text-xs font-bold text-slate-600"><Clock3 className="mr-1 inline" size={13}/>{s.minutes} min</span></div>)}</div>}
      <p className="mt-4 text-xs leading-5 text-slate-400">Planning preview only. These example subjects and dates are placeholders, not verified KTU examination data. The planner does not yet account for personal sleep, classes or calendar availability.</p>
    </section>
  </div></main>;
}
