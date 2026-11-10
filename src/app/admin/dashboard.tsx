"use client";

import { useEffect, useState } from "react";
import { Activity, BookOpen, LogOut, RefreshCw, Users } from "lucide-react";

type Visitor = {
  visitor_id: string; display_name: string | null; branch: string | null; semester: string | null;
  last_seen: string; visits: number; features: string[];
};
type Usage = { users: Visitor[]; featureCounts: Record<string, number>; totalEvents: number };

const featureNames: Record<string, string> = {
  home: "Home", study_plan: "Study Plan", timetable: "Timetable",
  study_materials: "Study Materials", ai_tutor: "AI Doubt Solver", subjects: "Subjects", onboarding: "Onboarding",
};

export default function AdminDashboard() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/usage", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load dashboard.");
      setUsage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dashboard.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const totalVisitors = usage?.users.length ?? 0;
  const popular = Object.entries(usage?.featureCounts ?? {}).sort((a,b)=>b[1]-a[1]);

  return (
    <main className="min-h-screen bg-[#f6f8fc] px-4 py-7 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#315efb]">ExamPilot / Admin</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#14213d]">Usage overview</h1><p className="mt-2 text-sm text-slate-500">Student profile details and feature activity from this browser-based service.</p></div>
          <div className="flex gap-2"><button onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"><RefreshCw size={15}/> Refresh</button><button onClick={logout} className="inline-flex items-center gap-2 rounded-xl bg-[#14213d] px-4 py-2.5 text-sm font-semibold text-white"><LogOut size={15}/> Sign out</button></div>
        </header>

        {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
        <section className="mb-7 grid gap-4 sm:grid-cols-3">
          <Stat icon={<Users size={20}/>} label="Distinct browsers" value={loading ? "…" : totalVisitors.toLocaleString()}/>
          <Stat icon={<Activity size={20}/>} label="Recorded page visits" value={loading ? "…" : (usage?.totalEvents ?? 0).toLocaleString()}/>
          <Stat icon={<BookOpen size={20}/>} label="Features used" value={loading ? "…" : Object.keys(usage?.featureCounts ?? {}).length.toString()}/>
        </section>

        <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-[#14213d]">Feature activity</h2>
          <p className="mb-4 mt-1 text-sm text-slate-500">Total recorded visits by feature (up to the latest 5,000 events).</p>
          {popular.length ? <div className="space-y-3">{popular.map(([key,count])=><div key={key}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="font-medium text-slate-700">{featureNames[key] ?? key}</span><span className="tabular-nums text-slate-500">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#315efb]" style={{width:`${Math.max(3, count / Math.max(...popular.map(([,n])=>n)) * 100)}%`}}/></div></div>)}</div> : <p className="text-sm text-slate-500">{loading ? "Loading activity…" : "No activity recorded yet."}</p>}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6"><h2 className="text-lg font-bold text-[#14213d]">Visitors and student profiles</h2><p className="mt-1 text-sm text-slate-500">A browser is counted separately unless its local browser identifier is retained.</p></div>
          {loading ? <p className="p-6 text-sm text-slate-500">Loading visitors…</p> : !usage?.users.length ? <p className="p-6 text-sm text-slate-500">No visitors have been recorded yet. Open the public site and visit a feature to create the first record.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Name / visitor</th><th className="px-5 py-3">Branch</th><th className="px-5 py-3">Semester</th><th className="px-5 py-3">Features used</th><th className="px-5 py-3">Visits</th><th className="px-5 py-3">Last seen</th></tr></thead><tbody>{usage.users.map(user=><tr key={user.visitor_id} className="border-t border-slate-100 align-top"><td className="px-5 py-4"><p className="font-semibold text-slate-800">{user.display_name || "Anonymous visitor"}</p><p className="mt-1 font-mono text-[10px] text-slate-400">{user.visitor_id.slice(0,8)}…</p></td><td className="px-5 py-4 text-slate-600">{user.branch || "Not provided"}</td><td className="px-5 py-4 text-slate-600">{user.semester || "Not provided"}</td><td className="px-5 py-4"><div className="flex max-w-xs flex-wrap gap-1.5">{user.features.map(feature=><span key={feature} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{featureNames[feature] ?? feature}</span>)}</div></td><td className="px-5 py-4 tabular-nums text-slate-600">{user.visits}</td><td className="px-5 py-4 whitespace-nowrap text-slate-500">{new Date(user.last_seen).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</td></tr>)}</tbody></table></div>}
        </section>
        <p className="mt-5 text-xs leading-5 text-slate-400">Privacy: this dashboard records a random browser ID, the academic profile entered on that browser, feature/page visits and timestamps. It does not collect passwords, notes, or AI conversation content. Visitors can clear their browser storage to reset their browser ID.</p>
      </div>
    </main>
  );
}

function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:string}) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#315efb]">{icon}</div><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-extrabold tabular-nums text-[#14213d]">{value}</p></div>;
}
