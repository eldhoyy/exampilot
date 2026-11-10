"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Check, GraduationCap, Sparkles } from "lucide-react";

const branches = [
  "Mechanical Engineering", "Computer Science and Engineering", "Civil Engineering",
  "Electrical and Electronics Engineering", "Electronics and Communication Engineering",
  "Artificial Intelligence and Data Science", "Artificial Intelligence and Machine Learning",
  "Automobile Engineering", "Chemical Engineering", "Biomedical Engineering",
  "Information Technology", "Electronics and Instrumentation Engineering", "Aerospace Engineering", "Agricultural Engineering", "Biotechnology", "Food Technology", "Naval Architecture and Ship Building", "Polymer Engineering", "Fire and Safety Engineering", "Robotics and Automation", "Mechatronics Engineering", "Production Engineering", "Other",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
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
    const profile = { name: name.trim(), university, programme, scheme, branch, semester, savedAt: new Date().toISOString() };
    try {
      setSaving(true);
      localStorage.setItem("exampilot-profile-draft", JSON.stringify(profile));
      // Keep the user moving into the next step of setup.
      router.push("/study-plan?setup=1");
    } catch {
      setSaving(false);
      setMessage("We couldn't save your profile on this device. Please check browser storage and try again.");
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[var(--accent)]"><ArrowLeft size={16}/> Back to dashboard</Link>
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-white"><GraduationCap size={23}/></div>
          <div><p className="text-lg font-extrabold tracking-tight text-[var(--ink)]">ExamPilot</p><p className="text-xs text-slate-400">Your academic workspace</p></div>
        </div>
        <section className="panel overflow-hidden">
          <div className="bg-[var(--ink)] px-6 py-7 text-white sm:px-9 sm:py-9">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100"><Sparkles size={14}/> LET&apos;S SET THINGS UP</div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Start with your academics.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Tell ExamPilot what and where you study. We&apos;ll use this to match the right syllabus, subjects and exam information.</p>
          </div>
          <div className="space-y-6 px-5 py-7 sm:px-9 sm:py-9">
            <div>
              <label htmlFor="student-name" className="mb-2 block text-sm font-bold text-[var(--ink)]">What should we call you?</label>
              <input id="student-name" value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your name" autoComplete="name" className="w-full rounded-xl border border-[#dfe6f1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#315efb] focus:ring-4 focus:ring-blue-100"/>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="University" id="university"><select id="university" value={university} onChange={e=>setUniversity(e.target.value)} className={selectClass}><option>APJ Abdul Kalam Technological University (KTU)</option><option>Other university</option></select></Field>
              <Field label="Programme" id="programme"><select id="programme" value={programme} onChange={e=>setProgramme(e.target.value)} className={selectClass}><option>B.Tech</option><option>M.Tech</option><option>Other</option></select></Field>
              <Field label="Academic scheme" id="scheme"><select id="scheme" value={scheme} onChange={e=>setScheme(e.target.value)} className={selectClass}><option value="2024">KTU 2024 scheme</option><option value="2019">KTU 2019 scheme</option><option value="Not sure">Not sure</option></select></Field>
              <Field label="Branch" id="branch"><select id="branch" value={branch} onChange={e=>setBranch(e.target.value)} className={selectClass}>{branches.map(item=><option key={item}>{item}</option>)}</select></Field>
              <Field label="Current semester" id="semester"><select id="semester" value={semester} onChange={e=>setSemester(e.target.value)} className={selectClass}>{["S1","S2","S3","S4","S5","S6","S7","S8"].map(item=><option key={item}>{item}</option>)}</select></Field>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-4 text-xs leading-5 text-blue-900"><BookOpen size={16} className="mr-2 inline"/> We&apos;ll match timetable notices and linked KTU-issued PDFs from trusted academic publishers before using dates in your plan.</div>
            <button onClick={saveDraft} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#244fe8]">{saving ? "Saving…" : "Save academic profile"} <ArrowRight size={17}/></button>
            {message && <p role="status" className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600"><Check size={16} className="mr-2 inline text-[var(--accent)]"/>{message}</p>}
            <p className="text-center text-xs text-slate-400">Your profile is saved in this browser. Account sync is not available.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

const selectClass = "w-full rounded-xl border border-[#dfe6f1] bg-white px-3.5 py-3 text-sm text-[var(--ink)] outline-none focus:border-[#315efb] focus:ring-4 focus:ring-blue-100";
function Field({label,id,children}:{label:string;id:string;children:ReactNode}) {
  return <div><label htmlFor={id} className="mb-2 block text-sm font-bold text-[var(--ink)]">{label}</label>{children}</div>;
}
