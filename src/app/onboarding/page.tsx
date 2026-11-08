"use client";

import { useMemo, useState } from "react";\nimport type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Check, GraduationCap, Sparkles } from "lucide-react";

const branches = [
  "Mechanical Engineering", "Computer Science and Engineering", "Civil Engineering",
  "Electrical and Electronics Engineering", "Electronics and Communication Engineering",
  "Artificial Intelligence and Data Science", "Artificial Intelligence and Machine Learning",
  "Automobile Engineering", "Chemical Engineering", "Biomedical Engineering",
  "Information Technology", "Other",
];

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("APJ Abdul Kalam Technological University (KTU)");
  const [programme, setProgramme] = useState("B.Tech");
  const [scheme, setScheme] = useState("2024");
  const [branch, setBranch] = useState("Mechanical Engineering");
  const [semester, setSemester] = useState("S3");
  const [message, setMessage] = useState("");

  const profileReady = useMemo(() => name.trim().length > 1 && branch.length > 0, [name, branch]);

  function saveDraft() {
    if (!profileReady) {
      setMessage("Please enter your name to continue.");
      return;
    }
    const profile = { name: name.trim(), university, programme, scheme, branch, semester };
    try {
      localStorage.setItem("exampilot-profile-draft", JSON.stringify(profile));
      setMessage("Your academic profile draft is saved on this device. Account sync will be enabled after backend setup.");
    } catch {
      setMessage("Your browser could not save this draft. You can still continue once account sync is available.");
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#315efb]"><ArrowLeft size={16}/> Back to dashboard</Link>
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#315efb] text-white"><GraduationCap size={23}/></div>
          <div><p className="text-lg font-extrabold tracking-tight text-[#14213d]">ExamPilot</p><p className="text-xs text-slate-400">Your academic workspace</p></div>
        </div>
        <section className="panel overflow-hidden">
          <div className="bg-[#14213d] px-6 py-7 text-white sm:px-9 sm:py-9">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100"><Sparkles size={14}/> LET&apos;S SET THINGS UP</div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Start with your academics.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Tell ExamPilot what and where you study. We&apos;ll use this to match the right syllabus, subjects and exam information.</p>
          </div>
          <div className="space-y-6 px-5 py-7 sm:px-9 sm:py-9">
            <div>
              <label htmlFor="student-name" className="mb-2 block text-sm font-bold text-[#263653]">What should we call you?</label>
              <input id="student-name" value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your name" autoComplete="name" className="w-full rounded-xl border border-[#dfe6f1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#315efb] focus:ring-4 focus:ring-blue-100"/>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="University" id="university"><select id="university" value={university} onChange={e=>setUniversity(e.target.value)} className={selectClass}><option>APJ Abdul Kalam Technological University (KTU)</option><option>Other university (coming soon)</option></select></Field>
              <Field label="Programme" id="programme"><select id="programme" value={programme} onChange={e=>setProgramme(e.target.value)} className={selectClass}><option>B.Tech</option><option>M.Tech</option><option>Other</option></select></Field>
              <Field label="Academic scheme" id="scheme"><select id="scheme" value={scheme} onChange={e=>setScheme(e.target.value)} className={selectClass}><option value="2024">KTU 2024 scheme</option><option value="2019">KTU 2019 scheme</option><option value="Not sure">Not sure</option></select></Field>
              <Field label="Branch" id="branch"><select id="branch" value={branch} onChange={e=>setBranch(e.target.value)} className={selectClass}>{branches.map(item=><option key={item}>{item}</option>)}</select></Field>
              <Field label="Current semester" id="semester"><select id="semester" value={semester} onChange={e=>setSemester(e.target.value)} className={selectClass}>{["S1","S2","S3","S4","S5","S6","S7","S8"].map(item=><option key={item}>{item}</option>)}</select></Field>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs leading-5 text-blue-900"><BookOpen size={16} className="mr-2 inline"/> We&apos;ll verify curriculum and timetable information against official university sources before using it in your plan.</div>
            <button onClick={saveDraft} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#315efb] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#244fe8]">Save academic profile <ArrowRight size={17}/></button>
            {message && <p role="status" className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600"><Check size={16} className="mr-2 inline text-emerald-600"/>{message}</p>}
            <p className="text-center text-xs text-slate-400">This is an early setup draft. Secure account sync will be added with Supabase.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

const selectClass = "w-full rounded-xl border border-[#dfe6f1] bg-white px-3.5 py-3 text-sm text-[#263653] outline-none focus:border-[#315efb] focus:ring-4 focus:ring-blue-100";
function Field({label,id,children}:{label:string;id:string;children:ReactNode}) {
  return <div><label htmlFor={id} className="mb-2 block text-sm font-bold text-[#263653]">{label}</label>{children}</div>;
}
