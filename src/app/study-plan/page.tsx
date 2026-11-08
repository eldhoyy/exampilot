"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CalendarDays, Clock3, Coffee, Plus, Sparkles, Trash2 } from "lucide-react";
import { buildStudyPlan, type Difficulty, type StudySubject } from "@/lib/planner";

type SavedSubject = StudySubject & { code?: string };

const todayISO = () => {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-");
};

export default function StudyPlanPage() {
  const [subjects, setSubjects] = useState<SavedSubject[]>([]);
  const [title, setTitle] = useState("");
  const [examDate, setExamDate] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [dailyHours, setDailyHours] = useState(4);
  const [focusMinutes, setFocusMinutes] = useState(50);
  const [breakMinutes, setBreakMinutes] = useState(10);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("exampilot-subjects") || "[]") as Array<{id:string;title:string;code?:string;difficulty:Difficulty;examDate:string}>;
      const converted = saved.filter(s => s.title && s.examDate).map(s => ({...s, modules:5, completedModules:0}));
      const manual = JSON.parse(localStorage.getItem("exampilot-planner-subjects") || "[]") as SavedSubject[];
      const merged = [...converted, ...manual.filter(m => !converted.some(c => c.id === m.id))];
      setSubjects(merged);
    } catch { setSubjects([]); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("exampilot-planner-subjects", JSON.stringify(subjects));
  }, [subjects, ready]);

  const plan = useMemo(() => buildStudyPlan(subjects, dailyHours * 60, new Date(todayISO()+"T00:00:00")), [subjects, dailyHours]);
  const grouped = useMemo(() => plan.reduce<Record<string, typeof plan>>((acc, session) => {
    (acc[session.date] ||= []).push(session);
    return acc;
  }, {}), [plan]);

  function addSubject() {
    if (!title.trim() || !examDate || examDate < todayISO()) return;
    const next = [...subjects, {id: crypto.randomUUID(), title:title.trim(), examDate, difficulty, modules:5, completedModules:0}];
    setSubjects(next); setTitle(""); setExamDate(""); setDifficulty("medium");
  }

  function removeSubject(id:string) { setSubjects(items => items.filter(s => s.id !== id)); }

  return <main className="min-h-screen px-4 py-7 sm:px-8"><div className="mx-auto max-w-4xl">
    <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16}/> Dashboard</Link>
    <div className="mb-7"><p className="eyebrow mb-2">PERSONAL STUDY PLANNER</p><h1 className="text-3xl font-extrabold tracking-tight">A plan that fits your pace.</h1><p className="mt-2 text-sm leading-6 text-slate-500">Add your real exam dates and subject difficulty. ExamPilot creates a daily study routine with planned rest breaks.</p></div>

    <section className="panel mb-5 space-y-4 p-5">
      <div className="flex items-center gap-2"><BookOpen size={18} className="text-blue-600"/><h2 className="font-bold">Your exam subjects</h2></div>
      <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr_1fr_auto]">
        <input aria-label="Subject name" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Subject name" className="min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
        <input aria-label="Exam date" type="date" min={todayISO()} value={examDate} onChange={e=>setExamDate(e.target.value)} className="min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
        <select aria-label="Subject difficulty" value={difficulty} onChange={e=>setDifficulty(e.target.value as Difficulty)} className="rounded-xl border border-slate-200 px-3 py-3 text-sm"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
        <button onClick={addSubject} disabled={!title.trim() || !examDate || examDate < todayISO()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#315efb] px-4 py-3 text-sm font-bold text-white disabled:opacity-40"><Plus size={16}/> Add</button>
      </div>
      {subjects.length ? <div className="space-y-2">{subjects.map(s=><div key={s.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><BookOpen size={17} className="text-blue-600"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{s.title}</p><p className="text-xs text-slate-400">{s.examDate} · {s.difficulty} priority</p></div><button aria-label={"Remove "+s.title} onClick={()=>removeSubject(s.id)} className="p-2 text-slate-400"><Trash2 size={16}/></button></div>)}</div> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No subjects added yet. Add your exam subjects above or import the subjects you entered on the Subjects page.</p>}
    </section>

    <section className="panel mb-5 grid gap-5 p-5 sm:grid-cols-3">
      <div><label className="block text-sm font-bold">Study time per day: {dailyHours}h</label><input aria-label="Study hours per day" className="mt-3 w-full accent-[#315efb]" type="range" min="1" max="10" value={dailyHours} onChange={e=>setDailyHours(Number(e.target.value))}/><p className="mt-1 text-xs text-slate-400">1–10 hours</p></div>
      <div><label className="block text-sm font-bold">Focus session: {focusMinutes} min</label><input aria-label="Focus session minutes" className="mt-3 w-full accent-[#315efb]" type="range" min="25" max="90" step="5" value={focusMinutes} onChange={e=>setFocusMinutes(Number(e.target.value))}/><p className="mt-1 text-xs text-slate-400">Focused study block</p></div>
      <div><label className="block text-sm font-bold">Rest break: {breakMinutes} min</label><input aria-label="Rest break minutes" className="mt-3 w-full accent-[#315efb]" type="range" min="5" max="30" step="5" value={breakMinutes} onChange={e=>setBreakMinutes(Number(e.target.value))}/><p className="mt-1 text-xs text-slate-400">After each focus session</p></div>
    </section>

    <section className="panel p-5">
      <div className="mb-4 flex items-center gap-2"><Sparkles className="text-[#315efb]" size={18}/><h2 className="font-bold">Your suggested study plan</h2></div>
      {!subjects.length ? <p className="text-sm text-slate-500">Add your subjects and exam dates to generate a plan.</p> : !plan.length ? <p className="text-sm text-slate-500">No sessions could be scheduled in the next 30 days. Check your exam dates and remaining preparation time.</p> : <div className="space-y-5">{Object.entries(grouped).map(([date,sessions])=><div key={date}><div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#14213d]"><CalendarDays size={16} className="text-blue-600"/>{new Date(date+"T00:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"})}</div><div className="space-y-2">{sessions.map((s,i)=><div key={s.subjectId+"-"+i}><div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><div className="rounded-xl bg-blue-50 p-2 text-blue-600"><Clock3 size={17}/></div><div className="min-w-0 flex-1"><p className="text-sm font-bold">{s.subject}</p><p className="text-xs text-slate-400">{s.reason}</p></div><span className="whitespace-nowrap text-xs font-bold text-slate-600">{Math.min(s.minutes,focusMinutes)} min</span></div>{i < sessions.length-1 && <div className="flex items-center gap-2 px-4 py-2 text-xs text-emerald-700"><Coffee size={14}/> Rest for {breakMinutes} minutes</div>}</div>)}</div></div>)}</div>}
      <p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">Planning guidance only: each subject is provisionally treated as five study modules. Adjust your subjects and preparation progress as needed. Exam dates are entered by you and are not verified against KTU announcements.</p>
    </section>
  </div></main>;
}
