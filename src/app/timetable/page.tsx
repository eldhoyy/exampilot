"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Profile = { semester: string; scheme: string; branch: string; programme: string };
type Exam = {
  id: string;
  subject_code: string;
  subject_title: string;
  starts_at: string;
  exam_timetables?: {
    version_label: string | null;
    timetable_sources?: { source_title: string | null; source_url: string } | null;
  };
};

export default function TimetablePage() {
  const [official, setOfficial] = useState<Exam[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState("");

  const loadOfficial = useCallback(async (p: Profile) => {
    setLoading(true);
    setError("");
    try {
      const db = createClient();
      const semester = Number(p.semester.replace(/\D/g, ""));
      const schemeYear = Number(p.scheme);
      const [{ data: schemes, error: schemeError }, { data: programmes, error: programmeError }] = await Promise.all([
        db.from("academic_schemes").select("id").eq("scheme_year", schemeYear).eq("is_active", true),
        db.from("programmes").select("id").eq("short_name", p.programme),
      ]);
      if (schemeError) throw schemeError;
      if (programmeError) throw programmeError;
      const schemeId = schemes?.[0]?.id;
      const programmeId = programmes?.[0]?.id;
      if (!schemeId || !programmeId) {
        setOfficial([]);
        setError("The selected KTU scheme or B.Tech programme is not yet in the verified catalogue.");
        return;
      }

      const { data: branches, error: branchError } = await db.from("branches")
        .select("id").eq("programme_id", programmeId).eq("name", p.branch);
      if (branchError) throw branchError;
      const branchId = branches?.[0]?.id;
      if (!branchId) {
        setOfficial([]);
        setError("The selected branch is not yet in the verified curriculum catalogue.");
        return;
      }

      const [{ data: subjects, error: subjectsError }, { data: events, error: eventsError }] = await Promise.all([
        db.from("subjects").select("subject_code").eq("scheme_id", schemeId)
          .eq("branch_id", branchId).eq("semester", semester).eq("verification_status", "verified"),
        db.from("exam_events").select("id,subject_code,subject_title,starts_at,exam_timetables!inner(version_label,scheme_id,programme_id,semester,status,timetable_sources!inner(source_title,source_url,verification_status))")
          .eq("exam_timetables.status", "verified")
          .eq("exam_timetables.scheme_id", schemeId)
          .eq("exam_timetables.programme_id", programmeId)
          .eq("exam_timetables.semester", semester)
          .eq("exam_timetables.timetable_sources.verification_status", "verified")
          .order("starts_at"),
      ]);
      if (subjectsError) throw subjectsError;
      if (eventsError) throw eventsError;
      const branchCodes = new Set((subjects || []).map((s: { subject_code: string }) => s.subject_code));
      const matching = ((events || []) as unknown as Exam[]).filter(e => branchCodes.has(e.subject_code));
      setOfficial(matching);
      setLastChecked(new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }));
      if (!matching.length) setError("No verified timetable papers match this exact branch, scheme and semester yet. ExamPilot will not substitute another branch or invent dates.");
    } catch (e) {
      setOfficial([]);
      setError(e instanceof Error ? e.message : "Could not retrieve the verified KTU timetable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("exampilot-profile-draft") || "null") as Profile | null;
      if (!saved) {
        setError("Complete your academic profile first.");
        setLoading(false);
        return;
      }
      setProfile(saved);
      void loadOfficial(saved);
    } catch {
      setError("Could not read your saved academic profile.");
      setLoading(false);
    }
  }, [loadOfficial]);

  return (
    <main className="min-h-screen px-4 py-7 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16} /> Dashboard</Link>
        <p className="eyebrow mb-2">OFFICIAL EXAMINATION DATES</p>
        <h1 className="text-3xl font-extrabold">Your KTU timetable</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">ExamPilot retrieves verified examination records for your exact programme, scheme, branch and semester. Revised versions must supersede older notices.</p>

        <section className="panel mt-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2"><ShieldCheck className="text-emerald-600" /><h2 className="font-bold">Verified timetable</h2></div>
            {profile && <button onClick={() => void loadOfficial(profile)} disabled={loading} className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button>}
          </div>
          {profile && <p className="mt-2 text-xs text-slate-500">KTU · {profile.programme} · {profile.scheme} scheme · {profile.branch} · {profile.semester}</p>}
          {loading && <p className="mt-4 text-sm text-slate-500">Checking verified KTU records…</p>}
          {error && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">{error}</p>}
          {lastChecked && <p className="mt-3 text-xs text-slate-400">Last checked {lastChecked} · Verified records only</p>}
          {official.map(e => <article key={e.id} className="mt-3 rounded-xl border border-emerald-100 p-3">
            <p className="text-sm font-bold">{e.subject_code} · {e.subject_title}</p>
            <p className="mt-1 text-xs text-slate-600">{new Date(e.starts_at).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} · {e.exam_timetables?.version_label || "Verified timetable"}</p>
            {e.exam_timetables?.timetable_sources?.source_url && <a href={e.exam_timetables.timetable_sources.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-700">{e.exam_timetables.timetable_sources.source_title || "Official source"} <ExternalLink size={12} /></a>}
          </article>)}
        </section>
        <a href="https://ktu.edu.in/exam/Timetable" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-700">Open KTU examination portal <ExternalLink size={14} /></a>
      </div>
    </main>
  );
}
