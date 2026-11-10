"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const featureByPath: Record<string, string> = {
  "/": "home",
  "/study-plan": "study_plan",
  "/timetable": "timetable",
  "/study-materials": "study_materials",
  "/ai-tutor": "ai_tutor",
  "/subjects": "subjects",
  "/onboarding": "onboarding",
  "/profile": "profile",
  "/progress": "progress",
};

export default function ActivityTracker() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<"unknown" | "yes" | "no">("unknown");

  useEffect(() => {
    const saved = localStorage.getItem("exampilot-analytics-consent");
    if (saved === "yes" || saved === "no") setConsent(saved);
  }, []);

  useEffect(() => {
    const feature = featureByPath[pathname];
    if (!feature || consent !== "yes") return;

    try {
      const storageKey = "exampilot-visitor-id";
      let visitorId = localStorage.getItem(storageKey);
      if (!visitorId || !/^[0-9a-f-]{36}$/i.test(visitorId)) {
        visitorId = crypto.randomUUID();
        localStorage.setItem(storageKey, visitorId);
      }

      let profile: Record<string, unknown> = {};
      const rawProfile = localStorage.getItem("exampilot-profile-draft");
      if (rawProfile) {
        try { profile = JSON.parse(rawProfile) as Record<string, unknown>; } catch { profile = {}; }
      }

      void fetch("/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          visitor_id: visitorId,
          display_name: profile.name,
          branch: profile.branch,
          semester: profile.semester,
          feature,
          path: pathname,
        }),
      }).catch(() => undefined);
    } catch {
      // Analytics must never prevent the study tools from working.
    }
  }, [pathname, consent]);

  if (consent !== "unknown") return null;

  function choose(value: "yes" | "no") {
    localStorage.setItem("exampilot-analytics-consent", value);
    setConsent(value);
  }

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-2xl shadow-slate-900/15 sm:inset-x-6 sm:bottom-5 sm:p-4" aria-label="Analytics privacy choice">
      <p className="text-sm font-bold text-[var(--ink)]">Help us improve ExamPilot</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">With your permission, we record page visits and your browser ID, plus the name, branch and semester in your profile. No passwords, notes or chat content are collected; declining won’t affect the study tools.</p>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button onClick={() => choose("no")} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">Decline</button>
        <button onClick={() => choose("yes")} className="rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white">Allow usage analytics</button>
      </div>
    </aside>
  );
}
